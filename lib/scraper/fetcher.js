/**
 * Neptune Web Scraper – Fetcher
 * -----------------------------------------------
 * Strategies (tried in order per source):
 *   1. RSS/Atom XML feed  → structured, fast, no JS needed
 *   2. Keyword search     → extracts article links from DuckDuckGo HTML, fetches top results
 *   3. HTML fetch + clean → fallback for sources without feeds
 *
 * Returns a normalised { title, url, text, publishedAt, source } object
 * for every article/item found.
 */

const USER_AGENT     = 'Mozilla/5.0 (compatible; NeptuneIntelBot/2.0; +https://neptune.app)'
const TIMEOUT_MS     = 10_000  // 10s per HTTP request — keeps Vercel happy
const MAX_TEXT_CHARS = 15_000   // per page/article
const MAX_ITEMS_PER_SOURCE  = 8  // RSS items to pull per feed
const MAX_KEYWORD_RESULTS   = 5  // article links to follow from a keyword search

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Fetch content from a single source object.
 * @param {object} source  — one entry from sources.js (has .feed, .url, .type)
 * @returns {Promise<ScrapedItem[]>}
 */
export async function fetchSource(source) {
  try {
    // 1. Prefer RSS/Atom feed if available
    if (source.feed) {
      const items = await fetchFeed(source.feed, source)
      if (items.length > 0) return items
    }

    // 2. Keyword search — extract article links from search results page
    if (source.type === 'keyword' || source.isKeyword) {
      return await fetchKeywordResults(source)
    }

    // 3. Fall back to HTML
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

// ── Keyword Search → Article Fetcher ─────────────────────────────────────────

/**
 * Fetches a DuckDuckGo search results page, extracts article links,
 * then fetches the top N articles for real text content.
 */
async function fetchKeywordResults(source) {
  const html = await httpGet(source.url)
  if (!html) return []

  // Extract result links from DuckDuckGo HTML results page
  const links = extractSearchLinks(html)

  if (links.length === 0) {
    // Fallback: return the search page itself as a single item
    const text = cleanHtml(html).slice(0, MAX_TEXT_CHARS)
    if (!text.trim()) return []
    return [{
      id:          slugify(`${source.id}-search`),
      sourceId:    source.id,
      sourceLabel: source.label,
      domain:      source.domain,
      title:       source.label,
      url:         source.url,
      text,
      publishedAt: new Date().toISOString(),
      fetchedAt:   new Date().toISOString(),
      strategy:    'keyword-html',
    }]
  }

  // Fetch top N article pages in parallel
  const top = links.slice(0, MAX_KEYWORD_RESULTS)
  const results = await Promise.allSettled(
    top.map(link => fetchHtml(link.url, { ...source, id: slugify(link.url), label: link.title || source.label }))
  )

  const items = []
  results.forEach((r, i) => {
    if (r.status === 'fulfilled' && r.value) {
      items.push({
        ...r.value,
        // Override with the search result title if the page title is generic
        title: r.value.title || top[i].title || source.label,
        strategy: 'keyword',
      })
    }
  })

  return items
}

/**
 * Extract article links from a DuckDuckGo HTML search results page.
 * DuckDuckGo wraps results in <a class="result__a" href="...">
 */
function extractSearchLinks(html) {
  const links = []
  const seen  = new Set()

  // DuckDuckGo result links pattern
  const patterns = [
    /<a[^>]+class="[^"]*result__a[^"]*"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi,
    /<a[^>]+href="(https?:\/\/[^"]+)"[^>]*class="[^"]*result[^"]*"[^>]*>([\s\S]*?)<\/a>/gi,
  ]

  for (const pattern of patterns) {
    let m
    while ((m = pattern.exec(html)) !== null && links.length < 20) {
      const url   = m[1].trim()
      const title = cleanHtml(m[2]).slice(0, 200)

      // Skip DuckDuckGo internal links, ads, and duplicates
      if (!url.startsWith('http')) continue
      if (url.includes('duckduckgo.com')) continue
      if (url.includes('duck.co')) continue
      if (seen.has(url)) continue

      seen.add(url)
      links.push({ url, title })
    }
    if (links.length > 0) break
  }

  return links
}

// ── HTML Scraper ──────────────────────────────────────────────────────────────

async function fetchHtml(url, source) {
  const html = await httpGet(url)
  if (!html) return null

  const title = extractTag(html, 'title') || source.label
  const text  = extractArticleText(html).slice(0, MAX_TEXT_CHARS)

  if (!text.trim()) return null

  return {
    id:          slugify(`${source.id}-html`),
    sourceId:    source.id,
    sourceLabel: source.label,
    domain:      source.domain,
    title:       cleanHtml(title),
    url,
    text,
    publishedAt: extractPublishedDate(html) || new Date().toISOString(),
    fetchedAt:   new Date().toISOString(),
    strategy:    'html',
  }
}

/**
 * Extract the main article body text from an HTML page.
 * Tries semantic article containers first, falls back to full body clean.
 */
function extractArticleText(html) {
  // Try to isolate the article body using common semantic containers
  const articlePatterns = [
    /<article[^>]*>([\s\S]*?)<\/article>/i,
    /<main[^>]*>([\s\S]*?)<\/main>/i,
    /<div[^>]+(?:class|id)="[^"]*(?:article|content|story|post|body|entry)[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
  ]

  for (const pattern of articlePatterns) {
    const m = pattern.exec(html)
    if (m) {
      const text = cleanHtml(m[1])
      if (text.length > 200) return text
    }
  }

  // Full page fallback
  return cleanHtml(html)
}

/**
 * Try to extract a published date from common meta tags.
 */
function extractPublishedDate(html) {
  const patterns = [
    /<meta[^>]+(?:property|name)="(?:article:published_time|datePublished|pubdate)"[^>]+content="([^"]+)"/i,
    /<time[^>]+datetime="([^"]+)"/i,
  ]
  for (const p of patterns) {
    const m = p.exec(html)
    if (m) {
      try { return new Date(m[1]).toISOString() } catch { /* ignore */ }
    }
  }
  return null
}

// ── HTTP helpers ──────────────────────────────────────────────────────────────

async function httpGet(url, retries = 1) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml,application/xml,*/*',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        signal:   AbortSignal.timeout(TIMEOUT_MS),
        redirect: 'follow',
      })
      if (!res.ok) return null
      return await res.text()
    } catch (err) {
      if (attempt === retries) return null
      await new Promise(r => setTimeout(r, 500))
    }
  }
  return null
}

// ── Text utilities ────────────────────────────────────────────────────────────

/** Strip all HTML tags, decode basic entities, collapse whitespace */
export function cleanHtml(html = '') {
  return html
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
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
 * @property {'rss'|'html'|'keyword'|'keyword-html'} strategy
 */
