/**
 * Neptune Web Scraper – Trusted Source Registry
 * -----------------------------------------------
 * 15 curated, reliable sources grouped by domain.
 * Each source has a stable URL and an RSS/feed URL where available
 * so the scraper can pull fresh headlines without scraping HTML.
 *
 * Usage:
 *   import { TRUSTED_SOURCES, getSourcesByDomain } from './sources.js'
 */

export const TRUSTED_SOURCES = [

  // ── GEOPOLITICS ──────────────────────────────────────────────────────────────
  {
    id:     'cfr-global-conflict',
    label:  'CFR Global Conflict Tracker',
    domain: 'geopolitics',
    type:   'rss',
    url:    'https://www.cfr.org/global-conflict-tracker',
    feed:   'https://www.cfr.org/rss.xml',
    description: 'Council on Foreign Relations live conflict tracker — authoritative geopolitical analysis',
    tags:   ['conflict', 'international-relations', 'foreign-policy'],
  },
  {
    id:     'bbc-world',
    label:  'BBC World News',
    domain: 'geopolitics',
    type:   'rss',
    url:    'https://www.bbc.com/news/world',
    feed:   'https://feeds.bbci.co.uk/news/world/rss.xml',
    description: 'BBC World Service — global news coverage',
    tags:   ['news', 'geopolitics', 'international'],
  },
  {
    id:     'al-jazeera',
    label:  'Al Jazeera English',
    domain: 'geopolitics',
    type:   'rss',
    url:    'https://www.aljazeera.com/news',
    feed:   'https://www.aljazeera.com/xml/rss/all.xml',
    description: 'Al Jazeera English — Middle East and global coverage',
    tags:   ['news', 'middle-east', 'geopolitics'],
  },

  // ── ECONOMICS ────────────────────────────────────────────────────────────────
  {
    id:     'reuters-economy',
    label:  'Reuters Economy',
    domain: 'economics',
    type:   'rss',
    url:    'https://www.reuters.com/business/economy/',
    feed:   'https://feeds.reuters.com/reuters/businessNews',
    description: 'Reuters business & economy wire — fast, factual financial news',
    tags:   ['economy', 'markets', 'trade'],
  },
  {
    id:     'ft-markets',
    label:  'Financial Times Markets',
    domain: 'economics',
    type:   'web',
    url:    'https://www.ft.com/markets',
    feed:   null,
    description: 'Financial Times markets section — global finance and trade',
    tags:   ['finance', 'markets', 'economics'],
  },
  {
    id:     'imf-news',
    label:  'IMF Latest News',
    domain: 'economics',
    type:   'rss',
    url:    'https://www.imf.org/en/News',
    feed:   'https://www.imf.org/en/rss/',
    description: 'International Monetary Fund official news and reports',
    tags:   ['imf', 'global-economy', 'fiscal-policy'],
  },

  // ── DEFENSE ──────────────────────────────────────────────────────────────────
  {
    id:     'defense-one',
    label:  'Defense One',
    domain: 'defense',
    type:   'rss',
    url:    'https://www.defenseone.com',
    feed:   'https://www.defenseone.com/rss/all/',
    description: 'Defense One — military technology, strategy, and policy',
    tags:   ['military', 'defense', 'strategy'],
  },
  {
    id:     'janes-news',
    label:  'Janes Defense News',
    domain: 'defense',
    type:   'web',
    url:    'https://www.janes.com/defence-news',
    feed:   null,
    description: 'Janes — premier defense intelligence & military equipment news',
    tags:   ['defense', 'weapons', 'military'],
  },

  // ── TECHNOLOGY ───────────────────────────────────────────────────────────────
  {
    id:     'mit-tech-review',
    label:  'MIT Technology Review',
    domain: 'technology',
    type:   'rss',
    url:    'https://www.technologyreview.com',
    feed:   'https://www.technologyreview.com/feed/',
    description: 'MIT Technology Review — AI, semiconductors, and emerging tech',
    tags:   ['ai', 'technology', 'semiconductors', 'innovation'],
  },
  {
    id:     'wired-science',
    label:  'Wired',
    domain: 'technology',
    type:   'rss',
    url:    'https://www.wired.com',
    feed:   'https://www.wired.com/feed/rss',
    description: 'Wired — technology, culture, and science reporting',
    tags:   ['technology', 'ai', 'culture'],
  },

  // ── CLIMATE ──────────────────────────────────────────────────────────────────
  {
    id:     'carbon-brief',
    label:  'Carbon Brief',
    domain: 'climate',
    type:   'rss',
    url:    'https://www.carbonbrief.org',
    feed:   'https://www.carbonbrief.org/feed',
    description: 'Carbon Brief — climate science, policy, and data journalism',
    tags:   ['climate', 'emissions', 'energy', 'environment'],
  },
  {
    id:     'reuters-environment',
    label:  'Reuters Environment',
    domain: 'climate',
    type:   'rss',
    url:    'https://www.reuters.com/business/environment/',
    feed:   'https://feeds.reuters.com/reuters/environment',
    description: 'Reuters environment and ESG coverage',
    tags:   ['climate', 'esg', 'energy-transition'],
  },

  // ── SOCIETY ──────────────────────────────────────────────────────────────────
  {
    id:     'un-news',
    label:  'UN News Centre',
    domain: 'society',
    type:   'rss',
    url:    'https://news.un.org/en/',
    feed:   'https://news.un.org/feed/subscribe/en/news/all/rss.xml',
    description: 'United Nations official news — humanitarian, rights, development',
    tags:   ['un', 'humanitarian', 'human-rights', 'society'],
  },
  {
    id:     'pew-research',
    label:  'Pew Research Center',
    domain: 'society',
    type:   'rss',
    url:    'https://www.pewresearch.org',
    feed:   'https://www.pewresearch.org/feed/',
    description: 'Pew Research — data-driven social, political, demographic research',
    tags:   ['demographics', 'society', 'polling', 'research'],
  },

  // ── ORGANIZATION / POLICY ────────────────────────────────────────────────────
  {
    id:     'sipri',
    label:  'SIPRI',
    domain: 'organization',
    type:   'rss',
    url:    'https://www.sipri.org/news',
    feed:   'https://www.sipri.org/rss.xml',
    description: 'Stockholm International Peace Research Institute — arms, conflict data',
    tags:   ['arms', 'security', 'conflict', 'organization'],
  },
]

/**
 * Get a subset of trusted sources filtered by domain.
 * @param {string|string[]} domains
 * @returns {object[]}
 */
export function getSourcesByDomain(domains) {
  const target = Array.isArray(domains) ? domains : [domains]
  if (!target.length || target[0] === 'all') return TRUSTED_SOURCES
  return TRUSTED_SOURCES.filter(s => target.includes(s.domain))
}

/**
 * Get sources for multiple domains relevant to the ontology domains list.
 * @param {string[]} ontologyDomains — e.g. ['geopolitics','technology']
 * @returns {object[]}  always includes at least 5 sources
 */
export function getRelevantSources(ontologyDomains = []) {
  const direct    = getSourcesByDomain(ontologyDomains)
  const remainder = TRUSTED_SOURCES.filter(s => !direct.includes(s))
  // Always pad to at least 5 sources
  const padded = direct.length >= 5 ? direct : [...direct, ...remainder.slice(0, 5 - direct.length)]
  return padded
}
