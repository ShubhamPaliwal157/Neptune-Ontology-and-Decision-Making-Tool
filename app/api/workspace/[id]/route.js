import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { hasPermission, PERMISSIONS } from '@/lib/workspacePermissions'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

/**
 * GET /api/workspace/[id]
 * Get workspace details with user's role
 */
export async function GET(request, { params }) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')

    if (!userId) {
      return NextResponse.json({ error: 'Missing user_id' }, { status: 400 })
    }

    // Get workspace first to check ownership
    const { data: workspace, error: workspaceError } = await supabaseAdmin
      .from('workspaces')
      .select('*')
      .eq('id', id)
      .single()

    if (workspaceError || !workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    // Check if user is owner OR has permission via members table
    const isOwner = String(workspace.owner_id) === String(userId)
    
    if (!isOwner) {
      // Only check permissions if not owner
      const canView = await hasPermission(id, userId, PERMISSIONS.VIEW_WORKSPACE)
      if (!canView) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    // Get user's role from workspace_members
    const { data: member } = await supabaseAdmin
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', id)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    // CRITICAL: Owner check takes precedence over member table
    const role = isOwner ? 'owner' : (member?.role || null)
    
    console.log('[Workspace API] Role resolution', {
      workspaceId: id,
      ownerId: workspace.owner_id,
      ownerIdType: typeof workspace.owner_id,
      userId,
      userIdType: typeof userId,
      isOwner,
      memberRole: member?.role,
      finalRole: role
    })

    return NextResponse.json({ 
      workspace: {
        id: workspace.id,
        name: workspace.name,
        owner_id: workspace.owner_id,
        domains: workspace.domains,
        is_collaborative: workspace.is_collaborative,
        created_at: workspace.created_at,
      },
      role 
    })
  } catch (err) {
    console.error('[get workspace]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/**
 * PATCH /api/workspace/[id]
 * Update workspace metadata (name, description, etc.)
 */
export async function PATCH(request, { params }) {
  try {
    const { id } = await params
    const { user_id, updates } = await request.json()

    if (!user_id || !updates) {
      return NextResponse.json({ error: 'Missing user_id or updates' }, { status: 400 })
    }

    // Check if user can edit workspace metadata
    const canEdit = await hasPermission(id, user_id, PERMISSIONS.EDIT_WORKSPACE_METADATA)
    if (!canEdit) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Allowed fields to update
    const allowedFields = ['name', 'description', 'domains', 'is_collaborative', 'visibility']
    const filteredUpdates = {}
    
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field]
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    // Update workspace
    const { data: workspace, error } = await supabaseAdmin
      .from('workspaces')
      .update(filteredUpdates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log activity
    await supabaseAdmin.from('workspace_activity').insert({
      workspace_id: id,
      user_id,
      action: 'workspace_updated',
      entity_type: 'workspace',
      entity_id: id,
      entity_data: { updates: Object.keys(filteredUpdates) },
    })

    return NextResponse.json({ workspace, success: true })
  } catch (err) {
    console.error('[update workspace]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

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