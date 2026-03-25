import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { hasPermission, getWorkspaceMembers, PERMISSIONS } from '@/lib/workspacePermissions'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

/**
 * GET /api/workspace/[id]/members
 * List all members of a workspace
 */
export async function GET(request, { params }) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')

    if (!userId) {
      return NextResponse.json({ error: 'Missing user_id' }, { status: 400 })
    }

    // Check if user has access to view members
    const canView = await hasPermission(id, userId, PERMISSIONS.VIEW_WORKSPACE)
    if (!canView) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { members, error } = await getWorkspaceMembers(id)
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ members })
  } catch (err) {
    console.error('[get members]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/**
 * POST /api/workspace/[id]/members
 * Add a member to workspace (after accepting invite)
 */
export async function POST(request, { params }) {
  try {
    const { id } = await params
    const { user_id, invite_token } = await request.json()

    if (!user_id || !invite_token) {
      return NextResponse.json({ error: 'Missing user_id or invite_token' }, { status: 400 })
    }

    // Verify invite token
    const { data: invite, error: inviteError } = await supabaseAdmin
      .from('workspace_invites')
      .select('*')
      .eq('token', invite_token)
      .eq('workspace_id', id)
      .is('accepted_at', null)
      .is('declined_at', null)
      .single()

    if (inviteError || !invite) {
      return NextResponse.json({ error: 'Invalid or expired invite' }, { status: 404 })
    }

    // Check if invite expired
    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Invite has expired' }, { status: 400 })
    }

    // Add user as member
    const { data: member, error: memberError } = await supabaseAdmin
      .from('workspace_members')
      .insert({
        workspace_id: id,
        user_id,
        role: invite.role,
        invited_by: invite.invited_by,
        status: 'active',
        joined_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (memberError) {
      return NextResponse.json({ error: memberError.message }, { status: 500 })
    }

    // Mark invite as accepted
    await supabaseAdmin
      .from('workspace_invites')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invite.id)

    return NextResponse.json({ member, success: true })
  } catch (err) {
    console.error('[add member]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/**
 * PATCH /api/workspace/[id]/members
 * Update member role
 */
export async function PATCH(request, { params }) {
  try {
    const { id } = await params
    const { user_id, member_id, new_role } = await request.json()

    if (!user_id || !member_id || !new_role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if user can manage members
    const canManage = await hasPermission(id, user_id, PERMISSIONS.MANAGE_MEMBERS)
    if (!canManage) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Update member role
    const { data, error } = await supabaseAdmin
      .from('workspace_members')
      .update({ role: new_role })
      .eq('id', member_id)
      .eq('workspace_id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ member: data, success: true })
  } catch (err) {
    console.error('[update member]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/**
 * DELETE /api/workspace/[id]/members
 * Remove a member from workspace
 */
export async function DELETE(request, { params }) {
  try {
    const { id } = await params
    const { user_id, member_id } = await request.json()

    if (!user_id || !member_id) {
      return NextResponse.json({ error: 'Missing user_id or member_id' }, { status: 400 })
    }

    // Check if user can manage members
    const canManage = await hasPermission(id, user_id, PERMISSIONS.MANAGE_MEMBERS)
    if (!canManage) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Cannot remove owner
    const { data: member } = await supabaseAdmin
      .from('workspace_members')
      .select('role')
      .eq('id', member_id)
      .single()

    if (member?.role === 'owner') {
      return NextResponse.json({ error: 'Cannot remove workspace owner' }, { status: 400 })
    }

    // Remove member
    const { error } = await supabaseAdmin
      .from('workspace_members')
      .delete()
      .eq('id', member_id)
      .eq('workspace_id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[remove member]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
