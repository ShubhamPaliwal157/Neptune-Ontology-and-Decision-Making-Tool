# Neptune Web Scraper

A standalone web scraper module that collects live intelligence from dynamic user sources **plus** Neptune's own curated trusted sources — ready to be plugged into the ontology entity-extraction pipeline.

---

## Files

```
lib/scraper/
  sources.js     — 15 curated trusted sources (geopolitics → society)
  fetcher.js     — Multi-strategy fetcher (RSS-first, HTML fallback)
  normalizer.js  — Dedup, scoring, chunking, text-bundle builder
  scraper.js     — Main orchestrator

scraper/
  run.mjs        — CLI runner (try it right now)
  test.mjs       — Full test harness (unit + live)
  README.md      — This file
```

---

## Quick Start

```bash
# List all 15 built-in trusted sources
node scraper/run.mjs --list-sources

# Scrape geopolitics + defense sources (trusted only)
node scraper/run.mjs --domain geopolitics --domain defense

# Add your own URL
node scraper/run.mjs --url https://feeds.reuters.com/reuters/businessNews

# Add a keyword (searches DuckDuckGo)
node scraper/run.mjs --keyword "India China border tensions"

# Mix everything, save to file
node scraper/run.mjs \
  --url https://www.bbc.com/news/world \
  --keyword "OPEC oil supply" \
  --domain economics \
  --max-items 30 \
  --output /tmp/scrape.json

# Print Groq-ready text bundle only (pipe to entity extractor)
node scraper/run.mjs --domain geopolitics --bundle-only > bundle.txt

# Disable trusted sources, use only your URL
node scraper/run.mjs --url https://example.com/feed.rss --no-trusted
```

---

## Trusted Sources (15 total)

| Domain       | Source                  |
|:-------------|:------------------------|
| geopolitics  | CFR Global Conflict Tracker |
| geopolitics  | BBC World News          |
| geopolitics  | Al Jazeera English      |
| economics    | Reuters Economy         |
| economics    | Financial Times Markets |
| economics    | IMF News                |
| defense      | Defense One             |
| defense      | Janes Defense News      |
| technology   | MIT Technology Review   |
| technology   | Wired                   |
| climate      | Carbon Brief            |
| climate      | Reuters Environment     |
| society      | UN News Centre          |
| society      | Pew Research Center     |
| organization | SIPRI                   |

---

## User Source Formats

```js
// In your code:
import { scrape } from '@/lib/scraper/scraper.js'

const result = await scrape({
  userSources: [
    { type: 'url',     url: 'https://example.com/page' },
    { type: 'rss',     url: 'https://example.com/feed.xml' },
    { type: 'keyword', keyword: 'India China border' },
    'https://raw-string-also-works.com',
  ],
  domains:        ['geopolitics', 'defense'],  // filter trusted sources
  maxItems:       40,
  includeTrusted: true,
  trustedCount:   8,
  onProgress:     (msg) => console.log(msg),
})

// result.items         — array of NormalizedItem
// result.textBundle    — single string ready for Groq
// result.log           — timestamped progress log
// result.failedSources — list of sources that errored
```

---

## ScrapeResult shape

```ts
{
  startedAt:          string      // ISO timestamp
  finishedAt:         string
  durationMs:         number
  sourceCount:        number
  userSourceCount:    number
  trustedSourceCount: number
  rawItemCount:       number
  normalisedCount:    number
  failedSources:      { sourceId, error }[]
  items:              NormalizedItem[]
  textBundle:         string      // Groq-ready text
  log:                { ts, msg }[]
}

NormalizedItem {
  id, sourceId, sourceLabel, domain,
  title, url, text,
  publishedAt, fetchedAt,
  score,       // freshness + quality score
  strategy,    // 'rss' | 'html'
  wordCount
}
```

---

## Connecting to the ontology pipeline

When ready to integrate, replace the `fetchSourceText()` + per-source loop in
`app/api/process/start/route.js` with:

```js
import { scrape } from '@/lib/scraper/scraper.js'

const result = await scrape({ userSources: sources, domains: workspace.domains })
// result.items is a drop-in replacement for the existing per-source text array
// Each item.text feeds directly into extractWithGroq()
```

---

## Run tests

```bash
node scraper/test.mjs
```

Tests cover:
- Source registry completeness (no duplicate IDs, all domains present)
- HTML cleaner edge cases
- Deduplication by fingerprint
- Text chunking
- Text bundle assembly
- Live RSS fetch from BBC World
- Live HTML fetch with keyword
- Full pipeline with 3 trusted sources
