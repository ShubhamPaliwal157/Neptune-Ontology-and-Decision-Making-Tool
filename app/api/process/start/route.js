import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    const { workspace_id, user_id } = await request.json()
    if (!workspace_id || !user_id) {
      return NextResponse.json({ error: 'Missing workspace_id or user_id' }, { status: 400 })
    }

    // Fetch workspace + sources
    const { data: workspace, error: wsError } = await supabaseAdmin
      .from('workspaces')
      .select('*')
      .eq('id', workspace_id)
      .eq('owner_id', user_id)
      .single()

    if (wsError || !workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    const { data: sources } = await supabaseAdmin
      .from('workspace_sources')
      .select('*')
      .eq('workspace_id', workspace_id)
      .eq('owner_id', user_id)

    if (!sources || sources.length === 0) {
      return NextResponse.json({ error: 'No sources found for this workspace' }, { status: 400 })
    }

    // Create a processing job
    const { data: job, error: jobError } = await supabaseAdmin
      .from('processing_jobs')
      .insert({
        workspace_id,
        owner_id: user_id,
        status: 'running',
        progress: 0,
        current_step: 'Starting pipeline...',
        sources_total: sources.length,
        sources_done: 0,
      })
      .select()
      .single()

    if (jobError) {
      return NextResponse.json({ error: jobError.message }, { status: 500 })
    }

    // Fire and forget — process in background
    // We respond immediately with job ID, client polls /api/process/status
    processWorkspace({ workspace, sources, job, user_id }).catch(() => {
      supabaseAdmin.from('processing_jobs').update({
        status: 'error',
        error_message: 'Pipeline crashed unexpectedly',
        updated_at: new Date().toISOString(),
      }).eq('id', job.id)
    })

    return NextResponse.json({ job_id: job.id })
  } catch (err) {
    console.error('POST /api/process/start error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// ── Main pipeline ─────────────────────────────────────────────────────────────
async function processWorkspace({ workspace, sources, job, user_id }) {
  const updateJob = (fields) =>
    supabaseAdmin.from('processing_jobs').update({
      ...fields,
      updated_at: new Date().toISOString(),
    }).eq('id', job.id)

  try {
    const allEntities = []
    const allEdges    = []

    // ── Step 1: Fetch + extract from each source ──────────────────────────────
    for (let i = 0; i < sources.length; i++) {
      const source = sources[i]
      await updateJob({
        progress: Math.round(10 + (i / sources.length) * 50),
        current_step: `Processing source ${i + 1}/${sources.length}…`,
        sources_done: i,
      })

      try {
        const text = await fetchSourceText(source)
        if (!text) {
          await supabaseAdmin.from('workspace_sources').update({ status: 'failed' }).eq('id', source.id)
          continue
        }

        const { entities, edges } = await extractWithGroq(text, source, workspace.domains)

        allEntities.push(...entities)
        allEdges.push(...edges)

        await supabaseAdmin.from('workspace_sources').update({
          status: 'processed',
          last_fetched: new Date().toISOString(),
        }).eq('id', source.id)

      } catch (err) {
        console.error('Error processing source:', err)
        await supabaseAdmin.from('workspace_sources').update({ status: 'failed' }).eq('id', source.id)
      }
    }

    // ── Step 2: Merge + deduplicate entities ──────────────────────────────────
    await updateJob({ progress: 65, current_step: 'Resolving entity aliases...' })
    const { nodes, edgeMap } = mergeEntities(allEntities, allEdges)

    // ── Step 3: Build final graph ─────────────────────────────────────────────
    await updateJob({ progress: 80, current_step: 'Building knowledge graph...' })
    const graph = buildGraph(nodes, edgeMap)

    // ── Step 4: Build context file ────────────────────────────────────────────
    await updateJob({ progress: 88, current_step: 'Assembling context data...' })
    const context = buildContext(nodes, sources)

    // ── Step 5: Save outputs ──────────────────────────────────────────────────
    await updateJob({ progress: 93, current_step: 'Saving outputs...' })
    await saveOutputs({ workspace, graph, context, user_id })

    // ── Step 6: Update workspace node/edge counts ─────────────────────────────
    await supabaseAdmin.from('workspaces').update({
      node_count: graph.nodes.length,
      edge_count: graph.edges.length,
      last_opened_at: new Date().toISOString(),
    }).eq('id', workspace.id)

    await updateJob({
      status: 'done',
      progress: 100,
      current_step: 'Complete',
      sources_done: sources.length,
    })
  } catch (err) {
    console.error('Pipeline error:', err)
    const updateJob = (fields) =>
      supabaseAdmin.from('processing_jobs').update({
        ...fields,
        updated_at: new Date().toISOString(),
      }).eq('id', job.id)
    await updateJob({
      status: 'error',
      error_message: err.message || 'Pipeline crashed unexpectedly',
    })
  }
}

// ── Fetch text from a source ──────────────────────────────────────────────────
async function fetchSourceText(source) {
  if (source.type === 'keyword') {
    return `Topic: ${source.keyword}\nThis is a key entity or topic to track in the workspace.`
  }

  const url = source.url
  if (!url) return null

  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NeptuneBot/1.0)' },
    signal: AbortSignal.timeout(15000),
  })

  if (!res.ok) return null
  const html = await res.text()

  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 12000)

  return text
}

