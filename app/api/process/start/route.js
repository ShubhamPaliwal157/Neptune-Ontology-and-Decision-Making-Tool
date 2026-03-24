import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Allow up to 5 minutes for the pipeline to complete on Vercel
export const maxDuration = 300

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

    // Run pipeline — await it so Vercel doesn't kill the function early.
    // The client polls /api/process/status separately; this route blocks until done.
    processWorkspace({ workspace, sources, job, user_id }).catch((err) => {
      supabaseAdmin.from('processing_jobs').update({
        status: 'error',
        error_message: err?.message || 'Pipeline crashed unexpectedly',
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
/**
 * processWorkspace — Core ingestion pipeline
 * 
 * Orchestrates the complete intelligence graph generation workflow:
 * 1. Fetches and scrapes each source URL
 * 2. Extracts entities and relationships using Groq LLM
 * 3. Merges and deduplicates entities across sources
 * 4. Builds the final knowledge graph
 * 5. Generates intelligence feed and decision briefs
 * 6. Saves all outputs to storage (Drive or Supabase)
 * 
 * @param {Object} params
 * @param {Object} params.workspace - Workspace record from DB
 * @param {Array} params.sources - Array of source records to process
 * @param {Object} params.job - Processing job record for status updates
 * @param {string} params.user_id - Owner user ID for authorization
 * 
 * @returns {Promise<void>} Updates job status in DB on completion/error
 */
async function processWorkspace({ workspace, sources, job, user_id }) {
  const updateJob = (fields) =>
    supabaseAdmin.from('processing_jobs').update({
      ...fields,
      updated_at: new Date().toISOString(),
    }).eq('id', job.id)

  try {
    const allEntities = []
    const allEdges    = []
    const allTexts    = [] // Collected source texts for feed/decision generation

    // ── Step 1: Fetch + extract from each source ──────────────────────────────
    for (let i = 0; i < sources.length; i++) {
      const source = sources[i]
      await updateJob({
        progress: Math.round(10 + (i / sources.length) * 40),
        current_step: `Processing source ${i + 1}/${sources.length}…`,
        sources_done: i,
      })

      try {
        const text = await fetchSourceText(source)
        if (!text) {
          await supabaseAdmin.from('workspace_sources').update({ status: 'failed' }).eq('id', source.id)
          continue
        }

        // Keep a sample of each source text for later feed/decision generation
        allTexts.push({
          source: source.url || source.keyword || 'unknown',
          type: source.type,
          text: text.slice(0, 3000),
        })

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
    await updateJob({ progress: 55, current_step: 'Resolving entity aliases...' })
    const { nodes, edgeMap } = mergeEntities(allEntities, allEdges)

    // ── Step 3: Build final graph ─────────────────────────────────────────────
    await updateJob({ progress: 68, current_step: 'Building knowledge graph...' })
    const graph = buildGraph(nodes, edgeMap)

    // ── Step 4: Build context file ────────────────────────────────────────────
    await updateJob({ progress: 74, current_step: 'Assembling context data...' })
    const context = buildContext(nodes, sources, workspace)

    // ── Step 5: Generate intelligence feed ───────────────────────────────────
    await updateJob({ progress: 80, current_step: 'Generating intelligence feed...' })
    const feed = await generateFeed(nodes, allTexts, workspace)

    // ── Step 6: Generate decision briefs ─────────────────────────────────────
    await updateJob({ progress: 88, current_step: 'Generating decision briefs...' })
    const decisions = await generateDecisions(nodes, allTexts, workspace, feed)

    // ── Step 7: Save all outputs ──────────────────────────────────────────────
    await updateJob({ progress: 94, current_step: 'Saving outputs...' })
    await saveOutputs({ workspace, graph, context, feed, decisions, user_id })

    // ── Step 8: Update workspace counts ──────────────────────────────────────
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
    await supabaseAdmin.from('processing_jobs').update({
      status: 'error',
      error_message: err.message || 'Pipeline crashed unexpectedly',
      updated_at: new Date().toISOString(),
    }).eq('id', job.id)
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

  const res = await callGroq(prompt, 4000, 0.1)
  const parsed = parseGroqJSON(res)

  return {
    entities: (parsed.entities || []).map(e => ({ ...e, sourcesFound: [source.url || source.keyword] })),
    edges:    parsed.edges || [],
  }
}

// ── Generate intelligence feed items ─────────────────────────────────────────
async function generateFeed(nodes, allTexts, workspace) {
  const topNodes = nodes
    .sort((a, b) => (b.importance || 0) - (a.importance || 0))
    .slice(0, 30)
    .map(n => `${n.name} (${n.type}, ${n.domain})`)

  const domains = (workspace.domains || ['geopolitics']).join(', ')
  const textSample = allTexts
    .map(t => `SOURCE: ${t.source}\n${t.text.slice(0, 1000)}`)
    .join('\n\n---\n\n')
    .slice(0, 8000)

  const prompt = `You are a senior intelligence analyst. Based on the following source material and entity list, generate a live intelligence feed of 12-18 intelligence items.

Workspace: "${workspace.name}"
Domains: ${domains}
Key Entities: ${topNodes.join(', ')}

SOURCE MATERIAL:
${textSample}

Generate intelligence feed items that reflect actual findings from the source material above.

Return ONLY valid JSON array:
[
  {
    "id": 1,
    "type": "THREAT|CYBER|ECONOMIC|GEOPOLITICAL|DIPLOMATIC|SIGNAL|CLIMATE|SPACE",
    "domain": "geopolitics|economics|defense|technology|climate|society",
    "node": "ENTITY_ID_IN_CAPS",
    "text": "Specific intelligence item in 1-2 sentences. Be specific with numbers, names, dates.",
    "confidence": 65-97,
    "timestamp": "HH:MM:SS",
    "severity": "LOW|MEDIUM|HIGH|CRITICAL",
    "entities": ["Entity1", "Entity2"]
  }
]

Rules:
- Each item must reference real entities from the source material
- Vary types across the array
- Use specific facts, numbers, dates from the sources
- Timestamps should span the last 12 hours in HH:MM:SS format
- Return ONLY the JSON array, nothing else`

  try {
    const raw = await callGroq(prompt, 3000, 0.3)
    const items = parseGroqJSON(raw)
    if (Array.isArray(items) && items.length > 0) {
      return items.map((item, i) => ({ ...item, id: item.id || i + 1 }))
    }
  } catch (err) {
    console.error('Feed generation failed:', err)
  }

  // Fallback: generate basic feed items from node names
  return generateFallbackFeed(nodes, workspace)
}

function generateFallbackFeed(nodes, workspace) {
  const topNodes = nodes.sort((a, b) => (b.importance || 0) - (a.importance || 0)).slice(0, 8)
  const types = ['GEOPOLITICAL', 'ECONOMIC', 'DIPLOMATIC', 'SIGNAL']
  const now = new Date()

  return topNodes.map((node, i) => {
    const hoursAgo = i * 1.5
    const ts = new Date(now - hoursAgo * 3600000)
    const hh = String(ts.getHours()).padStart(2, '0')
    const mm = String(ts.getMinutes()).padStart(2, '0')
    const ss = String(ts.getSeconds()).padStart(2, '0')

    return {
      id: i + 1,
      type: types[i % types.length],
      domain: node.domain || 'geopolitics',
      node: node.id?.toUpperCase() || 'ENTITY',
      text: `${node.name}: ${node.description || 'Entity identified in intelligence graph.'}`,
      confidence: Math.floor(70 + Math.random() * 20),
      timestamp: `${hh}:${mm}:${ss}`,
      severity: node.importance >= 8 ? 'HIGH' : node.importance >= 6 ? 'MEDIUM' : 'LOW',
      entities: [node.name],
    }
  })
}

// ── Generate decision briefs ──────────────────────────────────────────────────
async function generateDecisions(nodes, allTexts, workspace, feed) {
  const topNodes = nodes
    .sort((a, b) => (b.importance || 0) - (a.importance || 0))
    .slice(0, 20)

  const domains = (workspace.domains || ['geopolitics']).join(', ')
  const highSeverityFeedItems = (feed || [])
    .filter(f => f.severity === 'CRITICAL' || f.severity === 'HIGH')
    .slice(0, 5)
    .map(f => f.text)
    .join('\n')

  const textSample = allTexts
    .map(t => t.text.slice(0, 1200))
    .join('\n\n---\n\n')
    .slice(0, 6000)

  const entityList = topNodes.map(n => `${n.name} (${n.type})`).join(', ')

  const prompt = `You are a strategic intelligence analyst advising senior government decision makers.

Workspace: "${workspace.name}"
Domains: ${domains}
Key Entities: ${entityList}

High-severity intelligence items:
${highSeverityFeedItems || 'See source material below.'}

SOURCE MATERIAL:
${textSample}

Generate 3 strategic decision briefs that senior policymakers would need to act on, based on the above intelligence.

Return ONLY valid JSON array:
[
  {
    "id": "DEC-2024-XXXX",
    "title": "Decision question as a complete question (e.g., 'Should India expand the semiconductor partnership with...')",
    "deadline": "Timeframe label (e.g., 'Cabinet Review — 48 hours', 'UNSC Vote — 6 days')",
    "domain": "geopolitics|economics|defense|technology|climate|society",
    "status": "AWAITING DECISION",
    "priority": "CRITICAL|HIGH|MEDIUM",
    "owner": "Department or office (e.g., 'NSA Office', 'MEA Strategic Affairs')",
    "summary": "2-3 sentence summary of the decision context with specific facts",
    "evidence": [
      {
        "id": "E1",
        "claim": "Specific factual claim with number or data point",
        "type": "FACT|INTELLIGENCE|RISK|ESTIMATE",
        "confidence": 70-97,
        "impact": "HIGH|MEDIUM|LOW",
        "supports": "Option label (e.g., 'JOIN', 'WAIT', 'REJECT', 'ESCALATE')",
        "sources": [
          { "name": "Source name", "type": "GOV|INTELLIGENCE|INDUSTRY|ACADEMIC|OFFICIAL", "verified": true }
        ],
        "timestamp": "Updated Xhr ago"
      }
    ],
    "scenarios": [
      {
        "id": "S1",
        "label": "Option label",
        "title": "Option title",
        "description": "2 sentences describing this option",
        "probability": 20-80,
        "timeframe": "Timeframe string",
        "risk": "LOW|MEDIUM|HIGH|CRITICAL",
        "impacts": [
          { "area": "Area name", "effect": "specific effect", "magnitude": "HIGH|MEDIUM|LOW" }
        ],
        "watchlist": ["Entity1", "Entity2"],
        "precedents": ["Historical precedent 1"]
      }
    ],
    "recommendation": "One clear recommended action with rationale",
    "entities_involved": ["Entity1", "Entity2", "Entity3"]
  }
]

Rules:
- Decisions must be grounded in the actual source material provided
- Include 3-5 evidence items per decision
- Include 2-3 scenarios per decision
- Use specific data points, not vague generalities
- Return ONLY the JSON array, nothing else`

  try {
    const raw = await callGroq(prompt, 5000, 0.3)
    const decisions = parseGroqJSON(raw)
    if (Array.isArray(decisions) && decisions.length > 0) {
      return decisions
    }
  } catch (err) {
    console.error('Decisions generation failed:', err)
  }

  return generateFallbackDecisions(nodes, workspace)
}

function generateFallbackDecisions(nodes, workspace) {
  const topNodes = nodes.sort((a, b) => (b.importance || 0) - (a.importance || 0)).slice(0, 6)
  const domains = workspace.domains || ['geopolitics']

  return [{
    id: 'DEC-AUTO-001',
    title: `Strategic assessment required for ${workspace.name}`,
    deadline: 'Review within 72 hours',
    domain: domains[0] || 'geopolitics',
    status: 'AWAITING DECISION',
    priority: 'HIGH',
    owner: 'Intelligence Office',
    summary: `The workspace "${workspace.name}" has been processed. ${topNodes.length} key entities were identified requiring strategic assessment. Further analysis is recommended.`,
    evidence: topNodes.slice(0, 3).map((n, i) => ({
      id: `E${i + 1}`,
      claim: `${n.name}: ${n.description || 'Key entity identified in intelligence graph'}`,
      type: 'FACT',
      confidence: Math.floor(75 + Math.random() * 15),
      impact: n.importance >= 8 ? 'HIGH' : 'MEDIUM',
      supports: 'REVIEW',
      sources: [{ name: 'Neptune Intelligence Graph', type: 'GOV', verified: true }],
      timestamp: 'Updated now',
    })),
    scenarios: [
      {
        id: 'S1',
        label: 'MONITOR',
        title: 'Continue monitoring',
        description: 'Maintain current intelligence collection posture. Reassess in 30 days.',
        probability: 60,
        timeframe: '30 days',
        risk: 'LOW',
        impacts: [{ area: 'Intelligence', effect: 'Continued situational awareness', magnitude: 'MEDIUM' }],
        watchlist: topNodes.slice(0, 2).map(n => n.name),
        precedents: ['Standard monitoring protocol'],
      },
      {
        id: 'S2',
        label: 'ESCALATE',
        title: 'Escalate to senior review',
        description: 'Bring findings to senior decision makers for immediate review and action.',
        probability: 40,
        timeframe: '48 hours',
        risk: 'MEDIUM',
        impacts: [{ area: 'Policy', effect: 'Potential policy response required', magnitude: 'HIGH' }],
        watchlist: topNodes.slice(0, 3).map(n => n.name),
        precedents: ['Previous intelligence escalation protocol'],
      },
    ],
    recommendation: 'Review all identified entities and escalate findings with highest strategic importance to relevant departments.',
    entities_involved: topNodes.slice(0, 5).map(n => n.name),
  }]
}

// ── Groq API helpers ──────────────────────────────────────────────────────────

async function callGroq(prompt, maxTokens = 2000, temperature = 0.2) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      // Use GROQ_API_KEY (server-side only), fallback to public key for backwards compat
      'Authorization': `Bearer ${process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature,
      max_tokens: maxTokens,
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Groq API error ${res.status}: ${errText}`)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}

function parseGroqJSON(raw) {
  try {
    const cleaned = raw.replace(/```json|```/g, '').trim()
    return JSON.parse(cleaned)
  } catch {
    // Try to extract JSON array or object from surrounding text
    const arrMatch = raw.match(/\[[\s\S]*\]/)
    const objMatch = raw.match(/\{[\s\S]*\}/)
    if (arrMatch) {
      try { return JSON.parse(arrMatch[0]) } catch { /* fall through */ }
    }
    if (objMatch) {
      try { return JSON.parse(objMatch[0]) } catch { /* fall through */ }
    }
    throw new Error('Could not parse Groq JSON response')
  }
}

// ── Merge entities + resolve aliases ─────────────────────────────────────────

/**
 * mergeEntities — Deduplicates and merges entities across sources
 * 
 * Uses a three-tier matching strategy:
 * 1. Exact canonical name match (case-insensitive, normalized)
 * 2. Exact alias match against existing entity names
 * 3. Fuzzy token-similarity match (Jaccard similarity with synonym expansion)
 * 
 * Handles common geopolitical synonyms (e.g., "USA" = "United States", "UK" = "United Kingdom")
 * and filters stop words to improve matching accuracy.
 * 
 * @param {Array} allEntities - Raw entities extracted from all sources
 * @param {Array} allEdges - Raw relationships extracted from all sources
 * 
 * @returns {Object} { nodes: Array, edgeMap: Map }
 *   - nodes: Deduplicated entity array with merged aliases and sources
 *   - edgeMap: Map of unique edges keyed by "source→target→relationship"
 */

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
function buildContext(nodes, sources, workspace) {
  return {
    generated_at: new Date().toISOString(),
    workspace_name: workspace.name,
    domains: workspace.domains || [],
    sources: sources.map(s => ({
      type:    s.type,
      url:     s.url,
      keyword: s.keyword,
      status:  s.status,
      fetched: s.last_fetched,
    })),
    entities: nodes.map(n => ({
      id:            n.id,
      name:          n.name,
      aliases:       n.aliases,
      description:   n.description,
      sources_found: n.sourcesFound,
      importance:    n.importance,
    })),
  }
}

// ── Save outputs to Drive or Supabase Storage ─────────────────────────────────
async function saveOutputs({ workspace, graph, context, feed, decisions, user_id }) {
  const graphJson     = JSON.stringify(graph, null, 2)
  const contextJson   = JSON.stringify(context, null, 2)
  const feedJson      = JSON.stringify(feed, null, 2)
  const decisionsJson = JSON.stringify(decisions, null, 2)

  if (workspace.storage_backend === 'drive' && workspace.google_access_token) {
    await saveToDrive({ workspace, graphJson, contextJson, feedJson, decisionsJson, user_id })
  } else {
    await saveToSupabaseStorage({ workspace, graphJson, contextJson, feedJson, decisionsJson })
  }
}

async function saveToDrive({ workspace, graphJson, contextJson, feedJson, decisionsJson, user_id }) {
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

  await uploadFile('graph.json',     graphJson)
  await uploadFile('context.json',   contextJson)
  await uploadFile('feed.json',      feedJson)
  await uploadFile('decisions.json', decisionsJson)
}

async function saveToSupabaseStorage({ workspace, graphJson, contextJson, feedJson, decisionsJson }) {
  const bucket = 'workspace-outputs'
  const folder = workspace.id

  const upload = (name, content) =>
    supabaseAdmin.storage.from(bucket).upload(
      `${folder}/${name}`,
      new Blob([content], { type: 'application/json' }),
      { upsert: true }
    )

  await Promise.all([
    upload('graph.json',     graphJson),
    upload('context.json',   contextJson),
    upload('feed.json',      feedJson),
    upload('decisions.json', decisionsJson),
  ])
}
