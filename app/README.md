# `app/` — Pages

---

## Root Files

### `app/layout.js`

Root layout for the entire app. Every page is wrapped in this.

- Loads **IBM Plex Mono** (body font) and **Bebas Neue** (display font) from Google Fonts as CSS variables `--font-mono` and `--font-display`.
- Wraps all children in `<AuthProvider>` so `useAuth()` is available everywhere.
- Sets page `<title>` and meta description.
- `suppressHydrationWarning` on `<body>` prevents React hydration mismatches from browser extensions.

### `app/globals.css`

Global CSS reset and design token definitions. See `ARCHITECTURE.md` for the full token reference.

Key non-token rules:

- `html, body { overflow: hidden }` — prevents scrollbars on the workspace view (pages that scroll use their own scroll containers)
- Custom 2px scrollbar styling
- `pulse-dot`, `fade-in-up`, `modal-rise` keyframe animations used throughout the app

---

## Public Pages (no auth required)

### `app/page.js` — Landing Page (`/`)

Marketing page. The video background is visible here at ~55% opacity with a heavy gradient overlay.

**Sections:**

1. **Nav** — sticky, becomes opaque on scroll. Links: Demo, Sign In, Get Access.
2. **Hero** — NEPTUNE wordmark, tagline, two CTAs (Create Workspace → `/signup`, Sign In → `/login`), demo link → `/preview`.
3. **Stats strip** — 4 stats: 165+ entity types, 819+ relationships, 6 domains, <60s to first graph.
4. **Features grid** — 4 cards: Knowledge Graphs, Decision Intelligence, AI Analysis, Live Ingestion.
5. **CTA banner** — second call to action.
6. **Footer** — logo, nav links (Demo, Sign In, Sign Up, Privacy, Terms), version string.

**State:** `scrolled` boolean — tracks whether page has scrolled past 40px to trigger nav background.

---

### `app/preview/page.js` — Demo Workspace (`/preview`)

The full workspace UI (graph + feed + decisions) loaded with static demo data from `public/data/`. No authentication required — this is the public product demo.

**Layout:** Identical to `/workspace/[id]` but loads data from `/data/nodes.json` and `/data/edges.json` instead of the API.

**Components used:** `NeptuneBackground`, `Sidebar`, `FeedPanel`, `GraphCanvas`, `NodePanel`, `DecisionWorkspace`

**State:**

- `dismissed` — controls the intro modal (shown on first load)
- `activeView` — `'graph'` or `'decisions'`
- `selectedNode` — the currently clicked graph node, passed to `NodePanel`
- `activeDecision` — index into the decisions array, passed to `DecisionWorkspace`

---

## Auth Pages

All auth pages share the same visual treatment: animated star-canvas background (pure canvas, not the video), centred card with a top blue border accent, NEPTUNE wordmark, Terms/Privacy footer links.

### `app/login/page.js` — Sign In (`/login`)

**Key component:** `LoginForm` (wrapped in `<Suspense>` because it uses `useSearchParams`)

**Flow:**

1. User submits email + password.
2. Calls `supabase.auth.signInWithPassword()`.
3. On success: `window.location.href = next` where `next` defaults to `/dashboard` but respects the `?next=` query param (set by `withAuth` when redirecting unauthenticated users).
4. Uses `window.location.href` (hard redirect) rather than `router.push()` so the browser picks up the new session cookie properly.

**Features:** Show/hide password toggle, "Forgot Password?" link, "View Preview Workspace" link → `/preview`.

---

### `app/signup/page.js` — Create Account (`/signup`)

**Flow:**

1. Validates passwords match and are ≥ 8 characters client-side.
2. Calls `supabase.auth.signUp()` with `options.data.full_name`.
3. On success: shows confirmation screen ("Check your inbox").

**Features:** Password strength meter (4 levels: Too Short / Weak / Moderate / Strong based on length + character variety), real-time confirm-password border colour feedback (red = mismatch, green = match).

---

### `app/forgot-password/page.js` — Forgot Password (`/forgot-password`)

