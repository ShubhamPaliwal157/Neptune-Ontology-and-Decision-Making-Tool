import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { hasPermission, PERMISSIONS } from '@/lib/workspacePermissions'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

/**
 * GET /api/workspace/[id]/sources
 * List all sources for a workspace
 */
export async function GET(request, { params }) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')

    if (!userId) {
      return NextResponse.json({ error: 'Missing user_id' }, { status: 400 })
    }

    // Check if user has access to view workspace
    const canView = await hasPermission(id, userId, PERMISSIONS.VIEW_WORKSPACE)
    if (!canView) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get all sources for workspace
    const { data: sources, error } = await supabaseAdmin
      .from('workspace_sources')
      .select('*')
      .eq('workspace_id', id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ sources })
  } catch (err) {
    console.error('[get sources]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/**
 * POST /api/workspace/[id]/sources
 * Add a new source to workspace
 */
export async function POST(request, { params }) {
  try {
    const { id } = await params
    const { user_id, type, url, keyword, name, description, metadata = {} } = await request.json()

    if (!user_id) {
      return NextResponse.json({ error: 'Missing user_id' }, { status: 400 })
    }

    // Validate source data
    if (!type || !['static', 'dynamic', 'keyword', 'api', 'dataset'].includes(type)) {
      return NextResponse.json({ error: 'Invalid source type' }, { status: 400 })
    }

    if (type === 'keyword' && !keyword) {
      return NextResponse.json({ error: 'Keyword required for keyword source' }, { status: 400 })
    }

    if (['static', 'dynamic', 'api'].includes(type) && !url) {
      return NextResponse.json({ error: 'URL required for this source type' }, { status: 400 })
    }

    // Check if user can add sources
    const canAdd = await hasPermission(id, user_id, PERMISSIONS.ADD_SOURCE)
    if (!canAdd) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Create source
    const { data: source, error } = await supabaseAdmin
      .from('workspace_sources')
      .insert({
        workspace_id: id,
        owner_id: user_id,
        type,
        url: url || null,
        keyword: keyword || null,
        name: name || null,
        description: description || null,
        metadata,
        status: 'pending',
        updated_by: user_id,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log activity
    await supabaseAdmin.from('workspace_activity').insert({
      workspace_id: id,
      user_id,
      action: 'source_added',
      entity_type: 'source',
      entity_id: source.id,
      entity_data: { type, name: name || url || keyword },
    })

    return NextResponse.json({ source, success: true })
  } catch (err) {
    console.error('[add source]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/**
 * PATCH /api/workspace/[id]/sources
 * Update an existing source
 */
export async function PATCH(request, { params }) {
  try {
    const { id } = await params
    const { user_id, source_id, updates } = await request.json()

    if (!user_id || !source_id || !updates) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if user can edit sources
    const canEdit = await hasPermission(id, user_id, PERMISSIONS.EDIT_SOURCE)
    if (!canEdit) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Allowed fields to update
    const allowedFields = ['name', 'description', 'url', 'keyword', 'metadata', 'status']
    const filteredUpdates = {}
    
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field]
      }
    }

    filteredUpdates.updated_at = new Date().toISOString()
    filteredUpdates.updated_by = user_id

    // Update source
    const { data: source, error } = await supabaseAdmin
      .from('workspace_sources')
      .update(filteredUpdates)
      .eq('id', source_id)
      .eq('workspace_id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log activity
    await supabaseAdmin.from('workspace_activity').insert({
      workspace_id: id,
      user_id,
      action: 'source_updated',
      entity_type: 'source',
      entity_id: source_id,
      entity_data: { updates: Object.keys(filteredUpdates) },
    })

    return NextResponse.json({ source, success: true })
  } catch (err) {
    console.error('[update source]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/**
 * DELETE /api/workspace/[id]/sources
 * Delete a source from workspace
 */
export async function DELETE(request, { params }) {
  try {
    const { id } = await params
    const { user_id, source_id } = await request.json()

    if (!user_id || !source_id) {
      return NextResponse.json({ error: 'Missing user_id or source_id' }, { status: 400 })
    }

    // Check if user can delete sources
    const canDelete = await hasPermission(id, user_id, PERMISSIONS.DELETE_SOURCE)
    if (!canDelete) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Delete source
    const { error } = await supabaseAdmin
      .from('workspace_sources')
      .delete()
      .eq('id', source_id)
      .eq('workspace_id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log activity
    await supabaseAdmin.from('workspace_activity').insert({
      workspace_id: id,
      user_id,
      action: 'source_deleted',
      entity_type: 'source',
      entity_id: source_id,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[delete source]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
