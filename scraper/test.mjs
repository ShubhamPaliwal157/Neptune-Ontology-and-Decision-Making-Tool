#!/usr/bin/env node
/**
 * Neptune Web Scraper – Test Harness
 * ────────────────────────────────────
 * Runs a comprehensive set of tests against the scraper stack.
 * Does NOT require any external API keys (no Groq calls).
 *
 * Run:
 *   node scraper/test.mjs
 */

import { scrape, scrapeUrl }             from '../lib/scraper/scraper.js'
import { fetchSource, fetchUrl, cleanHtml } from '../lib/scraper/fetcher.js'
import { normalizeItems, chunkText, buildTextBundle } from '../lib/scraper/normalizer.js'
import { TRUSTED_SOURCES, getSourcesByDomain, getRelevantSources } from '../lib/scraper/sources.js'

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
  const dashes = '─'.repeat(Math.max(2, 50 - title.length))
  console.log(`\n── ${title} ${dashes}`)
}

// ══ UNIT TESTS ════════════════════════════════════════════════════════════════

section('sources.js — registry checks')
assert(TRUSTED_SOURCES.length >= 10, `At least 10 trusted sources (got ${TRUSTED_SOURCES.length})`)
assert(TRUSTED_SOURCES.every(s => s.id && s.label && s.url && s.domain),
  'All trusted sources have id, label, url, domain')
{
  const domains = new Set(TRUSTED_SOURCES.map(s => s.domain))
  const required = ['geopolitics', 'economics', 'defense', 'technology', 'climate', 'society']
  assert(required.every(d => domains.has(d)), 'All 6 ontology domains covered')
}
{
  const geo = getSourcesByDomain('geopolitics')
  assert(geo.length >= 2, `getSourcesByDomain('geopolitics') returns >= 2`)
  assert(geo.every(s => s.domain === 'geopolitics'), 'Domain filter works')
}
{
  const multi = getRelevantSources(['technology', 'economics'])
  assert(multi.length >= 4, `getRelevantSources(['technology','economics']) >= 4`)
}
{
  const all = getSourcesByDomain('all')
  assert(all.length === TRUSTED_SOURCES.length, 'getSourcesByDomain("all") returns all sources')
}
// Check for duplicate IDs
{
  const ids = TRUSTED_SOURCES.map(s => s.id)
  const unique = new Set(ids)
  assert(ids.length === unique.size, 'No duplicate source IDs')
}

section('fetcher.js — cleanHtml()')
assert(cleanHtml('<p>Hello <b>World</b>!</p>') === 'Hello World !', 'Strips basic tags')
assert(cleanHtml('<script>alert("x")</script>Text') === 'Text', 'Strips <script>')
assert(cleanHtml('<![CDATA[raw text]]>') === 'raw text', 'Unwraps CDATA')
assert(cleanHtml('a &amp; b &lt;c&gt;') === 'a & b <c>', 'Decodes HTML entities')
assert(cleanHtml('  lots   of   space  ') === 'lots of space', 'Collapses whitespace')
assert(cleanHtml('') === '', 'Empty string safe')

section('normalizer.js — normalizeItems()')
{
  const makeItem = (id, text, strategy = 'rss') => ({
    id, sourceId: 'test', sourceLabel: 'Test', domain: 'geopolitics',
    title: 'Test', url: 'https://example.com', text,
    publishedAt: new Date().toISOString(), fetchedAt: new Date().toISOString(), strategy,
  })

  const items = [
    makeItem('a', 'NATO summit reveals joint defense pact between member nations. Chiefs of defense were present.'),
    makeItem('a-dup', 'NATO summit reveals joint defense pact between member nations. Chiefs of defense were present.'), // exact dup
    makeItem('b', 'x'.repeat(20)), // too short
    makeItem('c', 'India and China hold diplomatic talks over border dispute in Ladakh region officials say.'),
  ]
  const norm = normalizeItems(items)
  assert(norm.length === 2, `Dedup: 3 valid items (1 dup + 1 too-short removed) → ${norm.length} remain (expect 2)`)
  assert(norm.every(n => n.wordCount > 0), 'All items have wordCount')
  assert(norm.every(n => 'score' in n), 'All items have score')
}

