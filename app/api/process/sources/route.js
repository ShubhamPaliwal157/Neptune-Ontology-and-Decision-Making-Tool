import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Call this right after workspace creation to persist sources
export async function POST(request) {
  try {
    const { workspace_id, user_id, staticSources, dynamicSources, keywords } = await request.json()

    if (!workspace_id || !user_id) {
      return NextResponse.json({ error: 'Missing workspace_id or user_id' }, { status: 400 })
    }

    const rows = [
      ...(staticSources  || []).map(url     => ({ workspace_id, owner_id: user_id, type: 'static',  url })),
      ...(dynamicSources || []).map(url     => ({ workspace_id, owner_id: user_id, type: 'dynamic', url })),
      ...(keywords       || []).map(keyword => ({ workspace_id, owner_id: user_id, type: 'keyword', keyword })),
    ]

    if (rows.length === 0) {
      return NextResponse.json({ saved: 0 })
    }

    const { error } = await supabaseAdmin.from('workspace_sources').insert(rows)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ saved: rows.length })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}