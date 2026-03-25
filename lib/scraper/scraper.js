/**
 * Neptune Web Scraper – Main Orchestrator
 * ----------------------------------------
 * Combines:
 *   - User-supplied dynamic sources (URLs, keywords, RSS feeds)
 *   - Neptune's 15 built-in trusted sources (filtered by relevance)
 *
 * Returns a structured ScrapeResult ready to be handed to the
 * entity-extraction pipeline (process/start/route.js) or used standalone.
 *
 * Usage (standalone):
 *   import { scrape } from '@/lib/scraper/scraper.js'
 *   const result = await scrape({ userSources, domains })
 */

import { TRUSTED_SOURCES, getRelevantSources } from './sources.js'
import { fetchSource, fetchUrl }               from './fetcher.js'
import { normalizeItems, buildTextBundle }     from './normalizer.js'

const DEFAULT_MAX_ITEMS    = 20
const DEFAULT_CONCURRENCY  = 4   // parallel fetches at once
const DEFAULT_TIMEOUT_EACH = 12_000  // 12s per source — tight enough for Vercel

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Run the full scrape pipeline.
 *
 * @param {object}   options
 * @param {SourceInput[]} [options.userSources=[]]   — user-supplied sources
 * @param {string[]} [options.domains=[]]            — ontology domains to filter trusted sources
 * @param {number}   [options.maxItems=40]           — max normalised items returned
 * @param {boolean}  [options.includeTrusted=true]   — whether to include Neptune's own sources
 * @param {number}   [options.trustedCount=8]        — how many trusted sources to use
 * @param {function} [options.onProgress]            — optional progress callback
 *
 * @returns {Promise<ScrapeResult>}
 */
export async function scrape({
  userSources    = [],
  domains        = [],
  maxItems       = DEFAULT_MAX_ITEMS,
  includeTrusted = true,
  trustedCount   = 8,
  onProgress     = null,
} = {}) {
  const startedAt = new Date().toISOString()
  const log = []
  const progress = (msg) => {
    log.push({ ts: new Date().toISOString(), msg })
    if (onProgress) onProgress(msg)
  }

  progress('🔍 Starting scrape pipeline')

  // 1. Build the full source list ─────────────────────────────────────────────
  // Normalise user sources into source-like objects
  const userSourceObjs = await buildUserSources(userSources, progress)

  // Select relevant trusted sources
  const trustedSourceObjs = includeTrusted
    ? getRelevantSources(domains).slice(0, trustedCount)
    : []

  const allSources = [...userSourceObjs, ...trustedSourceObjs]
  progress(`📋 Sources: ${userSourceObjs.length} user + ${trustedSourceObjs.length} trusted = ${allSources.length} total`)

  // 2. Fetch all sources concurrently (with concurrency cap) ─────────────────
  const rawItems = []
  const failed   = []

  for (let i = 0; i < allSources.length; i += DEFAULT_CONCURRENCY) {
    const batch  = allSources.slice(i, i + DEFAULT_CONCURRENCY)
    const results = await Promise.allSettled(
      batch.map(src => withTimeout(fetchSource(src), DEFAULT_TIMEOUT_EACH, []))
    )
    results.forEach((r, idx) => {
      const src = batch[idx]
      if (r.status === 'fulfilled') {
        rawItems.push(...r.value)
        progress(`  ✓ ${src.label} → ${r.value.length} item(s)`)
      } else {
        failed.push({ sourceId: src.id, error: r.reason?.message || 'Unknown error' })
        progress(`  ✗ ${src.label} → failed`)
      }
    })
  }

  progress(`📦 Raw items collected: ${rawItems.length}`)

  // 3. Normalise + deduplicate ────────────────────────────────────────────────
  const normalised = normalizeItems(rawItems, { maxItems })
  progress(`✅ Normalised items: ${normalised.length} (deduped from ${rawItems.length})`)

  // 4. Build text bundle (for direct Groq input) ──────────────────────────────
  const textBundle = buildTextBundle(normalised)

  const finishedAt = new Date().toISOString()
  const durationMs = new Date(finishedAt) - new Date(startedAt)

  progress(`🏁 Done in ${durationMs}ms`)

  return {
    startedAt,
    finishedAt,
    durationMs,
    sourceCount:      allSources.length,
    userSourceCount:  userSourceObjs.length,
    trustedSourceCount: trustedSourceObjs.length,
    rawItemCount:     rawItems.length,
    normalisedCount:  normalised.length,
    failedSources:    failed,
    items:            normalised,
    textBundle,       // ready to paste into Groq prompt
    log,
  }
}

/**
 * Scrape only a single URL (convenience wrapper).
 * @param {string} url
 * @returns {Promise<ScrapeResult>}
 */
export async function scrapeUrl(url) {
  return scrape({ userSources: [{ type: 'url', url }], includeTrusted: false })
}

// ── User source normalisation ─────────────────────────────────────────────────

/**
 * Converts flexible user input formats into internal source objects.
 * Supported inputs:
 *   { type: 'url',     url: 'https://...' }
 *   { type: 'rss',     url: 'https://...feed.xml' }
 *   { type: 'keyword', keyword: 'India Pakistan border' }  → DuckDuckGo search
 *   'https://...' (plain string)
 */
async function buildUserSources(userSources, progress) {
  const result = []
  for (const raw of userSources) {
    const src = typeof raw === 'string' ? { type: 'url', url: raw } : raw

    if (src.type === 'keyword' || src.keyword) {
      // Convert keyword to a DuckDuckGo search URL — fetcher will extract article links
      const kw    = src.keyword || src.url || ''
      const query = encodeURIComponent(kw)
      result.push({
        id:        `user-kw-${slugify(kw)}`,
        label:     `Keyword: ${kw}`,
        domain:    src.domain || 'unknown',
        type:      'keyword',
        isKeyword: true,
        url:       `https://html.duckduckgo.com/html/?q=${query}`,
        feed:      null,
      })
      progress(`  📌 Keyword source: "${kw}"`)
      continue
    }

    if (src.url) {
      const isRss = src.type === 'rss' || /\/(rss|feed|atom)/.test(src.url) || src.url.endsWith('.xml')
      result.push({
        id:     `user-${slugify(src.url)}`,
        label:  src.label || src.url,
        domain: src.domain || 'unknown',
        type:   src.type || 'web',
        url:    src.url,
        feed:   isRss ? src.url : (src.feed || null),
      })
      progress(`  📌 User source: ${src.url}`)
    }
  }
  return result
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function withTimeout(promise, ms, fallback) {
  return Promise.race([
    promise,
    new Promise(resolve => setTimeout(() => resolve(fallback), ms)),
  ])
}

function slugify(str = '') {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60)
}

/**
 * @typedef {Object} SourceInput
 * @property {'url'|'rss'|'keyword'} type
 * @property {string} [url]
 * @property {string} [keyword]
 * @property {string} [domain]
 * @property {string} [label]
 */

/**
 * @typedef {Object} ScrapeResult
 * @property {string}   startedAt
 * @property {string}   finishedAt
 * @property {number}   durationMs
 * @property {number}   sourceCount
 * @property {number}   userSourceCount
 * @property {number}   trustedSourceCount
 * @property {number}   rawItemCount
 * @property {number}   normalisedCount
 * @property {object[]} failedSources
 * @property {import('./normalizer.js').NormalizedItem[]} items
 * @property {string}   textBundle
 * @property {object[]} log
 */
