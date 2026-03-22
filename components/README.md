# `components/` — UI Components

---

## `components/graph/GraphCanvas.js`

The centrepiece visualisation. A custom Canvas 2D renderer — no Three.js or external graph library.

### Props Description

| Prop | Type | Description |
| ---- | ---- | ----------- |
| `selectedNode` | Node \| null | Currently selected node. Passed in from the parent page. Triggers glow/ring on the selected node and highlights its edges. |
| `setSelectedNode` | function | Called when user clicks a node. Pass `null` to deselect. |
| `graphData` | `{ nodes, edges }` \| null | If provided, uses this data. If null, fetches from `/data/nodes.json` and `/data/edges.json` (demo mode). |

### Physics simulation (pre-render, runs once on data load)

Before the first frame is drawn, 120 ticks of force-directed physics are computed synchronously:

1. **Repulsion** — every pair of nodes pushes apart (inverse-square law, capped at force=4)
2. **Attraction** — connected nodes are pulled together (spring force proportional to distance)
3. **Clustering** — each node is attracted toward its domain's anchor point (`CLUSTER_POS`)
4. **Damping** — velocities decay by 0.8× each tick

Result: nodes start in meaningful positions (clustered by domain, connected nodes nearby) rather than flying in from random locations.

### Render loop

Runs via `requestAnimationFrame`. Each frame:

