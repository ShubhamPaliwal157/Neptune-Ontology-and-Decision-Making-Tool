/**
 * Neptune Web Scraper – Fetcher
 * -----------------------------------------------
 * Strategies (tried in order per source):
 *   1. RSS/Atom XML feed  → structured, fast, no JS needed
 *   2. HTML fetch + clean → fallback for sources without feeds
 *
 * Returns a normalised { title, url, text, publishedAt, source } object
 * for every article/item found.
 */

const USER_AGENT = 'Mozilla/5.0 (compatible; NeptuneIntelBot/2.0; +https://neptune.app)'
const TIMEOUT_MS = 20_000
const MAX_TEXT_CHARS = 15_000   // per page/article
const MAX_ITEMS_PER_SOURCE = 8  // RSS items to pull per feed

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Fetch content from a single source object.
 * @param {object} source  — one entry from sources.js (has .feed, .url, .type)
 * @returns {Promise<ScrapedItem[]>}
 */
export async function fetchSource(source) {
  try {
    // Prefer RSS/Atom feed if available
    if (source.feed) {
      const items = await fetchFeed(source.feed, source)
      if (items.length > 0) return items
    }
    // Fall back to HTML
    const item = await fetchHtml(source.url, source)
    return item ? [item] : []
  } catch (err) {
    console.error(`[fetcher] ✗ ${source.label}: ${err.message}`)
    return []
  }
}

/**
 * Fetch from a plain URL (used for user-provided dynamic sources).
 * Tries RSS first if the URL looks like a feed, then HTML.
 * @param {string} url
 * @param {string} [label]
 * @returns {Promise<ScrapedItem[]>}
 */
export async function fetchUrl(url, label = '') {
  const source = { id: slugify(url), label: label || url, domain: 'unknown', feed: null, url }
  // Detect feed-like URLs
  if (/\/(rss|feed|atom)\/?/.test(url) || url.endsWith('.xml') || url.endsWith('.rss')) {
    source.feed = url
  }
  return fetchSource(source)
}

// ── RSS/Atom Parser ───────────────────────────────────────────────────────────

async function fetchFeed(feedUrl, source) {
  const xml = await httpGet(feedUrl)
  if (!xml) return []
  return parseXmlFeed(xml, source)
}

function parseXmlFeed(xml, source) {
  const items = []

  // Support both RSS <item> and Atom <entry>
  const tagPattern = /<(item|entry)[\s>]([\s\S]*?)<\/(item|entry)>/gi
  let match
  let count = 0

  while ((match = tagPattern.exec(xml)) !== null && count < MAX_ITEMS_PER_SOURCE) {
    const chunk = match[2]

    const title       = extractTag(chunk, 'title')
    const link        = extractTag(chunk, 'link') || extractAttr(chunk, 'link', 'href')
    const description = extractTag(chunk, 'description') || extractTag(chunk, 'summary') || extractTag(chunk, 'content')
    const pubDate     = extractTag(chunk, 'pubDate') || extractTag(chunk, 'published') || extractTag(chunk, 'updated')

    if (!title && !description) continue

    const text = cleanHtml(description || '').slice(0, MAX_TEXT_CHARS)

    items.push({
      id:          slugify(`${source.id}-${title || link || count}`),
      sourceId:    source.id,
      sourceLabel: source.label,
      domain:      source.domain,
      title:       cleanHtml(title || ''),
      url:         link?.trim() || source.url,
      text,
      publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
      fetchedAt:   new Date().toISOString(),
      strategy:    'rss',
    })
    count++
  }

  return items
}

// ── HTML Scraper ──────────────────────────────────────────────────────────────

async function fetchHtml(url, source) {
  const html = await httpGet(url)
  if (!html) return null

  const title = extractTag(html, 'title') || source.label
  const text  = cleanHtml(html).slice(0, MAX_TEXT_CHARS)

  if (!text.trim()) return null

  return {
    id:          slugify(`${source.id}-html`),
    sourceId:    source.id,
    sourceLabel: source.label,
    domain:      source.domain,
    title:       cleanHtml(title),
    url,
    text,
    publishedAt: new Date().toISOString(),
    fetchedAt:   new Date().toISOString(),
    strategy:    'html',
  }
}

// ── HTTP helpers ──────────────────────────────────────────────────────────────

async function httpGet(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, 'Accept': 'text/html,application/xhtml+xml,application/xml,*/*' },
      signal:  AbortSignal.timeout(TIMEOUT_MS),
      redirect: 'follow',
    })
    if (!res.ok) return null
    return await res.text()
  } catch {
    return null
  }
}

// ── Text utilities ────────────────────────────────────────────────────────────

/** Strip all HTML tags, decode basic entities, collapse whitespace */
export function cleanHtml(html = '') {
  return html
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1')  // unwrap CDATA
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g,  '&')
    .replace(/&lt;/g,   '<')
    .replace(/&gt;/g,   '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#\d+;/g, ' ')
    .replace(/&[a-z]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Extract inner text of the first occurrence of a simple XML/HTML tag */
function extractTag(xml, tag) {
  const m = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i').exec(xml)
  return m ? cleanHtml(m[1]) : ''
}

/** Extract an XML attribute value (e.g., href from <link href="...">) */
function extractAttr(xml, tag, attr) {
  const m = new RegExp(`<${tag}[^>]*\\s${attr}=["']([^"']+)["']`, 'i').exec(xml)
  return m ? m[1] : ''
}

/** URL/text → safe slug id */
function slugify(str) {
  return str
    .toLowerCase()
    .replace(/https?:\/\//g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

/**
 * @typedef {Object} ScrapedItem
 * @property {string} id
 * @property {string} sourceId
 * @property {string} sourceLabel
 * @property {string} domain
 * @property {string} title
 * @property {string} url
 * @property {string} text
 * @property {string} publishedAt
 * @property {string} fetchedAt
 * @property {'rss'|'html'} strategy
 */
