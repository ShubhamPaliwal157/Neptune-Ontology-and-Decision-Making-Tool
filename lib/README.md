# `lib/` — Shared Utilities

Three small modules shared across pages and API routes.

---

## `lib/supabase.js`

Exports a single Supabase client instance used throughout the client-side app.

### Why a Proxy?

Next.js imports modules at build time, before environment variables are resolved in some SSR contexts. A plain `createClient(...)` call at module level would throw during SSR if the env vars aren't available yet. The Proxy defers client creation to the first actual method call, by which point env vars are guaranteed to be present.

### Exports

#### `getSupabase(): SupabaseClient`

Creates the client on first call, returns the cached singleton on all subsequent calls. Throws `Error('Supabase env vars missing')` if `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` are not set.

#### `supabase` (default and named export)

A `Proxy` object that forwards any property access to `getSupabase()`. This means you can write `supabase.auth.signIn(...)` and the client is lazily created the first time that line executes.

```js
// Usage — works identically to a direct Supabase client
import { supabase } from '@/lib/supabase'
await supabase.auth.signInWithPassword({ email, password })
await supabase.from('workspaces').select('*').eq('owner_id', userId)
```

> **Note:** API routes that need to bypass Row-Level Security create their own `supabaseAdmin` client directly using `SUPABASE_SERVICE_ROLE_KEY`. They do **not** use this shared client.

---

## `lib/groq.js`

Thin wrapper around the Groq chat completions API. Used exclusively for in-app intelligence queries from `NodePanel` and `DecisionWorkspace`. The ingestion pipeline (`api/process/start`) calls the Groq API directly (not through this wrapper) because it needs different prompts, models, and token limits.

### `queryGroq(prompt: string, graphContext: object): Promise<string>`

Sends a query to `llama-3.3-70b-versatile` with a system prompt that frames Neptune as a geopolitical intelligence analyst with access to the current graph.

**Parameters:**

- `prompt` — The user's question. If coming from `NodePanel`, it is prefixed with entity context (name, domain, type, connection count).
- `graphContext` — An object with three fields:
  - `nodeCount: number` — total nodes in the graph
  - `edgeCount: number` — total edges in the graph
  - `sampleNodes: string[]` — first 30 node labels, used in the system prompt to orient the model

**Returns:** The model's response string (2–4 paragraphs with a closing actionable implication).

**Model settings:** `max_tokens: 400`, `temperature: 0.4`

**Auth:** Uses `process.env.NEXT_PUBLIC_GROQ_API_KEY`. ⚠ This is currently a browser-exposed env var — safe for prototyping but must be moved server-side before public launch.

```js
// Usage
import { queryGroq } from '@/lib/groq'
const response = await queryGroq(
  "What is India's strategic significance in semiconductor supply chains?",
  { nodeCount: 165, edgeCount: 819, sampleNodes: ['India', 'TSMC', 'USA', ...] }
)
```

---

## `lib/graphUtils.js`

Pure utility functions for working with graph data. No side effects, no API calls.

### `getConnectedNodes(nodeId: string, edges: Edge[], nodes: Node[]): Connection[]`

Returns all nodes directly connected to `nodeId`, with edge metadata and direction.

**Parameters:**

- `nodeId` — the `id` field of the node to query
- `edges` — full edges array. Each edge has `{ source, target, relationship, ... }`
- `nodes` — full nodes array. Each node has `{ id, label, domain, ... }`

**Returns:** Array of `{ node, edge, direction }` objects where:

- `node` — the connected Node object
- `edge` — the Edge object connecting them
- `direction` — `'out'` if `nodeId` is the source, `'in'` if it's the target

Used by `NodePanel` to populate the CONNECTIONS tab.

```js
const connections = getConnectedNodes('IND', edges, nodes)
// → [{ node: { id: 'USA', label: 'United States', ... }, edge: { relationship: 'allied_with', ... }, direction: 'out' }, ...]
```

### `getDomainColor(domain: string): string`

Maps a domain string to its hex colour. Returns `'#3d7bd4'` (blue) as a fallback for unknown domains.

| Input | Output |
|-------|--------|
| `'geopolitics'` | `#c94040` |
| `'economics'` | `#c87c3a` |
| `'defense'` | `#b85a30` |
| `'technology'` | `#3d7bd4` |
| `'climate'` | `#2a9e58` |
| `'society'` | `#7050b8` |
| `'organization'` | `#b89a30` |
| `'person'` | `#2a9e80` |

### `formatRelationship(rel: string): string`

Converts a relationship label from `SNAKE_CASE` to `human readable`. Returns `'related to'` if `rel` is null/undefined.

```js
formatRelationship('allied_with')   // → 'allied with'
formatRelationship('COMPETES_WITH') // → 'competes with'
formatRelationship(null)            // → 'related to'
```