// ── Extract entities + edges via Groq ─────────────────────────────────────────
async function extractWithGroq(text, source, domains) {
  const domainContext = (domains || []).join(', ') || 'geopolitics, international relations'

  const prompt = `You are an intelligence analyst extracting structured data from text.

Domains of interest: ${domainContext}
Source type: ${source.type}
Source: ${source.url || source.keyword || 'unknown'}

Extract entities (people, organisations, countries, concepts, events) and their relationships from this text.

Return ONLY valid JSON with this exact structure:
{
  "entities": [
    {
      "name": "Entity Name",
      "type": "person|organisation|country|concept|event|location",
      "aliases": ["alternate name", "abbreviation"],
      "domain": "geopolitics|economics|defense|technology|climate|society",
      "description": "One sentence description",
      "importance": 1-10
    }
  ],
  "edges": [
    {
      "source": "Entity Name A",
      "target": "Entity Name B",
      "relationship": "short relationship label",
      "direction": "unidirectional|bidirectional",
      "weight": 1-10,
      "context": "one sentence explaining this relationship"
    }
  ]
}

Rules:
- Extract 5–25 entities maximum
- Extract 5–30 edges maximum  
- Only extract entities clearly present in the text
- Relationship labels must be short: "allied with", "sanctioned by", "leads", "competes with"
- Return ONLY the JSON object, no other text

TEXT:
${text}`

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.NEXT_PUBLIC_GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 4000,
    }),
  })

  const data = await res.json()
  const raw  = data.choices?.[0]?.message?.content || '{}'

  const cleaned = raw.replace(/```json|```/g, '').trim()
  const parsed  = JSON.parse(cleaned)

  return {
    entities: (parsed.entities || []).map(e => ({ ...e, sourcesFound: [source.url || source.keyword] })),
    edges:    parsed.edges || [],
  }
}

// ── Merge entities + resolve aliases ─────────────────────────────────────────

const SYNONYM_MAP = {
  'samrajya': 'empire', 'rajya': 'state', 'desh': 'country',
  'rashtra':  'nation',  'sena': 'army',  'sarkar': 'government',
  'lok': 'people', 'bharat': 'india', 'hindustan': 'india',
  'usa': 'united states', 'us': 'united states',
  'uk': 'united kingdom', 'britain': 'united kingdom',
  'prc': 'china', 'ussr': 'russia', 'uae': 'united arab emirates',
}
const STOP_WORDS = new Set(['the','of','and','a','an','in','at','by','for','to',
  'republic','democratic','peoples','federal','union'])

function canonicalize(name) { return name.toLowerCase().trim() }

function tokenize(name) {
  return canonicalize(name)
    .split(/[\s\-_,]+/)
    .map(t => SYNONYM_MAP[t] || t)
    .filter(t => t.length > 1 && !STOP_WORDS.has(t))
}

function tokenSimilarity(a, b) {
  const setA = new Set(tokenize(a))
  const setB = new Set(tokenize(b))
  const intersection = [...setA].filter(t => setB.has(t)).length
  const union = new Set([...setA, ...setB]).size
  return union === 0 ? 0 : intersection / union
}

function findSimilarNode(entity, nodeMap, threshold = 0.55) {
  const candidates = [entity.name, ...(entity.aliases || [])]
  const seen = new Set()
  for (const [, node] of nodeMap) {
    if (seen.has(node)) continue
    seen.add(node)
    const existing = [node.name, ...node.aliases]
    for (const a of candidates) {
      for (const b of existing) {
        if (tokenSimilarity(a, b) >= threshold) return node
      }
    }
  }
  return null
}

