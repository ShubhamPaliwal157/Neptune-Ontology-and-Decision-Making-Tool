import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const MAX_RESULTS    = 20  // max total results returned
const MAX_PER_WS     = 5   // max results per workspace
const CONCURRENCY    = 4   // parallel workspace context loads

/**
 * GET /api/search?query=...&user_id=...
 * Searches entity names, aliases, and descriptions across all user workspaces.
 * Only searches Supabase Storage workspaces (Drive is too slow for live search).
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const query   = (searchParams.get('query') || '').trim()
    const user_id = searchParams.get('user_id')

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] })
    }
    if (!user_id) {
      return NextResponse.json({ error: 'Missing user_id' }, { status: 400 })
    }

    // 1. Fetch all workspaces for this user
    const { data: workspaces, error } = await supabaseAdmin
      .from('workspaces')
      .select('id, name, domains, storage_backend, node_count')
      .eq('owner_id', user_id)
      .order('last_opened_at', { ascending: false })

    if (error || !workspaces?.length) {
      return NextResponse.json({ results: [] })
    }

    // 2. Only search Supabase Storage workspaces (Drive too slow for live search)
    const searchable = workspaces.filter(w => w.storage_backend !== 'drive' && w.node_count > 0)

    // 3. Load context.json for each workspace in parallel batches
    const allResults = []

    for (let i = 0; i < searchable.length; i += CONCURRENCY) {
      const batch = searchable.slice(i, i + CONCURRENCY)
      const settled = await Promise.allSettled(
        batch.map(ws => searchWorkspace(ws, query))
      )
      settled.forEach(r => {
        if (r.status === 'fulfilled') allResults.push(...r.value)
      })
    }

    // 4. Sort by score descending, cap total results
    allResults.sort((a, b) => b.score - a.score)
    const results = allResults.slice(0, MAX_RESULTS)

    return NextResponse.json({ results, query })
  } catch (err) {
    console.error('[search]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// ── Search a single workspace ─────────────────────────────────────────────────

async function searchWorkspace(workspace, query) {
  try {
    const context = await loadContext(workspace.id)
    if (!context?.entities?.length) return []

    const q = query.toLowerCase()
    const matches = []

    for (const entity of context.entities) {
      const score = scoreEntity(entity, q)
      if (score > 0) {
        matches.push({
          entityId:      entity.id,
          entityName:    entity.name,
          entityType:    entity.type     || 'concept',
          entityDomain:  entity.domain   || 'geopolitics',
          description:   entity.description || '',
          workspaceId:   workspace.id,
          workspaceName: workspace.name,
          domains:       workspace.domains || [],
          score,
        })
      }
    }

    // Sort within workspace, cap per workspace
    matches.sort((a, b) => b.score - a.score)
    return matches.slice(0, MAX_PER_WS)
  } catch {
    return []
  }
}

// ── Score an entity against the query ────────────────────────────────────────

function scoreEntity(entity, q) {
  const name        = (entity.name        || '').toLowerCase()
  const description = (entity.description || '').toLowerCase()
  const aliases     = (entity.aliases     || []).map(a => a.toLowerCase())

  // Exact name match — always wins, no stacking
  if (name === q) return 100 + (entity.importance || 0)

  // Any alias exact match
  if (aliases.some(a => a === q)) return 80 + (entity.importance || 0)

  let score = 0

  // Name starts with query (but not exact)
  if (name.startsWith(q)) score += 50

  // Name contains query (but doesn't start with it)
  else if (name.includes(q)) score += 30

  // Any alias contains query
  if (aliases.some(a => a.includes(q))) score += 20

  // Description contains query
  if (description.includes(q)) score += 10

  // Boost by importance only for partial matches
  if (score > 0 && entity.importance) score += entity.importance

  return score
}

// ── Load context.json from Supabase Storage ───────────────────────────────────

async function loadContext(workspaceId) {
  try {
    const { data, error } = await supabaseAdmin.storage
      .from('workspace-outputs')
      .download(`${workspaceId}/context.json`)

    if (error || !data) return null
    const text = await data.text()
    return JSON.parse(text)
  } catch {
    return null
  }
}
