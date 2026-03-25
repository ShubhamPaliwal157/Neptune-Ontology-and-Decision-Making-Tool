# Neptune — Architecture Overview

Neptune is a geopolitical intelligence platform. Users create **workspaces** scoped to a topic, add data sources (URLs, keywords), and Neptune scrapes them, runs AI extraction, builds a knowledge graph, and lets analysts query it interactively.

---

## Stack

| Layer | Technology | Purpose |
| ----- | ---------- | ------- |
| Framework | Next.js 14 (App Router) | Full-stack React, API routes, SSR |
| Database & Auth | Supabase (Postgres + Auth) | User accounts, workspace/job/source storage |
| File Storage | Google Drive API or Supabase Storage | Stores generated `graph.json`, `context.json`, `feed.json`, `decisions.json` |
| AI | Groq API (`llama-3.3-70b-versatile`) | Entity extraction, feed generation, decision briefs, and in-app intelligence queries |
| Rendering | Canvas 2D (custom) | Force-directed 3D-perspective graph visualisation |
| Fonts | IBM Plex Mono + Bebas Neue | Body and display typography |
| Deployment | Vercel | Hosting |

---

## Directory Structure

```md

/
├── app/                        # Next.js App Router — pages and API routes
│   ├── layout.js               # Root layout (fonts, AuthProvider wrapper)
│   ├── globals.css             # Design token CSS variables + animations
│   ├── page.js                 # Public landing/marketing page (/)
│   ├── login/page.js           # Auth: sign in
│   ├── signup/page.js          # Auth: create account
│   ├── forgot-password/page.js # Auth: request reset email
│   ├── reset-password/page.js  # Auth: set new password from reset link
│   ├── privacy/page.js         # Static: privacy policy
│   ├── terms/page.js           # Static: terms of service
│   ├── dashboard/
│   │   ├── page.js             # Exports withAuth HOC + re-exports DashboardHome
│   │   ├── withAuth.js         # withAuth HOC definition (import from here)
│   │   ├── home.js             # Dashboard UI — workspace grid, polling, modals
│   │   └── new/page.js         # 5-step workspace creation wizard
│   ├── workspace/[id]/
│   │   └── page.js             # Per-workspace intelligence viewer
│   └── api/
│       ├── auth/google/
│       │   ├── callback/route.js   # Google OAuth callback — exchanges code for tokens
│       │   └── refresh/route.js    # Refreshes expired Google access token
│       ├── process/
│       │   ├── start/route.js      # Triggers the ingestion pipeline (fire-and-forget)
│       │   ├── status/route.js     # Returns job progress (polled every 3s)
│       │   └── sources/route.js    # Persists workspace sources to DB
│       ├── ai/
│       │   └── query/route.js      # AI query endpoint for NodePanel and DecisionWorkspace
│       └── workspace/[id]/
│           ├── route.js            # DELETE workspace (+ storage cleanup)
│           ├── graph/route.js      # GET graph.json from Drive or Supabase Storage
│           └── context/route.js    # GET context.json + feed.json + decisions.json
│
├── components/
│   ├── graph/
│   │   ├── GraphCanvas.js      # Canvas 2D force-directed 3D graph renderer
│   │   └── NodePanel.js        # Entity inspector + AI query panel (right sidebar)
│   ├── ui/
│   │   ├── AlertBadge.js       # Severity badge component (CRITICAL/HIGH/MEDIUM/LOW)
│   │   ├── FeedPanel.js        # Live intelligence feed (left sidebar)
│   │   ├── NeptuneBackground.js# Looping video background
│   │   └── Sidebar.js          # 56px icon nav sidebar
│   └── workspace/
│       └── DecisionWorkspace.js # Decision intelligence surface — evidence/scenarios/watchlist
│
├── context/
│   └── AuthContext.js          # Supabase auth state — useAuth() hook + AuthProvider
│
├── lib/
│   ├── supabase.js             # Lazy Supabase client singleton (Proxy pattern)
│   ├── groq.js                 # queryGroq() — Groq API wrapper for AI queries
│   └── graphUtils.js           # getConnectedNodes, getDomainColor, formatRelationship
│
└── public/
    ├── data/
    │   ├── nodes.json          # 165 demo entities for /preview
    │   ├── edges.json          # 819+ demo relationships for /preview
    │   ├── feed.json           # 30 demo feed items for /preview
    │   └── decisions.json      # 3 demo decision cases for /preview
    └── videos/
        └── neptune-bg.mp4      # Looping background video used on landing + auth pages
```

---

## Data Flow

### New Workspace → Graph

```md
User fills 5-step wizard (dashboard/new/page.js)
  │
  ├─ [Optional] Step 4: Connects Google Drive
  │    └── OAuth redirect → /api/auth/google/callback
  │          └── exchanges code → creates Drive folder → saves tokens to DB
  │
  ├─ Step 5 Submit:
  │    ├── POST /api/process/sources  → inserts rows into workspace_sources
  │    └── POST /api/process/start    → creates processing_job, returns job.id
  │          └── processWorkspace() fires in background:
  │                1. fetchSourceText()    — scrapes each URL, strips HTML
  │                2. extractWithGroq()    — Groq extracts entities + edges as JSON
  │                3. mergeEntities()      — deduplicates across sources (alias + fuzzy)
  │                4. buildGraph()         — assembles graph.json
  │                5. buildContext()       — assembles context.json
  │                6. generateFeed()       — Groq generates intelligence feed items
  │                7. generateDecisions()  — Groq generates decision briefs
  │                8. saveOutputs()        — writes all files to Drive or Supabase Storage
  │                9. Updates workspace node_count / edge_count
  │                10. Sets job status → 'done'
  │
Frontend polls GET /api/process/status?job_id=... every 3s
  └── When done → workspace card shows READY → user opens /workspace/[id]

/workspace/[id]/page.js
  ├── GET /api/workspace/[id]/graph
  │     ├── If Drive: refreshes token → searches folder for graph.json → downloads it
  │     └── If Supabase Storage: downloads workspace-outputs/{id}/graph.json
  └── GET /api/workspace/[id]/context
        ├── Loads context.json, feed.json, decisions.json from storage
        └── Returns workspace metadata + feed + decisions for UI
```

