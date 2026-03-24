#!/usr/bin/env node
/**
 * Neptune Web Scraper – CLI Runner
 * ─────────────────────────────────
 * Run this script directly to scrape sources and print results.
 *
 * Usage:
 *   node scraper/run.mjs [options]
 *
 * Options (all optional):
 *   --url <url>           Add a user URL source (repeatable)
 *   --rss <url>           Add a user RSS feed  (repeatable)
 *   --keyword <text>      Add a keyword search  (repeatable)
 *   --domain <name>       Filter trusted sources by domain (repeatable)
 *                         Values: geopolitics|economics|defense|technology|climate|society|organization
 *   --no-trusted          Skip Neptune's built-in trusted sources
 *   --max-items <n>       Maximum items to return (default: 40)
 *   --trusted-count <n>   How many trusted sources to include (default: 8)
 *   --output <path>       Write JSON result to a file instead of stdout
 *   --bundle-only         Print only the text bundle (no JSON)
 *   --help                Show this help
 *
 * Examples:
 *   node scraper/run.mjs --domain geopolitics --domain defense
 *   node scraper/run.mjs --url https://www.bbc.com/news/world --keyword "India China"
 *   node scraper/run.mjs --no-trusted --url https://feeds.reuters.com/reuters/businessNews
 *   node scraper/run.mjs --domain technology --output /tmp/scrape-result.json
 */

import { scrape }          from '../lib/scraper/scraper.js'
import { TRUSTED_SOURCES } from '../lib/scraper/sources.js'
import { writeFile }       from 'fs/promises'

// ── Parse CLI args ────────────────────────────────────────────────────────────

const argv = process.argv.slice(2)

if (argv.includes('--help') || argv.includes('-h')) {
  console.log(`
Neptune Web Scraper CLI
─────────────────────────────

Options:
  --url <url>           User URL source (repeatable)
  --rss <url>           User RSS feed (repeatable)
  --keyword <text>      Keyword search (repeatable)
  --domain <name>       Filter trusted sources by domain (repeatable)
  --no-trusted          Disable Neptune's trusted sources
  --max-items <n>       Max normalised items (default: 40)
  --trusted-count <n>   Trusted source count (default: 8)
  --output <path>       Write JSON to file
  --bundle-only         Print only the text bundle (Groq-ready)
  --list-sources        List all built-in trusted sources and exit

Domains: geopolitics | economics | defense | technology | climate | society | organization

Examples:
  node scraper/run.mjs --domain geopolitics
  node scraper/run.mjs --url https://example.com/feed.rss --keyword "AI chip war"
  node scraper/run.mjs --bundle-only --domain technology > bundle.txt
  `)
  process.exit(0)
}

if (argv.includes('--list-sources')) {
  console.log('\nNeptune Trusted Sources:\n')
  TRUSTED_SOURCES.forEach(s => {
    console.log(`  [${s.domain.padEnd(12)}] ${s.label}`)
    console.log(`               ${s.url}`)
    if (s.feed) console.log(`          feed: ${s.feed}`)
    console.log()
  })
  process.exit(0)
}

function getArg(flag) {
  const idx = argv.indexOf(flag)
  return idx !== -1 ? argv[idx + 1] : null
}

function getAllArgs(flag) {
  const vals = []
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === flag && argv[i + 1]) vals.push(argv[i + 1])
  }
  return vals
}

const userUrls     = getAllArgs('--url').map(u => ({ type: 'url', url: u }))
const userRss      = getAllArgs('--rss').map(u => ({ type: 'rss', url: u }))
const userKeywords = getAllArgs('--keyword').map(k => ({ type: 'keyword', keyword: k }))
const domains      = getAllArgs('--domain')
const includeTrusted = !argv.includes('--no-trusted')
const maxItems       = parseInt(getArg('--max-items')  || '40', 10)
const trustedCount   = parseInt(getArg('--trusted-count') || '8', 10)
const outputPath     = getArg('--output')
const bundleOnly     = argv.includes('--bundle-only')

const userSources = [...userUrls, ...userRss, ...userKeywords]

// ── Run ───────────────────────────────────────────────────────────────────────

console.error('\n◈ NEPTUNE SCRAPER')
console.error('─'.repeat(50))

const result = await scrape({
  userSources,
  domains,
  maxItems,
  includeTrusted,
  trustedCount,
  onProgress: (msg) => console.error(msg),
})

console.error('─'.repeat(50))
console.error(`\nSummary:`)
console.error(`  Sources:   ${result.userSourceCount} user + ${result.trustedSourceCount} trusted`)
console.error(`  Raw items: ${result.rawItemCount}`)
console.error(`  Final:     ${result.normalisedCount} items (deduped & ranked)`)
console.error(`  Duration:  ${result.durationMs}ms`)
if (result.failedSources.length > 0) {
  console.error(`  Failed:    ${result.failedSources.length} source(s)`)
  result.failedSources.forEach(f => console.error(`    ✗ ${f.sourceId}: ${f.error}`))
}
console.error()

// Output
if (bundleOnly) {
  process.stdout.write(result.textBundle + '\n')
} else if (outputPath) {
  await writeFile(outputPath, JSON.stringify(result, null, 2), 'utf8')
  console.error(`✓ Result written to ${outputPath}`)
} else {
  // Pretty item summary to stdout
  console.log(JSON.stringify({
    meta: {
      startedAt:     result.startedAt,
      finishedAt:    result.finishedAt,
      durationMs:    result.durationMs,
      sources:       result.sourceCount,
      items:         result.normalisedCount,
      failedSources: result.failedSources,
    },
    items: result.items.map(it => ({
      domain:      it.domain,
      sourceLabel: it.sourceLabel,
      title:       it.title,
      url:         it.url,
      score:       it.score,
      wordCount:   it.wordCount,
      strategy:    it.strategy,
      publishedAt: it.publishedAt,
      textPreview: it.text.slice(0, 200) + (it.text.length > 200 ? '…' : ''),
    })),
  }, null, 2))
}