function mergeEntities(allEntities, allEdges) {
  const nodeMap = new Map()

  for (const entity of allEntities) {
    const key = canonicalize(entity.name)

    if (nodeMap.has(key)) {
      const existing = nodeMap.get(key)
      existing.aliases = [...new Set([...existing.aliases, ...(entity.aliases || [])])]
      existing.sourcesFound = [...new Set([...existing.sourcesFound, ...(entity.sourcesFound || [])])]
      existing.importance = Math.max(existing.importance || 1, entity.importance || 1)
    } else {
      let merged = false

      // 1. Exact alias match
      for (const alias of (entity.aliases || [])) {
        const aliasKey = canonicalize(alias)
        if (nodeMap.has(aliasKey)) {
          const existing = nodeMap.get(aliasKey)
          existing.aliases = [...new Set([...existing.aliases, entity.name, ...(entity.aliases || [])])]
          existing.sourcesFound = [...new Set([...existing.sourcesFound, ...(entity.sourcesFound || [])])]
          nodeMap.set(key, existing)
          merged = true
          break
        }
      }

      // 2. Token-similarity fuzzy match
      if (!merged) {
        const similar = findSimilarNode(entity, nodeMap)
        if (similar) {
          similar.aliases = [...new Set([...similar.aliases, entity.name, ...(entity.aliases || [])])]
          similar.sourcesFound = [...new Set([...similar.sourcesFound, ...(entity.sourcesFound || [])])]
          similar.importance = Math.max(similar.importance || 1, entity.importance || 1)
          nodeMap.set(key, similar)
          merged = true
        }
      }

      if (!merged) {
        nodeMap.set(key, {
          id: key.replace(/\s+/g, '_'),
          name: entity.name,
          type: entity.type || 'concept',
          aliases: entity.aliases || [],
          domain: entity.domain || 'geopolitics',
          description: entity.description || '',
          importance: entity.importance || 5,
          sourcesFound: entity.sourcesFound || [],
        })
      }
    }
  }

  // Resolve edge endpoints to canonical names
  const edgeMap = new Map()
  for (const edge of allEdges) {
    const srcKey = canonicalize(edge.source)
    const tgtKey = canonicalize(edge.target)
    const srcNode = nodeMap.get(srcKey)
    const tgtNode = nodeMap.get(tgtKey)
    if (!srcNode || !tgtNode) continue

    const edgeKey = `${srcNode.id}→${tgtNode.id}→${edge.relationship}`
    if (!edgeMap.has(edgeKey)) {
      edgeMap.set(edgeKey, {
        source: srcNode.id,
        target: tgtNode.id,
        relationship: edge.relationship,
        direction: edge.direction || 'unidirectional',
        weight: edge.weight || 5,
        context: edge.context || '',
      })
    } else {
      edgeMap.get(edgeKey).weight = Math.min(10, edgeMap.get(edgeKey).weight + 1)
    }
  }

  return { nodes: [...nodeMap.values()], edgeMap }
}

// ── Build final graph.json ────────────────────────────────────────────────────
function buildGraph(nodes, edgeMap) {
  return {
    generated_at: new Date().toISOString(),
    nodes: nodes.map(n => ({
      id:          n.id,
      name:        n.name,
      type:        n.type,
      domain:      n.domain,
      description: n.description,
      importance:  n.importance,
      aliases:     n.aliases,
    })),
    edges: [...edgeMap.values()],
  }
}

// ── Build context.json ────────────────────────────────────────────────────────
function buildContext(nodes, sources) {
  return {
    generated_at: new Date().toISOString(),
    sources: sources.map(s => ({
      type:    s.type,
      url:     s.url,
      keyword: s.keyword,
      status:  s.status,
      fetched: s.last_fetched,
    })),
    entities: nodes.map(n => ({
      id:           n.id,
      name:         n.name,
      aliases:      n.aliases,
      description:  n.description,
      sources_found: n.sourcesFound,
      importance:   n.importance,
    })),
  }
}

// ── Save outputs to Drive or Supabase Storage ─────────────────────────────────
async function saveOutputs({ workspace, graph, context, user_id }) {
  const graphJson   = JSON.stringify(graph, null, 2)
  const contextJson = JSON.stringify(context, null, 2)

  if (workspace.storage_backend === 'drive' && workspace.google_access_token) {
    await saveToDrive({ workspace, graphJson, contextJson, user_id })
  } else {
    await saveToSupabaseStorage({ workspace, graphJson, contextJson })
  }
}

async function saveToDrive({ workspace, graphJson, contextJson, user_id }) {
  const tokenRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ workspace_id: workspace.id, user_id }),
  })
  const { access_token } = await tokenRes.json()

  const uploadFile = async (name, content) => {
    const metadata = { name, parents: [workspace.google_folder_id], mimeType: 'application/json' }
    const form = new FormData()
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
    form.append('file',     new Blob([content],                   { type: 'application/json' }))

    await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method:  'POST',
      headers: { Authorization: `Bearer ${access_token}` },
      body:    form,
    })
  }

  await uploadFile('graph.json',   graphJson)
  await uploadFile('context.json', contextJson)
}

async function saveToSupabaseStorage({ workspace, graphJson, contextJson }) {
  const bucket = 'workspace-outputs'
  const folder = workspace.id

  await supabaseAdmin.storage.from(bucket).upload(
    `${folder}/graph.json`, new Blob([graphJson], { type: 'application/json' }),
    { upsert: true }
  )
  await supabaseAdmin.storage.from(bucket).upload(
    `${folder}/context.json`, new Blob([contextJson], { type: 'application/json' }),
    { upsert: true }
  )
}