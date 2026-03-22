# `app/api/` — API Routes

All routes are Next.js App Router Route Handlers. Server-side only.

Routes that modify data use `supabaseAdmin` (service role key, bypasses RLS) with strict `owner_id` checks to enforce ownership manually.

---

## Auth Routes

### `POST /api/auth/google/callback`

**File:** `app/api/auth/google/callback/route.js`

Google OAuth 2.0 callback handler. Called by Google after the user authorises Drive access during the workspace creation wizard.

**Flow:**

1. Reads `code` and `state` from query params. `state` is `workspaceId:userId` (colon-separated), set when the OAuth redirect was initiated in `dashboard/new/page.js`.
2. Exchanges `code` for `access_token` + `refresh_token` via `https://oauth2.googleapis.com/token`.
3. Creates a Drive folder named `Neptune — {workspaceId}` using the new access token.
4. Saves tokens + folder ID to the `workspaces` row in Supabase (matched by both `id` AND `owner_id`).
5. Redirects to `/dashboard/new?drive_connected=1&workspace_id={id}` on success, or `/dashboard/new?drive_error={message}` on failure.

**Error handling:** Any failure at any step redirects back to the wizard with a `drive_error` param so the frontend can show a message without a broken blank page.

**Security:** Uses `SUPABASE_SERVICE_ROLE_KEY` but filters on `owner_id` to prevent one user's callback from writing to another's workspace row.

---

### `POST /api/auth/google/refresh`

**File:** `app/api/auth/google/refresh/route.js`

Refreshes an expired Google OAuth access token. Called by the pipeline (`start/route.js`) and the graph loader (`workspace/[id]/graph/route.js`) before any Drive API operation.

**Request body:** `{ workspace_id: string, user_id: string }`

**Logic:**

1. Loads the workspace's token fields from Supabase.
2. If `google_token_expiry` is more than 5 minutes in the future, returns the current `access_token` immediately (no refresh needed).
3. Otherwise, calls `https://oauth2.googleapis.com/token` with the `refresh_token`.
4. Saves the new `access_token` and updated expiry to Supabase.
5. Returns `{ access_token }`.

**Error responses:**

- `404` — workspace not found or wrong `user_id`
- `401` — no refresh token stored (user must reconnect Drive)
- `401` — Google refresh call failed (token may have been revoked)

---

## Process Routes

### `POST /api/process/sources`

**File:** `app/api/process/sources/route.js`

Persists a workspace's source list to the `workspace_sources` table. Called once at the end of the workspace creation wizard, just before `start` is called.

**Request body:**

```json
{
  "workspace_id": "uuid",
  "user_id": "uuid",
  "staticSources": ["https://..."],
  "dynamicSources": ["https://rss-feed..."],
  "keywords": ["semiconductor supply chain"]
}
```

- `staticSources` — URLs that are scraped once
- `dynamicSources` — URLs treated as RSS/live feeds (scraped the same way for now, distinguished for future scheduled re-ingestion)
- `keywords` — free-text topics; the pipeline generates a placeholder text for these instead of scraping

Inserts one row per source with `type` set to `'static'`, `'dynamic'`, or `'keyword'`.

**Response:** `{ saved: number }` — count of rows inserted.

---

### `POST /api/process/start`

**File:** `app/api/process/start/route.js`

Triggers the full ingestion pipeline for a workspace. The heaviest route in the codebase.

**Request body:** `{ workspace_id: string, user_id: string }`

**Immediate response:** Returns `{ job_id }` within milliseconds. The pipeline runs in the background; the client polls `/api/process/status` to track progress.

**Pipeline steps (inside `processWorkspace()`):**

| Progress | Step | Function |
| -------- | ---- | -------- |
| 0% | Job created | — |
| 10–60% | Source fetching + extraction | `fetchSourceText()` + `extractWithGroq()` per source |
| 65% | Entity deduplication | `mergeEntities()` |
| 80% | Graph assembly | `buildGraph()` |
| 88% | Context assembly | `buildContext()` |
| 93% | Save to storage | `saveOutputs()` → `saveToDrive()` or `saveToSupabaseStorage()` |
| 100% | Done | `updateJob({ status: 'done' })` |

**Internal functions:**

#### `processWorkspace({ workspace, sources, job, user_id })`

Orchestrates the full pipeline. Calls `updateJob()` at each step to update progress in the DB. Wraps everything in try/catch — on failure sets job status to `'error'` with the error message.

#### `updateJob(fields)`

Helper that calls `supabaseAdmin.from('processing_jobs').update(fields).eq('id', job.id)`. Also sets `updated_at` automatically.

#### `fetchSourceText(source): Promise<string | null>`

Fetches a URL with a 15-second timeout and a `NeptuneBot/1.0` user-agent. Strips `<script>`, `<style>`, and all HTML tags from the response. Truncates to 12,000 characters (~3k tokens). Returns `null` on failure (HTTP error or timeout).

For `keyword` type sources, returns a placeholder string `"Topic: {keyword}\nThis is a key entity..."` instead of fetching.

#### `extractWithGroq(text, source, domains): Promise<{ entities, edges }>`

Sends cleaned text to Groq with a structured extraction prompt. The prompt asks for JSON with `entities[]` and `edges[]` arrays. Strips markdown fences from the response before parsing. Each entity gets a `sourcesFound` field set to the source's URL/keyword.

Entity schema from Groq:

