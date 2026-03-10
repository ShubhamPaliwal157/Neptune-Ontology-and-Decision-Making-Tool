import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Service role key — server only, never exposed to browser.
// Bypasses RLS so the callback can write tokens to the workspace row.
// Security is maintained by filtering strictly on both id AND owner_id.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const code      = searchParams.get('code')
  const state     = searchParams.get('state')
  const error     = searchParams.get('error')
  const origin    = new URL(request.url).origin

  if (error || !code) {
    return NextResponse.redirect(`${origin}/dashboard/new?drive_error=${error || 'no_code'}`)
  }

  const [workspaceId, userId] = (state || '').split(':')
  if (!workspaceId || !userId) {
    return NextResponse.redirect(`${origin}/dashboard/new?drive_error=bad_state`)
  }

  try {
    const origin = new URL(request.url).origin
    console.log('Redirect URI used:', `${origin}/api/auth/google/callback`)
    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id:     process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri:  `${origin}/api/auth/google/callback`,
        grant_type:    'authorization_code',
      }),
    })
    const tokens = await tokenRes.json()
    console.log('Token response status:', tokenRes.status)
    console.log('Token response:', JSON.stringify(tokens))

    if (!tokenRes.ok || tokens.error) {
      throw new Error(tokens.error_description || 'Token exchange failed')
    }

    // Create a dedicated Drive folder for this workspace
    const folderRes = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `Neptune — ${workspaceId}`,
        mimeType: 'application/vnd.google-apps.folder',
      }),
    })
    const folder = await folderRes.json()

    if (!folderRes.ok || folder.error) {
      throw new Error(folder.error?.message || 'Could not create Drive folder')
    }

    console.log('SERVICE_ROLE_KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
    console.log('SERVICE_ROLE_KEY prefix:', process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 20))
    // Save tokens + folder info to Supabase
    const expiry = new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString()
    const { error: dbError } = await supabaseAdmin
      .from('workspaces')
      .update({
        google_access_token:  tokens.access_token,
        google_refresh_token: tokens.refresh_token || null,
        google_token_expiry:  expiry,
        google_folder_id:     folder.id,
        google_folder_name:   folder.name,
        drive_connected:      true,
      })
      .eq('id', workspaceId)
      .eq('owner_id', userId)

    if (dbError) {
      console.log('Supabase update error:', JSON.stringify(dbError))
      console.log('Workspace ID:', workspaceId, 'User ID:', userId)
      throw new Error(dbError.message)
    }

    // Redirect back to creation flow — signal success
    return NextResponse.redirect(
      `${origin}/dashboard/new?drive_connected=1&workspace_id=${workspaceId}`
    )
  } catch (err) {
    console.error('Google OAuth error:', err)
    return NextResponse.redirect(
      `${origin}/dashboard/new?drive_error=${encodeURIComponent(err.message)}&workspace_id=${workspaceId}`
    )
  }
}