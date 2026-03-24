import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

/**
 * GET /api/workspace/[id]/context
 * Returns { feed, decisions, context, workspace } for a workspace.
 * Tries to load generated JSON files from storage; falls back to null.
 */
export async function GET(request, { params }) {
  try {
    const { id } = await params

    // Load workspace record
    const { data: workspace, error } = await supabaseAdmin
      .from('workspaces')
      .select('id, name, domains, storage_backend, google_folder_id, google_access_token, google_refresh_token, owner_id, node_count, edge_count, created_at, last_opened_at')
      .eq('id', id)
      .single()

    if (error || !workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    // Load all three files in parallel
    const [feed, decisions, context] = await Promise.all([
      loadFile(workspace, 'feed.json'),
      loadFile(workspace, 'decisions.json'),
      loadFile(workspace, 'context.json'),
    ])

    return NextResponse.json({
      workspace: {
        id: workspace.id,
        name: workspace.name,
        domains: workspace.domains || [],
        node_count: workspace.node_count || 0,
        edge_count: workspace.edge_count || 0,
        created_at: workspace.created_at,
        last_opened_at: workspace.last_opened_at,
      },
      feed: feed || null,
      decisions: decisions || null,
      context: context || null,
    })
  } catch (err) {
    console.error('[workspace/context]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// ── Load a file from Drive or Supabase Storage ────────────────────────────────
async function loadFile(workspace, filename) {
  try {
    if (workspace.storage_backend === 'drive' && workspace.google_folder_id) {
      return await loadFromDrive(workspace, filename)
    } else {
      return await loadFromSupabaseStorage(workspace.id, filename)
    }
  } catch {
    return null
  }
}

async function loadFromDrive(workspace, filename) {
  let accessToken = workspace.google_access_token

  // Try token refresh
  try {
    const refreshRes = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/refresh`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace_id: workspace.id, user_id: workspace.owner_id }),
      }
    )
    if (refreshRes.ok) {
      const { access_token } = await refreshRes.json()
      if (access_token) accessToken = access_token
    }
  } catch { /* ignore */ }

  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?` +
      new URLSearchParams({
        q: `'${workspace.google_folder_id}' in parents and name = '${filename}' and trashed = false`,
        fields: 'files(id,name)',
        pageSize: '1',
      }),
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )

  const searchData = await searchRes.json()
  const file = searchData.files?.[0]
  if (!file) return null

  const fileRes = await fetch(
    `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )

  if (!fileRes.ok) return null
  return fileRes.json()
}

async function loadFromSupabaseStorage(workspaceId, filename) {
  const { data, error } = await supabaseAdmin.storage
    .from('workspace-outputs')
    .download(`${workspaceId}/${filename}`)

  if (error || !data) return null
  const text = await data.text()
  return JSON.parse(text)
}
