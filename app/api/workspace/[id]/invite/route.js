import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { hasPermission, PERMISSIONS } from '@/lib/workspacePermissions'
import crypto from 'crypto'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

/**
 * POST /api/workspace/[id]/invite
 * Create an invite link for a workspace
 */
export async function POST(request, { params }) {
  try {
    const { id } = await params
    const { user_id, email, role = 'editor' } = await request.json()

    if (!user_id || !email) {
      return NextResponse.json({ error: 'Missing user_id or email' }, { status: 400 })
    }

    // Validate role
    if (!['editor', 'viewer'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role. Must be editor or viewer' }, { status: 400 })
    }

    // Check if user can manage members
    const canManage = await hasPermission(id, user_id, PERMISSIONS.MANAGE_MEMBERS)
    if (!canManage) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Check if user is already a member
    const { data: existingMember } = await supabaseAdmin
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', id)
      .eq('user_id', (await supabaseAdmin.auth.admin.getUserByEmail(email)).data?.user?.id)
      .single()

    if (existingMember) {
      return NextResponse.json({ error: 'User is already a member' }, { status: 400 })
    }

    // Check for existing pending invite
    const { data: existingInvite } = await supabaseAdmin
      .from('workspace_invites')
      .select('*')
      .eq('workspace_id', id)
      .eq('email', email)
      .is('accepted_at', null)
      .is('declined_at', null)
      .single()

    if (existingInvite && new Date(existingInvite.expires_at) > new Date()) {
      // Return existing valid invite
      const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/workspace/${id}/join?token=${existingInvite.token}`
      return NextResponse.json({ 
        invite: existingInvite, 
        inviteUrl,
        message: 'Existing invite found'
      })
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days expiry

    // Create invite
    const { data: invite, error } = await supabaseAdmin
      .from('workspace_invites')
      .insert({
        workspace_id: id,
        invited_by: user_id,
        email,
        role,
        token,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Generate invite URL
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/workspace/${id}/join?token=${token}`

    return NextResponse.json({ 
      invite, 
      inviteUrl,
      success: true 
    })
  } catch (err) {
    console.error('[create invite]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/**
 * GET /api/workspace/[id]/invite?token=xxx
 * Get invite details
 */
export async function GET(request, { params }) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 })
    }

    // Get invite with workspace details
    const { data: invite, error } = await supabaseAdmin
      .from('workspace_invites')
      .select(`
        *,
        workspace:workspaces (
          id,
          name,
          description
        ),
        inviter:invited_by (
          email,
          raw_user_meta_data
        )
      `)
      .eq('token', token)
      .eq('workspace_id', id)
      .single()

    if (error || !invite) {
      return NextResponse.json({ error: 'Invalid invite' }, { status: 404 })
    }

    // Check if already accepted/declined
    if (invite.accepted_at) {
      return NextResponse.json({ error: 'Invite already accepted' }, { status: 400 })
    }
    if (invite.declined_at) {
      return NextResponse.json({ error: 'Invite was declined' }, { status: 400 })
    }

    // Check if expired
    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Invite has expired' }, { status: 400 })
    }

    return NextResponse.json({ invite })
  } catch (err) {
    console.error('[get invite]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/**
 * DELETE /api/workspace/[id]/invite
 * Revoke/decline an invite
 */
export async function DELETE(request, { params }) {
  try {
    const { id } = await params
    const { user_id, invite_id, action = 'revoke' } = await request.json()

    if (!invite_id) {
      return NextResponse.json({ error: 'Missing invite_id' }, { status: 400 })
    }

    if (action === 'revoke') {
      // Only owner can revoke
      const canManage = await hasPermission(id, user_id, PERMISSIONS.MANAGE_MEMBERS)
      if (!canManage) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }

      // Delete invite
      const { error } = await supabaseAdmin
        .from('workspace_invites')
        .delete()
        .eq('id', invite_id)
        .eq('workspace_id', id)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    } else if (action === 'decline') {
      // Mark as declined
      const { error } = await supabaseAdmin
        .from('workspace_invites')
        .update({ declined_at: new Date().toISOString() })
        .eq('id', invite_id)
        .eq('workspace_id', id)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[delete invite]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