### In-Workspace AI Query

```md
User clicks node → NodePanel opens
User types query → handleQuery()
  └── POST /api/ai/query
        └── queryGroq(prompt, { nodeCount, edgeCount, sampleNodes, workspaceName, domains })
              └── POST https://api.groq.com/openai/v1/chat/completions
                    model: llama-3.3-70b-versatile
                    max_tokens: 400, temperature: 0.4

User opens DecisionWorkspace → types query → handleAiQuery()
  └── POST /api/ai/query
        └── queryGroq(prompt with decision context, graphContext)
              └── Returns strategic analysis of decision brief
```

---

## Database Schema (Supabase)

### `workspaces`

| Column | Type | Notes |
| ------ | ---- | ----- |
| `id` | uuid PK | auto-generated |
| `owner_id` | uuid | references `auth.users` |
| `name` | text | workspace display name |
| `description` | text | |
| `domains` | text[] | e.g. `['geopolitics','economics']` |
| `storage_backend` | text | `'drive'` or `'supabase'` |
| `google_access_token` | text | refreshed automatically |
| `google_refresh_token` | text | long-lived, used to refresh |
| `google_token_expiry` | timestamptz | |
| `google_folder_id` | text | Drive folder UUID |
| `google_folder_name` | text | |
| `drive_connected` | bool | |
| `node_count` | int | updated after pipeline |
| `edge_count` | int | updated after pipeline |
| `last_opened_at` | timestamptz | |
| `created_at` | timestamptz | |

### `workspace_sources`

| Column | Type | Notes |
| ------ | ---- | ----- |
| `id` | uuid PK | |
| `workspace_id` | uuid | FK → workspaces |
| `owner_id` | uuid | FK → auth.users |
| `type` | text | `'static'`, `'dynamic'`, or `'keyword'` |
| `url` | text | for static/dynamic sources |
| `keyword` | text | for keyword sources |
| `status` | text | `'pending'`, `'processed'`, `'failed'` |
| `last_fetched` | timestamptz | |

### `processing_jobs`

| Column | Type | Notes |
| ------ | ---- | ----- |
| `id` | uuid PK | |
| `workspace_id` | uuid | FK → workspaces |
| `owner_id` | uuid | FK → auth.users |
| `status` | text | `'running'`, `'done'`, `'error'` |
| `progress` | int | 0–100 |
| `current_step` | text | human-readable step name |
| `sources_total` | int | |
| `sources_done` | int | |
| `error_message` | text | populated on failure |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=          # Project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=     # Public anon key (safe for browser)
SUPABASE_SERVICE_ROLE_KEY=         # Service role key — server-only, bypasses RLS

# Groq
GROQ_API_KEY=                      # Server-side only — used by API routes
NEXT_PUBLIC_GROQ_API_KEY=          # ⚠ Deprecated — kept for backwards compatibility only

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000   # Used for internal server-to-server fetch calls
```

> **Security note:** The codebase now uses server-side `GROQ_API_KEY` with fallback to `NEXT_PUBLIC_GROQ_API_KEY` for backwards compatibility. All Groq calls go through API routes (`/api/ai/query` and `/api/process/start`). Remove `NEXT_PUBLIC_GROQ_API_KEY` from your environment once you've migrated to `GROQ_API_KEY`.

---

## Domain Colour Reference

| Domain | Code | Hex |
| ------ | ---- | --- |
| geopolitics | GEO | `#c94040` (red) |
| economics | ECO | `#c87c3a` (amber) |
| defense | DEF | `#b85a30` (dark red) |
| technology | TEC | `#3d7bd4` (blue) |
| climate | CLI | `#2a9e58` (green) |
| society | SOC | `#7050b8` (purple) |
| organization | ORG | `#b89a30` (gold) |
| person | PER | `#2a9e80` (teal) |

---

## CSS Design Tokens (`globals.css`)

All colours and typography are defined as CSS custom properties:

```css
--bg-base        /* #04060e — deepest background */
--bg-panel       /* #080d1f — sidebars and panels */
--bg-card        /* #0b1228 — card surfaces */
--bg-hover       /* #0f1835 — hover state */
--border         /* rgba(58,110,200,0.14) — default border */
--border-mid     /* rgba(100,160,240,0.22) — slightly brighter border */
--neptune-core   /* #2558b8 — primary brand blue */
--neptune-mid    /* #3d7bd4 — interactive blue */
--neptune-light  /* #7aaeee — lighter blue, links */
--neptune-pale   /* #c8e4ff — near-white blue, headings */
--text-primary   /* #ddeeff — main readable text */
--text-secondary /* #7a9fbe — subdued text */
--text-dim       /* #3a5878 — very subdued / labels */
--font-mono      /* IBM Plex Mono */
--font-display   /* Bebas Neue */
```

Key animations defined globally:

- `pulse-dot` — fading dot (used for loading indicators and live status)
- `fade-in-up` — slide-up reveal (used for panels and cards)
- `modal-rise` — modal entrance animation