Calls `supabase.auth.resetPasswordForEmail()` with `redirectTo` pointing to `/reset-password`. On success, shows a confirmation message. Supabase emails a link that contains a recovery token.

---

### `app/reset-password/page.js` — Reset Password (`/reset-password`)

The user arrives here via the email link (Supabase embeds the session recovery token in the URL; the Supabase client reads it automatically on load).

Calls `supabase.auth.updateUser({ password })`. On success, waits 2.5 seconds and redirects to `/login`.

---

## Dashboard Pages

### `app/dashboard/page.js`

Dual-purpose file:

1. Exports the `withAuth(Component)` HOC — any protected page imports this.
2. Re-exports `DashboardHome` as the default export so the `/dashboard` route renders the dashboard.

> **Important:** `withAuth` is defined in `app/dashboard/withAuth.js`. This file simply re-exports both things for backwards compatibility. Always import `withAuth` from `@/app/dashboard/withAuth`.

---

### `app/dashboard/withAuth.js`

Higher-order component that protects routes from unauthenticated access.

#### `withAuth(Component): WrappedComponent`

Wraps `Component` with auth checking:

1. Reads `{ user, loading }` from `useAuth()`.
2. While `loading`, renders a fullscreen Neptune loading screen.
3. When `loading === false` and `user === null`: calls `window.location.replace('/login?next=' + pathname)`. The `?next=` param is read by `LoginForm` to redirect back after sign-in.
4. When authenticated: renders `<Component {...props} />` normally.

Uses `window.location.replace` (not `router.push`) to avoid the replaced page appearing in browser history — the user shouldn't be able to press Back and return to a protected page while unauthenticated.

**Usage:**

```js
import { withAuth } from '@/app/dashboard/withAuth'
export default withAuth(MyProtectedPage)
```

Applied to: `DashboardHome`, `NewWorkspacePage`, `WorkspacePage`

---

### `app/dashboard/home.js` — Dashboard (`/dashboard`)

Main authenticated view. Shows all of a user's workspaces and a progress indicator for any processing jobs.

#### State

| State | Type | Purpose |
| ----- | ---- | ------- |
| `workspaces` | Workspace[] | Fetched from Supabase on mount |
| `jobs` | object | Map of `workspace_id → job` for in-progress processing |
| `loading` | bool | Initial load state |
| `showAll` | bool | Controls "All Workspaces" modal visibility |
| `search` | string | Search filter in the modal |
| `deleteTarget` | Workspace \| null | Controls delete confirmation modal |

#### `fetchWorkspaces()`

Queries `workspaces` table filtered by `owner_id = user.id`, ordered by `created_at DESC`. Also queries `processing_jobs` for `status = 'running'` jobs associated with those workspaces. Merges job data into workspace objects.

#### Polling loop (`useEffect` with `setInterval`)

Runs every 3 seconds while any workspace has a `status === 'running'` job. Calls `GET /api/process/status?job_id=...&user_id=...` for each running job. Updates the local `jobs` state with fresh progress. Stops polling when all jobs are complete or errored.

#### `handleDelete(workspace)`

1. Calls `DELETE /api/workspace/{id}` with `{ user_id }`.
2. On success: removes the workspace from local state without a full refetch.

#### Components rendered inside

- `WorkspaceCard` — individual workspace card (defined inline in this file)
- `AllWorkspacesModal` — full-screen modal with search (defined inline, receives `onDelete` prop)
- Delete confirmation modal (inline)

#### `WorkspaceCard({ workspace, onDelete, size })`

Renders one workspace. Shows: name, description, domain tags, entity/edge counts, last-updated timestamp, and a coloured status badge (`READY` / `PROCESSING` with live progress % / `ERROR`). Clicking navigates to `/workspace/{id}`. The delete button calls `onDelete(workspace)`.

---

### `app/dashboard/new/page.js` — New Workspace Wizard (`/dashboard/new`)

5-step workspace creation flow. Each step is a separate component rendered by the main `NewWorkspacePage`.

#### Steps

**Step 0 — BASICS (`StepBasics`)**

