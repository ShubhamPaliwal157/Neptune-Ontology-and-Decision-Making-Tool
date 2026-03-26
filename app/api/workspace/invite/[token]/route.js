import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

/**
 * GET /api/workspace/invite/[token]
 * Get invite details
 */
export async function GET(request, { params }) {
  try {
    const { token } = await params

    // Get invite
    const { data: invite, error } = await supabaseAdmin
      .from('workspace_invites')
      .select('*, workspace:workspace_id(name)')
      .eq('token', token)
      .is('accepted_at', null)
      .is('declined_at', null)
      .single()

    if (error || !invite) {
      return NextResponse.json({ error: 'Invite not found or expired' }, { status: 404 })
    }

    // Check if expired
    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Invite has expired' }, { status: 410 })
    }

    return NextResponse.json({
      workspace_id: invite.workspace_id,
      workspace_name: invite.workspace?.name || 'Workspace',
      role: invite.role,
      invited_by: invite.invited_by,
      email: invite.email,
    })
  } catch (err) {
    console.error('[get invite]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
