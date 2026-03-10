import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Call this before any Drive API operation to ensure token is fresh
export async function POST(request) {
  const { workspace_id, user_id } = await request.json()

  const { data: ws, error } = await supabase
    .from('workspaces')
    .select('google_refresh_token, google_token_expiry, google_access_token')
    .eq('id', workspace_id)
    .eq('owner_id', user_id)
    .single()

  if (error || !ws) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
  }

  // Check if token is still valid (with 5 min buffer)
  const expiry = new Date(ws.google_token_expiry).getTime()
  if (expiry - Date.now() > 5 * 60 * 1000) {
    return NextResponse.json({ access_token: ws.google_access_token })
  }

  if (!ws.google_refresh_token) {
    return NextResponse.json({ error: 'No refresh token — user must reconnect Drive' }, { status: 401 })
  }

  // Refresh the token
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: ws.google_refresh_token,
      client_id:     process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      grant_type:    'refresh_token',
    }),
  })
  const tokens = await res.json()

  if (!res.ok || tokens.error) {
    return NextResponse.json({ error: tokens.error_description || 'Refresh failed' }, { status: 401 })
  }

  const newExpiry = new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString()
  await supabase.from('workspaces').update({
    google_access_token: tokens.access_token,
    google_token_expiry: newExpiry,
  }).eq('id', workspace_id)

  return NextResponse.json({ access_token: tokens.access_token })
}