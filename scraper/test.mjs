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

import { scrape, scrapeUrl }                          from '../lib/scraper/scraper.js'
import { fetchSource, fetchUrl, cleanHtml }           from '../lib/scraper/fetcher.js'
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
assert(TRUSTED_SOURCES.length >= 15, `At least 15 trusted sources (got ${TRUSTED_SOURCES.length})`)
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
{
  const ids = TRUSTED_SOURCES.map(s => s.id)
  const unique = new Set(ids)
  assert(ids.length === unique.size, 'No duplicate source IDs')
}
// Verify no dead RSS feeds are registered (all feeds should be null or a real URL)
{
  const deadFeeds = ['https://feeds.reuters.com', 'https://www.sipri.org/rss.xml', 'https://www.imf.org/en/rss/']
  const hasDead = TRUSTED_SOURCES.some(s => s.feed && deadFeeds.some(d => s.feed.startsWith(d.split('/rss')[0]) && d === s.feed))
  assert(!hasDead, 'No known-dead RSS feeds in registry')
}

section('fetcher.js — cleanHtml()')
assert(cleanHtml('<p>Hello <b>World</b>!</p>') === 'Hello World !', 'Strips basic tags')
assert(cleanHtml('<script>alert("x")</script>Text') === 'Text', 'Strips <script>')
assert(cleanHtml('<style>.a{color:red}</style>Text') === 'Text', 'Strips <style>')
assert(cleanHtml('<nav>menu</nav>Content') === 'Content', 'Strips <nav>')
assert(cleanHtml('<footer>footer</footer>Content') === 'Content', 'Strips <footer>')
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
    makeItem('a-dup', 'NATO summit reveals joint defense pact between member nations. Chiefs of defense were present.'),
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

section('Live: BBC World RSS feed (direct fetchSource)')
console.log('  (Fetching BBC World RSS…)')
const bbcSource = TRUSTED_SOURCES.find(s => s.id === 'bbc-world')
const bbcItems = await fetchSource(bbcSource)
assert(Array.isArray(bbcItems), 'fetchSource returns array')
assert(bbcItems.length > 0, `BBC RSS returned ${bbcItems.length} items (expect > 0)`)
if (bbcItems.length > 0) {
  assert(typeof bbcItems[0].title === 'string' && bbcItems[0].title.length > 0, 'Items have title')
  assert(typeof bbcItems[0].text  === 'string' && bbcItems[0].text.length  > 0, 'Items have text')
  assert(bbcItems[0].strategy === 'rss', 'Strategy is rss')
}

section('Live: Al Jazeera RSS feed')
console.log('  (Fetching Al Jazeera RSS…)')
const ajSource = TRUSTED_SOURCES.find(s => s.id === 'al-jazeera')
const ajItems = await fetchSource(ajSource)
assert(ajItems.length > 0, `Al Jazeera RSS returned ${ajItems.length} items`)

section('Live: MIT Technology Review RSS')
console.log('  (Fetching MIT Tech Review RSS…)')
const mitSource = TRUSTED_SOURCES.find(s => s.id === 'mit-tech-review')
const mitItems = await fetchSource(mitSource)
assert(mitItems.length > 0, `MIT Tech Review returned ${mitItems.length} items`)

section('Live: Carbon Brief RSS')
console.log('  (Fetching Carbon Brief RSS…)')
const cbSource = TRUSTED_SOURCES.find(s => s.id === 'carbon-brief')
const cbItems = await fetchSource(cbSource)
assert(cbItems.length > 0, `Carbon Brief returned ${cbItems.length} items`)

section('Live: Foreign Policy RSS')
console.log('  (Fetching Foreign Policy RSS…)')
const fpSource = TRUSTED_SOURCES.find(s => s.id === 'foreign-policy')
const fpItems = await fetchSource(fpSource)
assert(fpItems.length > 0, `Foreign Policy returned ${fpItems.length} items`)

section('Live: scrape() — trusted sources only (3 sources)')
console.log('  (Full pipeline with 3 trusted sources — ~15s)')
const liveResult = await scrape({
  userSources:    [],
  domains:        ['geopolitics', 'technology'],
  maxItems:       20,
  includeTrusted: true,
  trustedCount:   3,
  onProgress:     msg => process.stdout.write(`    ${msg}\n`),
})
assert(typeof liveResult.startedAt === 'string',  'Result has startedAt')
assert(typeof liveResult.durationMs === 'number', 'Result has durationMs')
assert(Array.isArray(liveResult.items),           'Result.items is array')
assert(Array.isArray(liveResult.log),             'Result.log is array')
assert(typeof liveResult.textBundle === 'string', 'Result.textBundle is string')
assert(liveResult.trustedSourceCount <= 3,        'Used <= 3 trusted sources')
assert(liveResult.normalisedCount <= 20,          'Respects maxItems cap')
assert(liveResult.normalisedCount > 0 || liveResult.failedSources.length > 0,
  `Pipeline ran (${liveResult.normalisedCount} items, ${liveResult.failedSources.length} failed)`)
if (liveResult.items.length > 0) {
  const first = liveResult.items[0]
  assert(typeof first.text === 'string' && first.text.length > 0, 'First item has non-empty text')
  assert(typeof first.score === 'number', 'First item has numeric score')
  assert(typeof first.wordCount === 'number', 'First item has wordCount')
}

section('Live: scrape() — user RSS URL source')
const urlResult = await scrape({
  userSources:    [{ type: 'rss', url: 'https://feeds.bbci.co.uk/news/world/rss.xml' }],
  includeTrusted: false,
  onProgress:     msg => process.stdout.write(`    ${msg}\n`),
})
assert(urlResult.userSourceCount === 1,    'One user source recorded')
assert(urlResult.trustedSourceCount === 0, 'No trusted sources when includeTrusted=false')
assert(Array.isArray(urlResult.items),     'Items array returned')
assert(urlResult.items.length > 0,         `Got ${urlResult.items.length} items from user RSS`)

section('Live: scrape() — keyword source (article extraction)')
console.log('  (Keyword search + article fetch — ~20s)')
const kwResult = await scrape({
  userSources:    [{ type: 'keyword', keyword: 'India China border tensions 2025' }],
  includeTrusted: false,
  onProgress:     msg => process.stdout.write(`    ${msg}\n`),
})
assert(kwResult.userSourceCount === 1, 'Keyword counted as user source')
assert(Array.isArray(kwResult.items),  'Items array returned for keyword')
console.log(`    → Keyword search returned ${kwResult.items.length} article(s)`)
if (kwResult.items.length > 0) {
  assert(kwResult.items[0].text.length > 100, 'Keyword articles have real text content')
}

section('Live: textBundle is Groq-ready')
{
  const bundle = liveResult.textBundle
  assert(bundle.length > 100, `textBundle has content (${bundle.length} chars)`)
  assert(bundle.includes('--- SOURCE:'), 'textBundle has source headers')
  assert(bundle.includes('TITLE:'), 'textBundle has titles')
  assert(bundle.includes('URL:'), 'textBundle has URLs')
}

// ══ SUMMARY ═══════════════════════════════════════════════════════════════════

console.log()
console.log('═'.repeat(52))
console.log(`  RESULTS: ${passed} passed, ${failed} failed`)
if (failed === 0) {
  console.log('  ✅ All tests passed — scraper is ready.')
} else {
  console.error(`  ❌ ${failed} test(s) failed. See above.`)
}
console.log('═'.repeat(52))

if (failed > 0) process.exit(1)
