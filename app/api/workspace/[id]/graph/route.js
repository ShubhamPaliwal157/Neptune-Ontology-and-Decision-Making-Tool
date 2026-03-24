import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(request, { params }) {
  try {
    const { id } = await params

    // Verify ownership via user_id query param (passed from client)
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')

    // 1. Load workspace record — enforce ownership if user_id provided
    let dbQuery = supabaseAdmin
      .from('workspaces')
      .select('id, storage_backend, google_folder_id, google_access_token, google_refresh_token, owner_id')
      .eq('id', id)

    if (user_id) {
      dbQuery = dbQuery.eq('owner_id', user_id)
    }

    const { data: workspace, error } = await dbQuery.single()

    if (error || !workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    // 2. Load graph.json from wherever it was saved
    let graph = null

    if (workspace.storage_backend === 'drive' && workspace.google_folder_id) {
      graph = await loadFromDrive(workspace)
    } else {
      graph = await loadFromSupabaseStorage(workspace.id)
    }

    if (!graph) {
      return NextResponse.json({ error: 'Graph not found — workspace may still be processing' }, { status: 404 })
    }

    return NextResponse.json(graph)
  } catch (err) {
    console.error('[graph route]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// ── Load from Google Drive ────────────────────────────────────────────────────
async function loadFromDrive(workspace) {
  // Try to refresh the token first so we don't fail on expiry
  let accessToken = workspace.google_access_token

  try {
    const refreshRes = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/refresh`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: workspace.id,
          user_id: workspace.owner_id,
        }),
      }
    )
    if (refreshRes.ok) {
      const { access_token } = await refreshRes.json()
      if (access_token) accessToken = access_token
    }
  } catch {
    // Ignore refresh failure — try with current token
  }

  // Search for graph.json inside the workspace Drive folder
  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?` +
      new URLSearchParams({
        q: `'${workspace.google_folder_id}' in parents and name = 'graph.json' and trashed = false`,
        fields: 'files(id,name)',
        pageSize: '1',
      }),
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )

  const searchData = await searchRes.json()
  const file = searchData.files?.[0]
  if (!file) return null

  // Download the file content
  const fileRes = await fetch(
    `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )

  if (!fileRes.ok) return null
  return fileRes.json()
}

// ── Load from Supabase Storage ────────────────────────────────────────────────
async function loadFromSupabaseStorage(workspaceId) {
  const { data, error } = await supabaseAdmin.storage
    .from('workspace-outputs')
    .download(`${workspaceId}/graph.json`)

  if (error || !data) return null

  const text = await data.text()
  return JSON.parse(text)
}