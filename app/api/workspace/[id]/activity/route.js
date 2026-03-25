import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { hasPermission, PERMISSIONS } from '@/lib/workspacePermissions'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

/**
 * GET /api/workspace/[id]/activity
 * Get activity log for workspace (for real-time sync)
 */
export async function GET(request, { params }) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const since = searchParams.get('since') // ISO timestamp
    const limit = parseInt(searchParams.get('limit') || '50')

    if (!userId) {
      return NextResponse.json({ error: 'Missing user_id' }, { status: 400 })
    }

    // Check if user has access to view workspace
    const canView = await hasPermission(id, userId, PERMISSIONS.VIEW_WORKSPACE)
    if (!canView) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Build query
    let query = supabaseAdmin
      .from('workspace_activity')
      .select(`
        *,
        user:user_id (
          email,
          raw_user_meta_data
        )
      `)
      .eq('workspace_id', id)
      .order('created_at', { ascending: false })
      .limit(limit)

    // Filter by timestamp if provided
    if (since) {
      query = query.gt('created_at', since)
    }

    const { data: activities, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ activities })
  } catch (err) {
    console.error('[get activity]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/**
 * POST /api/workspace/[id]/activity
 * Log an activity (entity added, deleted, etc.)
 */
export async function POST(request, { params }) {
  try {
    const { id } = await params
    const { user_id, action, entity_type, entity_id, entity_data } = await request.json()

    if (!user_id || !action) {
      return NextResponse.json({ error: 'Missing user_id or action' }, { status: 400 })
    }

    // Check if user has access to workspace
    const canView = await hasPermission(id, user_id, PERMISSIONS.VIEW_WORKSPACE)
    if (!canView) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Create activity log
    const { data: activity, error } = await supabaseAdmin
      .from('workspace_activity')
      .insert({
        workspace_id: id,
        user_id,
        action,
        entity_type: entity_type || null,
        entity_id: entity_id || null,
        entity_data: entity_data || null,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ activity, success: true })
  } catch (err) {
    console.error('[log activity]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