1. **Rotation** — if dragging, applies mouse delta. If not dragging and inertia remains, applies velocity (decays by 0.93×). If neither, slowly auto-rotates Y axis (+0.0012 rad/frame).
2. **Edge reveal** — gradually reveals 4 more edges every 6 frames until all edges are visible (smooth initial load animation).
3. **Background** — radial vignette + two subtle nebula blobs + 220 blinking background stars.
4. **3D projection** — all node positions are rotated (X then Y axis) and perspective-projected using `fov=900`. Nodes are then sorted by depth (painter's algorithm).
5. **Edges** — drawn as lines. Active edges (connected to selected node) get a glow effect.
6. **Nodes** — drawn with: outer glow gradient, filled circle, border ring, inner highlight dot. Selected nodes pulse in size and show a dashed orbit ring. Nodes with `size * scale > threshold` show a label beneath.
7. **Orbit particles** — 3 small dots orbit the selected node.

### `project(x, y, z, rotX, rotY): { sx, sy, scale, depth }`

3D → 2D perspective projection. Applies X-axis tilt then Y-axis rotation, then projects to screen coordinates using a fixed field-of-view of 900. `scale` is used to size nodes by depth (farther = smaller).

### `getNodeSize(node): number`

Returns `node.size || 12` for nodes in the `MAJOR_NODES` set, `(node.size || 10) * 0.45` for all others. This prevents the graph from looking uniform — important nodes are visually dominant.

`MAJOR_NODES` is a hardcoded `Set` of IDs for major geopolitical and technological entities (USA, CHN, IND, NATO, TSMC, etc.). For workspaces with different content, this set is irrelevant (those nodes won't match) and all nodes will use the standard sizing formula.

### `getHit(mouseEvent): Node | null`

Hit detection. Projects each node to screen space and checks if the mouse is within `size * 2.5` pixels. Returns the closest match or `null`. Used by both `onMouseMove` (hover) and `onClick` (selection).

### Mouse interaction

- **Drag** — rotates the graph. Velocity is tracked for inertia on release.
- **Scroll wheel** — zooms (range: 0.3× to 2.8×). `e.preventDefault()` is called to stop page scroll.
- **Click** — selects a node via `getHit()`. If no node is hit, click is ignored (does not deselect).
- **Mouse leave** — clears hover state.

### UI overlays (rendered as React JSX, not on canvas)

- **Top bar** — entity/edge count, AUTO ROTATE toggle, RESET VIEW button
- **Domain filter buttons** (bottom centre) — filter to show only nodes of one domain. ALL button clears the filter.
- **Hover label** (top centre) — shows entity name while hovering

### `DOMAIN_COLORS` and `CLUSTER_POS`

Both are module-level constants. `CLUSTER_POS` defines 2D anchor points (in graph-space units) for each domain's cluster. Geopolitics is centred at (0,0); others are offset in different directions to create visible separation.

---

## `components/graph/NodePanel.js`

Right-side panel that opens when a graph node is selected. 300px wide, full-height.

### Props Used

| Prop | Type | Description |
| ---- | ---- | ----------- |
| `selectedNode` | Node \| null | The selected node, or null to show the empty state |
| `setSelectedNode` | function | Called with null when user clicks ×, or with a different node to jump to it from the connections list |
| `graphData` | `{ nodes, edges }` \| null | Same as GraphCanvas — used to load connections. Falls back to `/data/` files if null. |

### Empty state (no node selected)

Shows a faint `◈` icon, "SELECT AN ENTITY TO INSPECT" label, and a free-form AI query textarea. The AI query works even without a node selected — it queries the graph in general.

### Selected state

**Header:** Domain colour dot, domain + type label, entity name (in Bebas Neue), entity ID.

**CONNECTIONS tab:**
Calls `getConnectedNodes(selectedNode.id, edges, nodes)` to get all directly connected nodes. Renders each as a clickable row showing: domain colour dot, node label, relationship label with direction arrow (`→` out, `←` in), domain abbreviation. Clicking a row calls `setSelectedNode(node)` to jump to that entity.

**AI ANALYSIS tab:**

- Textarea for query input (Enter submits, Shift+Enter inserts newline)
- ANALYSE button calls `handleQuery()`
- Suggested queries shown before first query: "What is X's strategic significance?", "Key risks involving X?", "How does X connect to global supply chains?"

### `handleQuery()`

1. Sets `loading = true`, clears previous response, switches to AI tab.
2. Builds context: `{ nodeCount, edgeCount, sampleNodes: nodes.slice(0,30).map(n=>n.label) }`
3. If a node is selected, prepends entity context to the prompt: `Context: Analyzing entity "India" (geopolitics, country). It has 12 direct connections...`
4. Calls `queryGroq(prompt, ctx)`.
5. Sets `aiResponse` with result on success, or error message on failure.

---

## `components/ui/FeedPanel.js`

Left-side intelligence feed panel. 268px wide, full-height.

### The Props

None. Uses its own internal state and fetches from `/data/feed.json`.

### State

| State | Purpose |
| ----- | ------- |
| `items` | All feed items loaded from JSON |
| `visible` | Subset currently rendered (starts at 6, grows every 5s) |
| `alerts` | Active alert banners (added from `ALERT_POOL` on a stagger) |

### `ALERT_POOL` (module-level constant)

Array of 6 hardcoded alert objects: `{ id, sev, text, time }` where `sev` is one of CRITICAL/HIGH/MEDIUM/LOW. These stagger in at 3s, 25s, 47s, 69s, 91s, 113s after mount.

> Defined at module level (not `useState`) to avoid React StrictMode double-invocation issues. See the `alertsRegistered` ref guard.

### `alertsRegistered` ref guard

Prevents React StrictMode's deliberate double-mount from registering 12 timeouts instead of 6. The `useEffect` that schedules alert timeouts checks `alertsRegistered.current` and bails out if already registered.

### Feed reveal animation

Every 5 seconds, `visible` grows by 2 items (from `items.slice(0, count)`). The `feedRef` scroll position is reset to the top on each reveal so new items appear at the top. Items animate in with `fade-in-up`.

### Visual sections

1. **Header** — "INTEL FEED" label, visible/total count, blinking red dot
2. **Alert banners** — appear at top, left-bordered by severity colour, animate in
3. **Feed items** — each shows: type badge (coloured), domain, timestamp, headline text, confidence bar
4. **Footer** — green live pulse dot, "LIVE · UPDATING EVERY 5S"

### Severity colours

| Severity | Hex |
| -------- | --- |
| CRITICAL | `#c94040` |
| HIGH | `#c87c3a` |
| MEDIUM | `#b89a30` |
| LOW | `#2a9e58` |

---

## `components/ui/Sidebar.js`

Narrow 56px icon navigation bar. Always visible in the workspace views.

### The Props here

| Prop | Type | Description |
| ---- | ---- | ----------- |
| `activeView` | `'graph'` \| `'decisions'` | Currently active view |
| `setActiveView` | function | Called when a nav button is clicked |

### Contents (top to bottom)

1. **N orb** — Neptune logo, links to home
2. **Nav buttons** — `⬡ GRAPH` and `◈ DECISIONS`. Active button has left blue border accent.
3. **Divider line**
4. **Domain colour dots** — 6 small coloured dots, one per domain (GEO through SOC). Visual only — no interactivity. Act as a legend.
5. **LIVE indicator** — pulsing green dot + vertical "LIVE" text label

---

## `components/ui/NeptuneBackground.js`

Full-screen looping video background.

### Props here

None.

### Behaviour

Renders a `<video>` with `autoPlay loop muted playsInline` covering the full viewport (`position: fixed, inset: 0`). A dark gradient overlay sits on top so content is always readable. The gradient is not uniform — lighter in the middle, darker at edges and bottom.

**Video source:** `/videos/neptune-bg.mp4` — must exist in the `public/videos/` directory.

Used on: `/` (landing page, opacity 0.55), `/preview` (workspace demo), `/workspace/[id]`.

The auth pages (login, signup, etc.) use a canvas-based animated star field instead of this component to keep the file size lower for initial auth loads.

---

## `components/ui/AlertBadge.js`

**Status: Empty stub — not yet implemented.**

Intended to render a coloured severity badge (CRITICAL / HIGH / MEDIUM / LOW). Currently an empty file. The severity badge styling is implemented inline in `FeedPanel.js` and `DecisionWorkspace.js` in the meantime.

**Planned API:**

```jsx
<AlertBadge severity="CRITICAL" />  // → red badge
<AlertBadge severity="HIGH" />      // → amber badge
```

---

## `components/workspace/DecisionWorkspace.js`

Decision intelligence surface. Replaces the graph view when the user switches to the DECISIONS view in the sidebar.

### Props

| Prop | Type | Description |
| ---- | ---- | ----------- |
| `activeDecision` | number | Index of the currently selected decision |
| `setActiveDecision` | function | Called when user clicks a decision in the sidebar list |

### Layout

Split horizontally: 260px decision list on the left, flexible detail panel on the right.

### Data

Currently loads from `/data/decisions.json` on mount. Each decision object has:

```json
{
  "id": "DEC-2024-0847",
  "title": "...",
  "summary": "...",
  "domain": "technology",
  "priority": "CRITICAL|HIGH|MEDIUM|LOW",
  "status": "ACTIVE",
  "deadline": "...",
  "owner": "...",
  "alerts": [{ "severity", "text", "time" }],
  "evidence": [{ "id", "type", "claim", "confidence", "impact", "supports", "sources", "timestamp" }],
  "scenarios": [{ "id", "title", "subtitle", "color", "outcomes", "riskLevel", "risk" }],
  "watchlist": [{ "label", "current", "threshold" }],
  "past_decisions": [{ "title", "date", "outcome", "color", "detail" }]
}
```

### Decision list sidebar

Each decision card shows: priority badge (coloured), decision ID, title, domain tag, deadline. Active decision has a left coloured border and slight background tint.

### Detail panel — header

Shows: priority, ID, owner, title, summary, deadline (in red), status badge. If `alerts` array is non-empty, renders alert banners below the header.

### Tabs

**EVIDENCE**
List of evidence cards. Each card shows: type badge (FACT/INTELLIGENCE/RISK/FORECAST/SIGNAL), confidence %, impact level, `supports` directive (JOIN/RESPOND/ACCELERATE/CAUTION/WAIT/NEUTRAL), the claim text, and source citations with verified/unverified indicators.

**SCENARIOS**
Three scenario buttons (e.g. BASE CASE / OPTIMISTIC / PESSIMISTIC). Selecting one shows:

- Outcomes grid (2×N grid of outcome metrics with values)
- Risk level card with description

**WATCHLIST**
List of indicators to monitor. Each shows: label, current value, escalation threshold.

**PRECEDENTS**
Historical analogues. Each shows: outcome badge (coloured), date, title, detail paragraph.

**AI ANALYSIS**
Same pattern as `NodePanel`'s AI tab. Textarea + ANALYSE button + 4 suggested queries. Calls `queryGroq()` with decision context as prefix.

### `handleAiQuery()`

Calls `queryGroq(prompt, ctx)` where `ctx` is hardcoded to the demo graph stats (`nodeCount: 165, edgeCount: 819`). The prompt prepends the decision title and summary. This needs to be updated to use real workspace graph stats when per-workspace decisions are implemented.