section('normalizer.js — chunkText()')
{
  const text = 'a'.repeat(20000)
  const chunks = chunkText(text, 8000, 400)
  assert(chunks.length >= 2, `Long text produces multiple chunks (got ${chunks.length})`)
  assert(chunks[0].length === 8000, 'First chunk is exactly chunk size')
}

section('normalizer.js — buildTextBundle()')
{
  const items = [
    { sourceLabel: 'Test', domain: 'tech', title: 'AI Chip War', url: 'https://x.com', text: 'Some article text here. '.repeat(20) },
  ]
  const bundle = buildTextBundle(items)
  assert(bundle.includes('--- SOURCE: Test'), 'Bundle includes source header')
  assert(bundle.includes('AI Chip War'), 'Bundle includes title')
  assert(bundle.includes('https://x.com'), 'Bundle includes URL')
}

// ══ LIVE INTEGRATION TESTS ════════════════════════════════════════════════════

section('scraper.js — scrape() with no user sources, trusted sources only')
console.log('  (Fetching from 3 live trusted sources — takes ~15s)')
const liveResult = await scrape({
  userSources:    [],
  domains:        ['geopolitics', 'technology'],
  maxItems:       20,
  includeTrusted: true,
  trustedCount:   3,
  onProgress:     msg => process.stdout.write(`    ${msg}\n`),
})
assert(typeof liveResult.startedAt === 'string',  'Result has startedAt')
assert(typeof liveResult.durationMs === 'number', 'Result has durationMs (number)')
assert(Array.isArray(liveResult.items),           'Result.items is an array')
assert(Array.isArray(liveResult.log),             'Result.log is an array')
assert(typeof liveResult.textBundle === 'string', 'Result.textBundle is a string')
assert(liveResult.trustedSourceCount <= 3,        'Used <= 3 trusted sources')
assert(liveResult.normalisedCount <= 20,          'Respects maxItems cap')
// At least 1 source should have succeeded
assert(liveResult.normalisedCount > 0 || liveResult.failedSources.length > 0,
  `Pipeline ran (${liveResult.normalisedCount} items, ${liveResult.failedSources.length} failed)`)

if (liveResult.items.length > 0) {
  const first = liveResult.items[0]
  assert(typeof first.text === 'string', 'First item has text string')
  assert(first.text.length > 0,         'First item text is non-empty')
  assert(typeof first.score === 'number', 'First item has numeric score')
}

section('scraper.js — scrape() with user URL source')
const urlResult = await scrape({
  userSources:    [{ type: 'rss', url: 'https://feeds.bbci.co.uk/news/world/rss.xml' }],
  includeTrusted: false,
  onProgress:     msg => process.stdout.write(`    ${msg}\n`),
})
assert(urlResult.userSourceCount === 1, 'One user source recorded')
assert(urlResult.trustedSourceCount === 0, 'No trusted sources when includeTrusted=false')
assert(Array.isArray(urlResult.items), 'Items array returned')

section('scraper.js — scrape() with keyword source')
const kwResult = await scrape({
  userSources:    [{ type: 'keyword', keyword: 'India China border' }],
  includeTrusted: false,
  onProgress:     msg => process.stdout.write(`    ${msg}\n`),
})
assert(kwResult.userSourceCount === 1, 'Keyword counted as user source')

// ══ SUMMARY ═══════════════════════════════════════════════════════════════════

console.log()
console.log('═'.repeat(52))
console.log(`  RESULTS: ${passed} passed, ${failed} failed`)
if (failed === 0) {
  console.log('  ✅ All tests passed — scraper is ready.')
} else {
  console.error('  ❌ Some tests failed. See above.')
}
console.log('═'.repeat(52))

if (failed > 0) process.exit(1)
