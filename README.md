# NEPTUNE — Global Intelligence Engine

> A geopolitical intelligence platform that ingests live data from across the web, builds a knowledge graph of entities and relationships, and lets analysts query, visualise, and reason over it using AI.

**Live preview:** https://neptune-ontology.vercel.app  
**Stack:** Next.js 14 · Supabase · Groq · Canvas 2D · Google Drive API

---

## Table of Contents

- [What Neptune Does](#what-neptune-does)
- [File-by-File Reference](#file-by-file-reference)
- [Data Flow](#data-flow)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [Current Status](#current-status)
- [Roadmap](#roadmap)
- [Technologies](#technologies)

---

## What Neptune Does

1. A user creates a **workspace** and defines its intelligence scope — topics, domains, and source URLs.
2. Neptune **scrapes and ingests** those sources, strips them to clean text, and sends the text through an AI pipeline.
3. The AI (**Groq / Llama-3 70B**) extracts named entities (people, organisations, countries, events) and the relationships between them.
4. Entities are **deduplicated and merged** across sources using alias resolution, then written as a `graph.json` + `context.json` to Google Drive or Supabase Storage.
5. The analyst opens the workspace and sees a **live, interactive knowledge graph** — nodes are entities, edges are relationships. They can click a node to see all its connections and ask the AI questions about it.
6. A **decision workspace** surface presents structured intelligence: evidence, scenarios, watchlists, and precedents for each tracked decision.

---

## File-by-File Reference

### Root Config

| File | Purpose |
|------|---------|
| `package.json` | Node dependencies: Next.js 14, Supabase JS client, Groq SDK, Tailwind CSS |
| `next.config.mjs` | Next.js configuration — currently minimal passthrough |
| `postcss.config.mjs` | PostCSS config for Tailwind |
| `jsconfig.json` | Path aliases (`@/` → project root) |
| `eslint.config.mjs` | ESLint rules for the project |
| `proxy.js` | Next.js middleware — currently a passthrough. Auth is handled client-side via `withAuth()` HOC to avoid redirect loops with Supabase's localStorage-based sessions |

### `app/` — Next.js App Router Pages

#### `app/layout.js`
Root layout wrapping the entire app. Loads two fonts (IBM Plex Mono for body text, Bebas Neue for display headings) and wraps every page in `<AuthProvider>` so session state is available everywhere via `useAuth()`.

#### `app/globals.css`
Global CSS variables and resets. Defines the Neptune design token system:
- `--bg-base`: deep navy background
- `--border`: subtle panel borders
- `--neptune-blue` / `--neptune-light`: primary brand colour ramp
- `--font-mono` / `--font-display`: font families

#### `app/page.js`
**Public preview workspace** — no login required. Shows a fully functional intelligence interface with hardcoded demo data (`/public/data/`). Serves as a live product demo and a reference implementation for what every real workspace should look like. Contains the layout logic for toggling between the graph view, feed panel, and decision workspace.

Stats shown: 165 entities, 819+ relationships, 30 feed items.

#### `app/login/page.js`
Login page. Email + password form using Supabase Auth. Animated star-canvas background. Handles the `?next=` redirect param so users land back where they were after authenticating. Links to signup and forgot-password.

#### `app/signup/page.js`
Signup page. Collects full name, email, and password. Creates a Supabase Auth user. Also handles the post-OAuth-redirect case (Google Drive token exchange deposits the user back here). Same animated star background as login.

#### `app/forgot-password/page.js`
Forgot password flow. Sends a Supabase password-reset email. Simple single-field form.

#### `app/reset-password/page.js`
Reset password form. Reads the recovery token from the URL (Supabase sends this in the reset email) and lets the user set a new password.

#### `app/dashboard/page.js`
Entry point for the authenticated dashboard. Wraps `<DashboardHome>` in `withAuth()` — a client-side HOC that checks for a Supabase session and redirects to `/login?next=/dashboard` if none is found. This is intentionally client-side (not middleware) to avoid loops with Supabase's localStorage session storage.

#### `app/dashboard/home.js`
**The main authenticated dashboard.** Shows:
- Personalised greeting based on time of day
- Grid of the user's workspaces (workspace cards)
- "New Workspace" button → navigates to `/dashboard/new`
- "All Workspaces" modal with search/filter
- Polling loop for in-progress processing jobs — checks `/api/process/status` every 3 seconds and updates card status in real time
- Link to the public preview page

Each workspace card shows: name, description, domain tags, entity/relationship counts, last-updated timestamp, and current job status (`pending` / `processing` / `complete` / `error`).

#### `app/dashboard/new/page.js`
**5-step workspace creation wizard.** This is the most complex frontend page.

Steps:
1. **BASICS** — workspace name, description, classification level
2. **DOMAINS** — select intelligence domains (GEO, ECO, DEF, TEC, CLI, SOC)
3. **SOURCES** — add URLs, RSS feeds, keywords, and document uploads
4. **STORAGE** — choose between Google Drive (OAuth flow) and Supabase Storage
5. **REVIEW** — confirm all settings and submit

Notable behaviours:
- Form state is persisted to `sessionStorage` so it survives the Google OAuth redirect round-trip
- On Drive selection, redirects to Google OAuth, completes the token exchange via `/api/auth/google/callback`, then redirects back to step 5
- On submit, calls `/api/process/sources` to persist sources, then `/api/process/start` to kick off the ingestion pipeline
- Polls `/api/process/status` with a live progress bar while processing runs

#### `app/privacy/page.js`
Static privacy policy page.

#### `app/terms/page.js`
Static terms of service page.

---

### `app/api/` — API Routes

#### `app/api/auth/google/callback/route.js`
Google OAuth callback handler. After the user authorises Drive access:
1. Exchanges the `code` param for access + refresh tokens
2. Creates a Neptune folder in the user's Google Drive
3. Saves the tokens and folder ID back to the `workspaces` table in Supabase
4. Redirects to `/dashboard/new?step=5&workspace_id=...`

#### `app/api/auth/google/refresh/route.js`
Refreshes an expired Google OAuth access token using the stored refresh token. Called automatically by the pipeline before any Drive write operation. Updates the new access token in the `workspaces` table.

#### `app/api/process/sources/route.js`
`POST` — persists the workspace's source list to the `workspace_sources` table in Supabase. Called at the end of the new-workspace wizard before the pipeline starts.

#### `app/api/process/start/route.js`
**The core ingestion pipeline** — the most complex file in the codebase (15KB). Flow:
1. Marks the job as `processing` in the DB
2. Fetches each source URL (with retry logic)
3. Strips HTML to clean text using regex + heuristics
4. Sends text chunks to Groq (`llama-3.3-70b-versatile`) with a structured prompt that returns JSON: `{ entities: [...], relationships: [...] }`
5. Merges entities across all sources — resolves aliases (e.g. "US" = "United States"), deduplicates by name similarity
6. Builds `graph.json` (nodes + edges) and `context.json` (summary metadata)
7. Saves output to Google Drive (if the user chose Drive) or Supabase Storage
8. Updates the workspace's `entity_count` and `relationship_count` in the DB
9. Marks the job `complete` (or `error` on failure)

#### `app/api/process/status/route.js`
`GET ?workspace_id=...` — returns the current job status (`pending` / `processing` / `complete` / `error`) and progress percentage from the `processing_jobs` table. Polled by the frontend every 3 seconds.

---

### `components/graph/`

#### `components/graph/GraphCanvas.js`
**The centrepiece visualisation.** A custom Canvas 2D renderer — no Three.js or external graph library. Key features:
- **Force-directed layout** — 120-tick physics pre-simulation before first render (nodes don't fly in from nowhere)
- **3D perspective projection** — simulates depth using a custom Z-axis transform, giving the flat canvas a spatial feel
- **Domain clustering** — nodes are pre-positioned by domain (GEO, ECO, DEF, TEC, CLI, SOC) using a `CLUSTER_POS` map, then physics settles them
- **Auto-rotation** — the graph slowly rotates on the Y axis; pauses on user interaction
- **Zoom / pan / inertia** — mouse wheel zoom, drag pan, with momentum
- **Domain filter buttons** — toggle visibility by domain; matching nodes pulse
- **MAJOR_NODES** — a hardcoded set of important node IDs that render larger to anchor the layout visually
- Accepts `nodes` and `edges` as props; fires `onNodeSelect(node)` on click

#### `components/graph/NodePanel.js`
Right-side panel that opens when a node is clicked. Two tabs:
- **CONNECTIONS** — lists all edges from the selected node, grouped by relationship type, with clickable links to jump to connected nodes
- **AI ANALYSIS** — sends the node + its graph neighbourhood to Groq and streams back an intelligence summary. Has a set of suggested query buttons. Loads full `nodes.json` + `edges.json` to build the context window.

---

### `components/ui/`

#### `components/ui/Sidebar.js`
56px-wide icon sidebar, always visible in the workspace view. Contains:
- Neptune logo / home button
- Nav icons: graph view, decisions view
- Domain colour indicator dots (one per active domain)
- "LIVE" blinking indicator

#### `components/ui/FeedPanel.js`
Left-side intelligence feed panel. Reads from `feed.json` (or a prop). Items reveal progressively with a staggered animation on load. Has a hardcoded pool of 6 alert types that cycle. Each item shows: headline, source, timestamp, severity badge, and a domain colour tag.

#### `components/ui/NeptuneBackground.js`
Full-screen video background component. Renders `public/videos/neptune-bg.mp4` looping with a dark overlay. Used on the preview page and auth pages.

#### `components/ui/AlertBadge.js`
**Currently empty — stub file.** Intended to render a coloured severity badge (`CRITICAL` / `HIGH` / `MEDIUM` / `LOW`) for use in the feed and decision panels. Not yet implemented.

---

### `components/workspace/`

#### `components/workspace/DecisionWorkspace.js`
The decision intelligence surface. A split layout: decision list on the left, detail view on the right. Four tabs per decision:
- **EVIDENCE** — source documents and data points supporting the decision
- **SCENARIOS** — possible outcomes with probability estimates
- **WATCHLIST** — entities and indicators to monitor
- **PRECEDENTS** — historical analogues
- **AI ANALYSIS** — Groq-powered structured analysis of the decision

Currently reads from `public/data/decisions.json`. Will need to be connected to per-workspace data.

---

### `context/`

#### `context/AuthContext.js`
React context providing `user`, `session`, and `loading` to the entire app. Sets up a Supabase `onAuthStateChange` listener so session state updates reactively. Exported as `useAuth()` hook and `AuthProvider` wrapper.

---

### `lib/`

#### `lib/supabase.js`
Creates and exports the Supabase client using `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Single instance shared across the app.

#### `lib/groq.js`
Thin wrapper around the Groq API. Exports `queryGroq(prompt, graphContext)` which calls `llama-3.3-70b-versatile` with `max_tokens: 400` and `temperature: 0.4`. The `graphContext` param is serialised and prepended to the prompt as structured background knowledge.

#### `lib/graphUtils.js`
Shared graph utility functions:
- `getConnectedNodes(nodeId, edges)` — returns all nodes directly connected to a given node
- `getDomainColor(domain)` — maps domain string to hex colour
- `formatRelationship(rel)` — formats a relationship object into a human-readable string

---

### `public/data/` — Demo Data

These are the static JSON files powering the public preview. They are **not** used in real workspaces — real workspaces load their graph from Drive or Supabase Storage.

| File | Contents |
|------|---------|
| `nodes.json` | 165 entities — people, orgs, countries, events — each with `id`, `label`, `domain`, `type`, `weight` |
| `edges.json` | 819+ directed relationships — each with `source`, `target`, `relation`, `weight` |
| `feed.json` | 30 intelligence feed items with headlines, sources, timestamps, severity levels |
| `decisions.json` | Structured decision intelligence objects with evidence, scenarios, watchlists, precedents |

---

### `generate_*.py` — Data Generation Scripts

Python scripts used to generate the demo data. **Not part of the production app.**

| File | Purpose |
|------|---------|
| `generate_data.py` | Generates `nodes.json` and `edges.json` with realistic geopolitical entities |
| `generate_decisions.py` | Generates `decisions.json` with structured decision intelligence |
| `generate_feed.py` | Generates `feed.json` with intelligence feed items |

---

## Data Flow

```
User defines sources (URLs, keywords, docs)
        │
        ▼
/api/process/sources  →  saves to workspace_sources table
        │
        ▼
/api/process/start
  ├── Fetch + scrape each source URL
  ├── Strip HTML → clean text
  ├── Groq (llama-3.3-70b): extract entities + relationships → JSON
  ├── Merge + deduplicate entities across sources (alias resolution)
  ├── Build graph.json + context.json
  └── Save to Google Drive or Supabase Storage
        │
        ▼
Frontend polls /api/process/status every 3s
        │
        ▼
Job complete → workspace card shows "READY"
        │
        ▼
User opens workspace → loads graph.json from storage
        │
        ▼
GraphCanvas renders force-directed 3D-perspective graph
NodePanel answers AI questions about selected nodes
```

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Groq
# ⚠️  Currently exposed as NEXT_PUBLIC_ — move to server-only before production
NEXT_PUBLIC_GROQ_API_KEY=

# Google OAuth (for Drive integration)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> **Security note:** `NEXT_PUBLIC_GROQ_API_KEY` is currently client-side exposed. Before any public deployment, move Groq calls exclusively to API routes and use a non-public env var.

---

## Getting Started

```bash
# Install dependencies
npm install

# Copy env template and fill in values
cp .env.example .env.local

# Run development server
npm run dev
```

Open http://localhost:3000 for the public preview (no login needed).  
Open http://localhost:3000/dashboard for the authenticated workspace grid.

### Supabase Tables Required

```sql
-- Workspaces
create table workspaces (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  name text,
  description text,
  domains text[],
  storage_type text,          -- 'drive' | 'supabase'
  drive_folder_id text,
  drive_access_token text,
  drive_refresh_token text,
  entity_count int default 0,
  relationship_count int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Sources per workspace
create table workspace_sources (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces,
  type text,                  -- 'url' | 'rss' | 'keyword' | 'document'
  value text,
  created_at timestamptz default now()
);

-- Processing jobs
create table processing_jobs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces,
  status text default 'pending',  -- 'pending' | 'processing' | 'complete' | 'error'
  progress int default 0,
  error_message text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

---

## Current Status

| Feature | Status |
|---------|--------|
| Public preview workspace | ✅ Complete |
| Login / Signup / Forgot password | ✅ Complete |
| Dashboard — workspace grid | ✅ Complete |
| Workspace creation wizard (5 steps) | ✅ Complete |
| Google Drive OAuth + folder creation | ✅ Complete |
| Source ingestion + Groq entity extraction | ✅ Complete |
| Entity deduplication + graph building | ✅ Complete |
| Graph save to Drive / Supabase Storage | ✅ Complete |
| Processing status polling | ✅ Complete |
| **Workspace viewer** (`/workspace/[id]`) | ✅ Complete |
| Per-workspace graph loaded from storage | 🔄️ In Progress |
| Per-workspace feed + decisions | ❌ Not built |
| AlertBadge component | ❌ Stub only |
| Collaborative features (invite / accept) | ❌ Not started |
| Alerts + cascading consequence detection | ❌ Not started |

---

## Roadmap

### Phase 1 — Workspace Viewer (Next)
Create `/app/workspace/[id]/page.js` — the per-workspace intelligence interface. It should:
- Load `graph.json` from the workspace's storage location (Drive or Supabase)
- Render `GraphCanvas` with the real graph data
- Render `FeedPanel` and `DecisionWorkspace` with workspace-specific data
- Look and feel identical to the public preview at `/`
- Gate behind `withAuth()` and verify the workspace belongs to the requesting user

New API routes needed:
- `GET /api/workspace/[id]/graph` — loads `graph.json` from Drive or Supabase Storage and returns it
- `GET /api/workspace/[id]/context` — loads `context.json`

### Phase 2 — Per-Workspace Feed + Decisions
Wire up the feed and decisions panels to real data generated during ingestion. The pipeline already produces the graph — extend it to also produce `feed.json` and `decisions.json` structured outputs using a second Groq pass.

### Phase 3 — Collaborative Features
- Workspace invite system: owner sends invite link → invitee accepts → added to `workspace_members` table
- Role-based access: OWNER / ANALYST / VIEWER
- Presence indicators on the graph (who else is viewing)
- Shared annotations on nodes

### Phase 4 — Alerts + Decision Intelligence
- Background job that re-processes sources on a schedule (cron via Supabase or Vercel cron)
- Change detection: compare new graph against previous snapshot → generate alerts for new entities/relationships
- `AlertBadge` component (currently a stub) wired up
- Cascading consequence detection: given a new event entity, traverse the graph N hops and identify affected entities + decisions

### Phase 5 — Production Hardening
- Move `NEXT_PUBLIC_GROQ_API_KEY` to server-only — all Groq calls go through API routes
- Add Supabase Row-Level Security policies on all tables
- Add rate limiting to API routes
- Replace Canvas 2D renderer with Three.js for WebGL-accelerated graph at 50K+ nodes
- Add proper error boundaries and loading skeletons throughout

---

## Technologies

### Current

| Technology | Usage |
|-----------|-------|
| **Next.js 14** (App Router) | Full-stack React framework — pages, API routes, layouts |
| **React 18** | UI component model, hooks, context |
| **Supabase** | Postgres database, Auth (email/password), Storage |
| **Groq API** | LLM inference — `llama-3.3-70b-versatile` for entity extraction and AI analysis |
| **Google Drive API** | OAuth 2.0 + Drive folder creation + file storage for workspace graphs |
| **Canvas 2D** | Custom force-directed graph renderer with 3D perspective projection |
| **Tailwind CSS** | Utility-first styling |
| **IBM Plex Mono** | Monospace font for the terminal/intelligence aesthetic |
| **Bebas Neue** | Display font for headings |
| **Vercel** | Deployment platform |

### Planned

| Technology | Planned Usage |
|-----------|--------------|
| **Three.js** | Replace Canvas 2D with WebGL-accelerated graph renderer for large graphs |
| **Supabase Realtime** | Live collaboration — broadcast node selections, presence |
| **Supabase Row-Level Security** | Enforce workspace ownership at the DB layer |
| **Vercel Cron** | Scheduled re-ingestion of sources for alert generation |
| **spaCy** (Python microservice) | Improved named entity recognition vs. pure LLM extraction |
| **WebSockets** | Real-time alert delivery to connected workspace viewers |
| **Redis** | Job queue for pipeline tasks (replacing synchronous API route execution) |

---

## Domain Colour Reference

| Domain | Code | Colour | Hex |
|--------|------|--------|-----|
| Geopolitical | GEO | Red | `#c94040` |
| Economic | ECO | Amber | `#c87c3a` |
| Defence | DEF | Dark Red | `#b85a30` |
| Technology | TEC | Blue | `#3d7bd4` |
| Climate | CLI | Green | `#2a9e58` |
| Social | SOC | Purple | `#7050b8` |

---

## License

See `LICENSE` for details.
