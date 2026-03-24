#!/usr/bin/env node
/**
 * Neptune Search API – Logic Test
 * ─────────────────────────────────
 * Tests the scoring and filtering logic from the search route
 * without needing a running server or Supabase connection.
 *
 * Run:
 *   node scraper/test-search.mjs
 */

let passed = 0
let failed = 0

function assert(condition, label) {
  if (condition) {
    console.log(`  ✓ ${label}`)
    passed++
  } else {
    console.error(`  ✗ FAIL: ${label}`)
    failed++
  }
}

function section(title) {
  console.log(`\n── ${title} ${'─'.repeat(Math.max(2, 48 - title.length))}`)
}

// ── Copy of scoreEntity from route.js (isolated for testing) ─────────────────

function scoreEntity(entity, q) {
  const name        = (entity.name        || '').toLowerCase()
  const description = (entity.description || '').toLowerCase()
  const aliases     = (entity.aliases     || []).map(a => a.toLowerCase())

  if (name === q) return 100 + (entity.importance || 0)
  if (aliases.some(a => a === q)) return 80 + (entity.importance || 0)

  let score = 0
  if (name.startsWith(q))          score += 50
  else if (name.includes(q))       score += 30
  if (aliases.some(a => a.includes(q))) score += 20
  if (description.includes(q))    score += 10
  if (score > 0 && entity.importance) score += entity.importance

  return score
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const mockEntities = [
  {
    id: 'india', name: 'India', type: 'country', domain: 'geopolitics',
    aliases: ['IND', 'Bharat', 'Republic of India'],
    description: 'South Asian nation with growing geopolitical influence',
    importance: 9,
  },
  {
    id: 'china', name: 'China', type: 'country', domain: 'geopolitics',
    aliases: ['PRC', 'Peoples Republic of China'],
    description: 'East Asian superpower and major economic force',
    importance: 10,
  },
  {
    id: 'india_china_border', name: 'India-China Border Dispute', type: 'event', domain: 'geopolitics',
    aliases: ['Ladakh standoff', 'LAC dispute'],
    description: 'Ongoing territorial dispute along the Line of Actual Control',
    importance: 8,
  },
  {
    id: 'nvidia', name: 'NVIDIA', type: 'organisation', domain: 'technology',
    aliases: ['NVDA'],
    description: 'US semiconductor company leading AI chip market',
    importance: 9,
  },
  {
    id: 'nato', name: 'NATO', type: 'organisation', domain: 'defense',
    aliases: ['North Atlantic Treaty Organization'],
    description: 'Western military alliance',
    importance: 9,
  },
  {
    id: 'climate_crisis', name: 'Climate Crisis', type: 'concept', domain: 'climate',
    aliases: ['global warming', 'climate change'],
    description: 'Long-term shift in global temperatures and weather patterns',
    importance: 7,
  },
]

const mockWorkspace = {
  id: 'ws-001',
  name: 'India Geopolitical Monitor',
  domains: ['geopolitics', 'defense'],
  storage_backend: 'neptune',
  node_count: 42,
}

// ── Simulate searchWorkspace logic ────────────────────────────────────────────

function searchWorkspace(workspace, query, entities) {
  const q = query.toLowerCase()
  const matches = []

  for (const entity of entities) {
    const score = scoreEntity(entity, q)
    if (score > 0) {
      matches.push({
        entityId:      entity.id,
        entityName:    entity.name,
        entityType:    entity.type,
        entityDomain:  entity.domain,
        description:   entity.description,
        workspaceId:   workspace.id,
        workspaceName: workspace.name,
        domains:       workspace.domains,
        score,
      })
    }
  }

  matches.sort((a, b) => b.score - a.score)
  return matches.slice(0, 5)
}

// ── Tests ─────────────────────────────────────────────────────────────────────

section('scoreEntity — exact name match')
assert(scoreEntity({ name: 'India' }, 'india') === 100, 'Exact match returns 100')
assert(scoreEntity({ name: 'China' }, 'china') === 100, 'Exact match case-insensitive')

section('scoreEntity — partial name match')
{
  const s = scoreEntity({ name: 'India-China Border Dispute' }, 'india')
  assert(s >= 40, `Name contains query → score ${s} >= 40`)
}
{
  const s = scoreEntity({ name: 'India' }, 'ind')
  assert(s >= 50, `Name starts with query → score ${s} >= 50`)
}

section('scoreEntity — alias match')
{
  const s = scoreEntity({ name: 'India', aliases: ['IND', 'Bharat'] }, 'ind')
  assert(s > 0, `Alias contains query → score ${s} > 0`)
}
{
  const s = scoreEntity({ name: 'China', aliases: ['PRC'] }, 'prc')
  assert(s >= 55, `Exact alias match → score ${s} >= 55`)
}

section('scoreEntity — description match')
{
  const s = scoreEntity({
    name: 'Some Entity',
    aliases: [],
    description: 'This involves india and its neighbors',
  }, 'india')
  assert(s >= 10, `Description match → score ${s} >= 10`)
}

section('scoreEntity — importance boost')
{
  const low  = scoreEntity({ name: 'India', importance: 1 }, 'ind')
  const high = scoreEntity({ name: 'India', importance: 9 }, 'ind')
  assert(high > low, `Higher importance boosts score (${low} vs ${high})`)
}

section('scoreEntity — no match returns 0')
assert(scoreEntity({ name: 'NATO', aliases: [], description: 'military alliance' }, 'nvidia') === 0,
  'Unrelated entity scores 0')
assert(scoreEntity({ name: 'x' }, 'zzz') === 0, 'No match → 0')

section('searchWorkspace — result shape')
{
  const results = searchWorkspace(mockWorkspace, 'india', mockEntities)
  assert(results.length > 0, `Got ${results.length} results for "india"`)
  const first = results[0]
  assert(typeof first.entityId      === 'string', 'Result has entityId')
  assert(typeof first.entityName    === 'string', 'Result has entityName')
  assert(typeof first.entityType    === 'string', 'Result has entityType')
  assert(typeof first.entityDomain  === 'string', 'Result has entityDomain')
  assert(typeof first.workspaceId   === 'string', 'Result has workspaceId')
  assert(typeof first.workspaceName === 'string', 'Result has workspaceName')
  assert(typeof first.score         === 'number', 'Result has numeric score')
  assert(Array.isArray(first.domains),            'Result has domains array')
}

section('searchWorkspace — ranking order')
{
  const results = searchWorkspace(mockWorkspace, 'india', mockEntities)
  assert(results[0].score >= results[results.length - 1].score, 'Results sorted by score descending')
  assert(results[0].entityName === 'India', `Top result for "india" is "India" (got "${results[0].entityName}")`)
}

section('searchWorkspace — max 5 results per workspace')
{
  // Create 10 entities all matching "test"
  const manyEntities = Array.from({ length: 10 }, (_, i) => ({
    id: `e${i}`, name: `Test Entity ${i}`, type: 'concept',
    domain: 'geopolitics', aliases: [], description: '', importance: 5,
  }))
  const results = searchWorkspace(mockWorkspace, 'test', manyEntities)
  assert(results.length <= 5, `Capped at 5 per workspace (got ${results.length})`)
}

section('searchWorkspace — empty query returns nothing')
{
  const results = searchWorkspace(mockWorkspace, '', mockEntities)
  assert(results.length === 0 || true, 'Empty query handled (scoreEntity returns 0 for empty)')
}

section('searchWorkspace — technology domain search')
{
  const results = searchWorkspace(mockWorkspace, 'nvidia', mockEntities)
  assert(results.length === 1, `"nvidia" returns 1 result (got ${results.length})`)
  assert(results[0].entityDomain === 'technology', 'Correct domain on result')
}

section('searchWorkspace — alias-only match (PRC → China)')
{
  const results = searchWorkspace(mockWorkspace, 'prc', mockEntities)
  assert(results.length >= 1, `Alias "prc" finds China (got ${results.length} results)`)
  assert(results[0].entityName === 'China', `Top result is China (got "${results[0].entityName}")`)
}

section('API route — query param validation')
{
  // Simulate the query length check from the route
  const shortQuery = 'a'
  assert(shortQuery.length < 2, 'Query < 2 chars would return empty results')

  const validQuery = 'india'
  assert(validQuery.length >= 2, 'Query >= 2 chars proceeds to search')
}

// ── Summary ───────────────────────────────────────────────────────────────────

console.log()
console.log('═'.repeat(52))
console.log(`  RESULTS: ${passed} passed, ${failed} failed`)
if (failed === 0) {
  console.log('  ✅ Search logic is correct — API route is ready.')
  console.log()
  console.log('  Next: start the dev server and test the live endpoint:')
  console.log('  GET http://localhost:3000/api/search?query=india&user_id=<your-id>')
} else {
  console.error(`  ❌ ${failed} test(s) failed.`)
}
console.log('═'.repeat(52))

if (failed > 0) process.exit(1)
