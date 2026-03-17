import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function DELETE(request, { params }) {
  try {
    const { id } = await params
    const { user_id } = await request.json()

    if (!id || !user_id) {
      return NextResponse.json({ error: 'Missing id or user_id' }, { status: 400 })
    }

    // Verify ownership before deleting
    const { data: workspace, error: fetchError } = await supabaseAdmin
      .from('workspaces')
      .select('id, owner_id, storage_backend')
      .eq('id', id)
      .eq('owner_id', user_id)
      .single()

    if (fetchError || !workspace) {
      return NextResponse.json({ error: 'Workspace not found or access denied' }, { status: 404 })
    }

    // Delete storage files if using Supabase Storage
    if (workspace.storage_backend !== 'drive') {
      const { data: files } = await supabaseAdmin.storage
        .from('workspace-outputs')
        .list(id)
      if (files?.length) {
        await supabaseAdmin.storage
          .from('workspace-outputs')
          .remove(files.map(f => `${id}/${f.name}`))
      }
    }

    // Delete related records in order (sources, jobs, then workspace)
    await supabaseAdmin.from('workspace_sources').delete().eq('workspace_id', id)
    await supabaseAdmin.from('processing_jobs').delete().eq('workspace_id', id)
    await supabaseAdmin.from('workspaces').delete().eq('id', id).eq('owner_id', user_id)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[delete workspace]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}