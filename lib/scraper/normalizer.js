/**
 * Neptune Web Scraper – Text Normalizer
 * -----------------------------------------------
 * Cleans and prepares scraped text for ontology entity extraction.
 * - Deduplicates near-identical items from different sources
 * - Chunks long text into manageable pieces
 * - Scores items by freshness + domain relevance
 * - NLP signal extraction: filters sentences to high-signal content only
 */

const MIN_TEXT_LENGTH = 80
const CHUNK_SIZE      = 8000
const CHUNK_OVERLAP   = 400

// ── Domain keyword sets for signal scoring ────────────────────────────────────
const DOMAIN_KEYWORDS = {
  geopolitics:  ['war','conflict','treaty','sanction','alliance','border','territory','sovereignty','diplomat','military','government','president','minister','nation','state','election','coup','protest','ceasefire','invasion','negotiation'],
  economics:    ['gdp','trade','tariff','inflation','recession','investment','market','export','import','currency','debt','bank','fund','growth','supply','demand','price','oil','energy','commodity'],
  defense:      ['missile','weapon','army','navy','airforce','nuclear','drone','attack','defense','security','intelligence','spy','threat','bomb','soldier','troops','base','radar','satellite'],
  technology:   ['ai','semiconductor','chip','data','cyber','hack','software','hardware','tech','digital','internet','cloud','algorithm','robot','automation','startup','patent','innovation'],
  climate:      ['climate','carbon','emission','temperature','flood','drought','wildfire','renewable','solar','wind','fossil','pollution','glacier','sea level','biodiversity','deforestation'],
  society:      ['poverty','inequality','human rights','labour','child','education','health','migration','refugee','protest','discrimination','gender','religion','culture','population'],
}

// Proper noun pattern — capitalized words (likely named entities)
const PROPER_NOUN_RE = /\b[A-Z][a-z]{2,}\b/g

// Boilerplate patterns to drop entire sentences
const BOILERPLATE_RE = /cookie|subscribe|newsletter|advertisement|click here|read more|sign up|terms of service|privacy policy|all rights reserved|javascript|loading\.\.\.|share this|follow us/i

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
    // Run NLP signal extraction on each item's text before bundling
    const signalText = extractSignalText(item.text, item.domain, 30)

    const section = [
      `--- SOURCE: ${item.sourceLabel} | DOMAIN: ${item.domain} ---`,
      item.title ? `TITLE: ${item.title}` : '',
      `URL: ${item.url}`,
      signalText,
      '',
    ].filter(Boolean).join('\n')

    if (out.length + section.length > maxChars) break
    out += section + '\n'
  }
  return out.trim()
}

// ── NLP Signal Extraction ─────────────────────────────────────────────────────

/**
 * extractSignalText — NLP pre-processing layer
 *
 * Takes raw article text and returns only the high-signal sentences:
 * 1. Tokenizes into sentences
 * 2. Drops boilerplate / low-information sentences
 * 3. Scores each sentence by proper noun density + domain keyword hits
 * 4. Deduplicates near-identical sentences across the text
 * 5. Returns top-K sentences reassembled in original order
 *
 * @param {string} text       — raw article text
 * @param {string} [domain]   — item domain for keyword boosting
 * @param {number} [topK=30]  — max sentences to keep
 * @returns {string}          — filtered, compressed signal text
 */
export function extractSignalText(text = '', domain = '', topK = 30) {
  if (!text || text.length < 100) return text

  // 1. Tokenize into sentences
  const sentences = tokenizeSentences(text)
  if (sentences.length <= topK) return text  // already short enough

  // 2. Score each sentence
  const domainKws = DOMAIN_KEYWORDS[domain] || Object.values(DOMAIN_KEYWORDS).flat()
  const scored = sentences.map((s, idx) => ({
    text: s,
    idx,
    score: scoreSentence(s, domainKws),
  }))

  // 3. Filter out boilerplate
  const filtered = scored.filter(s => !BOILERPLATE_RE.test(s.text) && s.text.length > 40)

  // 4. Deduplicate near-identical sentences
  const deduped = []
  const seenTokens = []
  for (const s of filtered) {
    const tokens = new Set(tokenizeWords(s.text))
    const isDupe = seenTokens.some(prev => {
      const intersection = [...tokens].filter(t => prev.has(t)).length
      const union = new Set([...tokens, ...prev]).size
      return union > 0 && intersection / union > 0.72
    })
    if (!isDupe) {
      deduped.push(s)
      seenTokens.push(tokens)
    }
  }

  // 5. Pick top-K by score, then re-sort by original position for readability
  const topSentences = deduped
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .sort((a, b) => a.idx - b.idx)

  return topSentences.map(s => s.text).join(' ')
}

function tokenizeSentences(text) {
  // Split on sentence-ending punctuation followed by whitespace + capital letter
  return text
    .replace(/([.!?])\s+(?=[A-Z])/g, '$1\n')
    .split('\n')
    .map(s => s.trim())
    .filter(s => s.length > 20)
}

function tokenizeWords(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2)
}

function scoreSentence(sentence, domainKeywords) {
  let score = 0

  // Proper noun count (named entities = high signal)
  const properNouns = sentence.match(PROPER_NOUN_RE) || []
  score += properNouns.length * 2

  // Domain keyword hits
  const lower = sentence.toLowerCase()
  for (const kw of domainKeywords) {
    if (lower.includes(kw)) score += 3
  }

  // Numbers / statistics = factual signal
  const numbers = sentence.match(/\b\d+(\.\d+)?(%|bn|mn|trillion|billion|million|km|kg)?\b/g) || []
  score += numbers.length

  // Quoted speech = direct source
  if (/"[^"]{10,}"/.test(sentence)) score += 2

  // Penalise very short sentences
  if (sentence.length < 60) score -= 2

  return score
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
