import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

/**
 * POST /api/workspace/invite/[token]/accept
 * Accept workspace invite
 */
export async function POST(request, { params }) {
  try {
    const { token } = await params
    const { user_id } = await request.json()

    if (!user_id) {
      return NextResponse.json({ error: 'Missing user_id' }, { status: 400 })
    }

    // Get invite
    const { data: invite, error: inviteError } = await supabaseAdmin
      .from('workspace_invites')
      .select('*')
      .eq('token', token)
      .is('accepted_at', null)
      .is('declined_at', null)
      .single()

    if (inviteError || !invite) {
      return NextResponse.json({ error: 'Invite not found or already used' }, { status: 404 })
    }

    // Check if expired
    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Invite has expired' }, { status: 410 })
    }

    // Get user email to verify
    const { data: user } = await supabaseAdmin.auth.admin.getUserById(user_id)
    
    if (!user || user.user.email !== invite.email) {
      return NextResponse.json({ error: 'Email mismatch. Please log in with the invited email.' }, { status: 403 })
    }

    // Check if already a member
    const { data: existingMember } = await supabaseAdmin
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', invite.workspace_id)
      .eq('user_id', user_id)
      .single()

    if (existingMember) {
      // Mark invite as accepted
      await supabaseAdmin
        .from('workspace_invites')
        .update({ accepted_at: new Date().toISOString() })
        .eq('id', invite.id)

      return NextResponse.json({ 
        success: true, 
        workspace_id: invite.workspace_id,
        message: 'Already a member' 
      })
    }

    // Add user to workspace
    const { error: memberError } = await supabaseAdmin
      .from('workspace_members')
      .insert({
        workspace_id: invite.workspace_id,
        user_id,
        role: invite.role,
        invited_by: invite.invited_by,
        status: 'active',
        joined_at: new Date().toISOString(),
      })

    if (memberError) {
      return NextResponse.json({ error: memberError.message }, { status: 500 })
    }

    // Mark invite as accepted
    await supabaseAdmin
      .from('workspace_invites')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invite.id)

    // Log activity
    await supabaseAdmin.from('workspace_activity').insert({
      workspace_id: invite.workspace_id,
      user_id,
      action: 'member_joined',
      entity_type: 'member',
      entity_id: user_id,
      entity_data: { role: invite.role, via: 'invite' },
    })

    // Update workspace member count
    await supabaseAdmin.rpc('increment_member_count', { workspace_id: invite.workspace_id })

    return NextResponse.json({ 
      success: true, 
      workspace_id: invite.workspace_id 
    })
  } catch (err) {
    console.error('[accept invite]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
