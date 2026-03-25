/**
 * Neptune Web Scraper – Text Normalizer
 * -----------------------------------------------
 * Cleans and prepares scraped text for ontology entity extraction.
 * - Deduplicates near-identical items from different sources
 * - Chunks long text into manageable pieces
 * - Scores items by freshness + domain relevance
 */

const MIN_TEXT_LENGTH = 80   // ignore items with less text than this
const CHUNK_SIZE      = 8000 // characters per chunk fed to Groq
const CHUNK_OVERLAP   = 400  // overlap to preserve sentence context

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Normalize and deduplicate a list of ScrapedItems.
 * @param {import('./fetcher.js').ScrapedItem[]} items
 * @param {object} [options]
 * @param {number} [options.maxItems=40] — max items after dedup
 * @returns {NormalizedItem[]}
 */
export function normalizeItems(items, { maxItems = 40 } = {}) {
  // 1. Filter too-short items
  const filtered = items.filter(i => (i.text || '').length >= MIN_TEXT_LENGTH)

  // 2. Deduplicate by text fingerprint (first 300 chars, lowercased, whitespace-collapsed)
  const seen   = new Map()
  const unique = []
  for (const item of filtered) {
    const fp = fingerprint(item.text)
    if (!seen.has(fp)) {
      seen.set(fp, true)
      unique.push(item)
    }
  }

  // 3. Score by freshness
  const scored = unique.map(item => ({
    ...item,
    score: computeScore(item),
  }))

  // 4. Sort by score descending
  scored.sort((a, b) => b.score - a.score)

  // 5. Cap to maxItems
  return scored.slice(0, maxItems).map(toNormalized)
}

/**
 * Split a single long text into overlapping chunks ready for Groq.
 * @param {string} text
 * @returns {string[]}
 */
export function chunkText(text, size = CHUNK_SIZE, overlap = CHUNK_OVERLAP) {
  const chunks = []
  let start = 0
  while (start < text.length) {
    chunks.push(text.slice(start, start + size))
    start += size - overlap
  }
  return chunks
}

/**
 * Merge all normalized items into a single text bundle,
 * prefixed with source attribution, capped at maxChars.
 * Used when you want to send one big context to Groq.
 * @param {NormalizedItem[]} items
 * @param {number} [maxChars=50000]
 * @returns {string}
 */
export function buildTextBundle(items, maxChars = 50_000) {
  let out = ''
  for (const item of items) {
    const section = [
      `--- SOURCE: ${item.sourceLabel} | DOMAIN: ${item.domain} ---`,
      item.title ? `TITLE: ${item.title}` : '',
      `URL: ${item.url}`,
      item.text,
      '',
    ].filter(Boolean).join('\n')

    if (out.length + section.length > maxChars) break
    out += section + '\n'
  }
  return out.trim()
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fingerprint(text = '') {
  return text.toLowerCase().replace(/\s+/g, ' ').slice(0, 300)
}

function computeScore(item) {
  let score = 5  // base
  // Freshness boost: items published today get +3, last 3 days +1
  try {
    const ageMs = Date.now() - new Date(item.publishedAt).getTime()
    const ageDays = ageMs / 86_400_000
    if (ageDays < 1)  score += 3
    else if (ageDays < 3) score += 1
  } catch { /* ignore if date is bad */ }

  // RSS items (more structured) get a slight boost
  if (item.strategy === 'rss') score += 1

  // Longer text means more signal
  if (item.text.length > 2000) score += 1
  if (item.text.length > 6000) score += 1

  return score
}

function toNormalized(item) {
  return {
    id:          item.id,
    sourceId:    item.sourceId,
    sourceLabel: item.sourceLabel,
    domain:      item.domain,
    title:       item.title,
    url:         item.url,
    text:        item.text.trim(),
    publishedAt: item.publishedAt,
    fetchedAt:   item.fetchedAt,
    score:       item.score,
    strategy:    item.strategy,
    wordCount:   item.text.split(/\s+/).length,
  }
}

/**
 * @typedef {Object} NormalizedItem
 * @property {string} id
 * @property {string} sourceId
 * @property {string} sourceLabel
 * @property {string} domain
 * @property {string} title
 * @property {string} url
 * @property {string} text
 * @property {string} publishedAt
 * @property {string} fetchedAt
 * @property {number} score
 * @property {'rss'|'html'} strategy
 * @property {number} wordCount
 */