```json
{
  "name": "string",
  "type": "person|organisation|country|concept|event|location",
  "aliases": ["string"],
  "domain": "geopolitics|economics|defense|technology|climate|society",
  "description": "string",
  "importance": 1-10
}
```

Edge schema from Groq:

```json
{
  "source": "Entity Name",
  "target": "Entity Name",
  "relationship": "short label",
  "direction": "unidirectional|bidirectional",
  "weight": 1-10,
  "context": "string"
}
```

#### `mergeEntities(allEntities, allEdges): { nodes, edgeMap }`

Deduplicates entities across all sources using three strategies in order:

1. **Exact canonical match** — lowercased, trimmed name already in the map
2. **Alias match** — any of the entity's `aliases` matches an existing node's canonical name
3. **Token similarity fuzzy match** — Jaccard similarity of token sets ≥ 0.55 threshold. Tokens are split on whitespace/punctuation, stop words removed, and a `SYNONYM_MAP` normalises common abbreviations (`'usa' → 'united states'`, `'uk' → 'united kingdom'`, etc.)

When a match is found, aliases and `sourcesFound` arrays are merged. When edges reference entity names that resolved to different canonical names during merge, the edge endpoints are updated to use canonical IDs.

#### `buildGraph(nodes, edgeMap): GraphJSON`

Assembles the final `graph.json` object:

```json
{
  "generated_at": "ISO timestamp",
  "nodes": [{ "id", "name", "type", "domain", "description", "importance", "aliases" }],
  "edges": [{ "source", "target", "relationship", "direction", "weight", "context" }]
}
```

#### `buildContext(nodes, sources): ContextJSON`

Assembles `context.json` — a human-readable summary of what was processed:

```json
{
  "generated_at": "ISO timestamp",
  "sources": [{ "type", "url", "keyword", "status", "fetched" }],
  "entities": [{ "id", "name", "aliases", "description", "sources_found", "importance" }]
}
```

#### `saveOutputs({ workspace, graph, context, user_id })`

Branches on `workspace.storage_backend`:

- `'drive'`: calls `saveToDrive()`
- anything else: calls `saveToSupabaseStorage()`

#### `saveToDrive({ workspace, graphJson, contextJson, user_id })`

1. Calls `/api/auth/google/refresh` to ensure token is fresh.
2. Uploads `graph.json` and `context.json` to the workspace's Google Drive folder using the multipart upload API (`/upload/drive/v3/files?uploadType=multipart`).

#### `saveToSupabaseStorage({ workspace, graphJson, contextJson })`

Uploads both files to the `workspace-outputs` Supabase Storage bucket at `{workspace_id}/graph.json` and `{workspace_id}/context.json` with `upsert: true`.

---

### `GET /api/process/status`

**File:** `app/api/process/status/route.js`

Returns the current state of a processing job. Polled by the frontend every 3 seconds.

**Query params:** Either `job_id=uuid` or `workspace_id=uuid`, plus `user_id=uuid` (required for ownership check).

**Response:**

```json
{
  "status": "running|done|error",
  "progress": 0-100,
  "current_step": "Resolving entity aliases...",
  "sources_total": 5,
  "sources_done": 3,
  "error_message": null,
  "updated_at": "ISO timestamp"
}
```

When `workspace_id` is used (no `job_id`), returns the most recent job for that workspace.

---

## Workspace Routes

### `GET /api/workspace/[id]/graph`

**File:** `app/api/workspace/[id]/graph/route.js`

Loads `graph.json` for a workspace from wherever it was saved.

**URL param:** `id` — workspace UUID

**Logic:**

1. Loads the workspace row to determine `storage_backend` and `google_folder_id`.
2. If `storage_backend === 'drive'`: attempts to refresh the token, then searches the Drive folder for a file named `graph.json`, then downloads it.
3. Otherwise: downloads from Supabase Storage at `workspace-outputs/{id}/graph.json`.
4. Returns the parsed JSON directly (the graph object).

**Error responses:**

- `404` — workspace not found
- `404` — graph file not found (workspace may still be processing)
- `500` — unexpected error

> **Note:** This route does not verify the requesting user owns the workspace — it relies on the `withAuth` HOC on the page to ensure only authenticated users can reach it. If you add workspace sharing, add ownership verification here.

#### `loadFromDrive(workspace): Promise<object | null>`

Searches the workspace's Drive folder for `graph.json` using the Drive Files API, then downloads its content. Returns `null` if not found. Silently falls back to the stored access token if the refresh call fails.

#### `loadFromSupabaseStorage(workspaceId): Promise<object | null>`

Downloads and parses `graph.json` from Supabase Storage. Returns `null` if the file doesn't exist.

---

### `DELETE /api/workspace/[id]`

**File:** `app/api/workspace/[id]/route.js`

Deletes a workspace and all its associated data.

**URL param:** `id` — workspace UUID
**Request body:** `{ user_id: string }`

**Deletion order:**

1. Verifies ownership (`id` AND `owner_id` must match).
2. If `storage_backend !== 'drive'`: lists and removes all files from `workspace-outputs/{id}/` in Supabase Storage.
3. Deletes all rows from `workspace_sources` where `workspace_id = id`.
4. Deletes all rows from `processing_jobs` where `workspace_id = id`.
5. Deletes the workspace row itself.

> Drive files are **not** deleted — the user owns their Drive and controls that themselves.

**Response:** `{ success: true }` or `{ error: string }` with appropriate status code.