- Workspace name (required, 60 char limit)
- Description (optional, 200 char limit)
- Classification level selector: UNCLASSIFIED / SENSITIVE / CONFIDENTIAL (visual only, no access control)
- Collaborative toggle: Personal or Team workspace

**Step 1 — DOMAINS (`StepDomains`)**

- Multi-select of 6 intelligence domains: Geopolitics, Economics, Defense, Technology, Climate, Society
- At least one must be selected to proceed
- Domains are stored as a `text[]` in the workspace row and used by the pipeline to focus entity extraction

**Step 2 — SOURCES (`StepSources`)**

- **Static sources** — URLs for one-time scraping (paste or type, add with Enter)
- **Dynamic sources** — RSS/live feed URLs (same UI, different type stored)
- **Keywords** — free-text topics (pipeline generates placeholder text for these)
- Can add up to 20 sources total

**Step 3 — STORAGE (`StepStorage`)**

- Choice between Google Drive and Supabase Storage
- Selecting Google Drive triggers OAuth redirect: `window.location.href = https://accounts.google.com/o/oauth2/v2/auth?...`
  - OAuth params: `scope=https://www.googleapis.com/auth/drive.file`, `access_type=offline`, `prompt=consent`, `state={workspaceId}:{userId}`
  - On return from OAuth, the callback route sets `?drive_connected=1` and the page re-reads `searchParams` to advance to step 4

**Step 4 — REVIEW (`StepReview`)**

- Read-only summary of all selections
- LAUNCH WORKSPACE button:
  1. Updates workspace `status` to `'processing'` in Supabase
  2. `POST /api/process/sources` — saves all sources
  3. `POST /api/process/start` — triggers pipeline, gets back `job_id`
  4. Starts polling `/api/process/status?job_id=...` every 2 seconds
  5. Shows live progress bar
  6. On `status === 'done'`: redirects to `/workspace/{workspace_id}`

#### Session storage persistence

Form state is saved to `sessionStorage` as `neptune_workspace_draft` after each step. This survives the Google OAuth round-trip (which causes a full page navigation). On mount, the wizard reads `sessionStorage` to restore state, and also reads `searchParams` to detect `drive_connected=1` or `drive_error=...`.

---

## Workspace Page

### `app/workspace/[id]/page.js` — Workspace Viewer (`/workspace/[id]`)

The full intelligence interface for a real user-created workspace. Visually identical to `/preview` but loads live data.

**Route param:** `id` — workspace UUID, extracted with `const { id } = use(params)`

**Protected by:** `withAuth` HOC

#### Data loading (`useEffect` on `id`)

Calls `GET /api/workspace/{id}/graph`. On success, normalises the node data (maps `name` → `label` for backward compatibility with `GraphCanvas`). Sets `graphData` and `loadState`.

#### Load states

- `'loading'` — renders fullscreen Neptune loading animation with pulsing dots
- `'error'` — renders error screen with the error message and a "Back to Dashboard" link
- `'ready'` — renders the full workspace UI

#### Layout

Identical to `/preview`: `NeptuneBackground` + `Sidebar` + (`FeedPanel` + `GraphCanvas` + `NodePanel`) or `DecisionWorkspace` depending on `activeView`.

> **Known limitation:** `FeedPanel` and `DecisionWorkspace` still load from static `/data/` files. Per-workspace feed and decisions generation is planned for Phase 2.

---

## Static Pages

### `app/privacy/page.js` — Privacy Policy (`/privacy`)

### `app/terms/page.js` — Terms of Service (`/terms`)

Both are server-rendered (no `'use client'`) static content pages with:

- Sticky nav with Neptune logo linking back to `/`
- Breadcrumb trail: NEPTUNE / Privacy Policy (or Terms)
- Full policy text in Neptune's design language
- Cross-links to each other at the bottom

Last updated date is set via the `LAST_UPDATED` constant at the top of each file. Update this when policy content changes.

Contact emails: `privacy@neptune-ontology.app` and `legal@neptune-ontology.app`.
