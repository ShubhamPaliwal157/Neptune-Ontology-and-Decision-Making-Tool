# `public/data/` — Demo Data

Static JSON files used by the `/preview` page and `DecisionWorkspace`/`NodePanel`/`FeedPanel` components in their fallback (no `graphData` prop) mode.

**These files are NOT used in real user workspaces.** Real workspaces load their graph from Google Drive or Supabase Storage via `/api/workspace/[id]/graph`.

---

## `nodes.json`

Array of 165 entity objects.

### Schema Nodes

```json
{
  "id":     "IND",
  "label":  "India",
  "type":   "nation",
  "domain": "geopolitics",
  "size":   22,
  "color":  "#E63946",
  "attributes": {
    "gdp_usd":             28750956130731.2,
    "population":          340110988,
    "military_spend_usd":  997309000000
  },
  "x": -14.4,
  "y": -17.3,
  "z": -36.0
}
```

### Fields Nodes

| Field | Notes |
| ----- | ----- |
| `id` | Short uppercase identifier. Used as edge `source`/`target` references. |
| `label` | Display name shown in the graph and NodePanel. |
| `type` | Semantic type: `nation`, `organisation`, `person`, `concept`, `event`, `location`, `technology` |
| `domain` | One of the 8 domains. Controls cluster position and colour in GraphCanvas. |
| `size` | Base node radius in graph units (before scale factor). Major geopolitical nodes are typically 20–24, minor ones 6–12. |
| `color` | Hex colour (appears to be preset but is overridden by `DOMAIN_COLORS` in GraphCanvas). |
| `attributes` | Optional object with domain-specific numeric data. Not rendered by default but available for custom extensions. |
| `x`, `y`, `z` | Pre-computed initial positions from the Python generation script. The physics simulation re-runs on load so these are only starting hints. |

> **Note for pipeline-generated nodes:** The pipeline saves nodes with a `name` field instead of `label`. `workspace/[id]/page.js` remaps `name → label` when loading. New code should always use `label` to avoid confusion.

---

## `edges.json`

Array of 819+ relationship objects.

### Schema Edges

```json
{
  "source":     "ARG",
  "target":     "PRY",
  "label":      "CONSULTATION",
  "strength":   0.64,
  "mentions":   10,
  "source_url": "...",
  "domain":     "geopolitics",
  "color":      "#2DC653"
}
```

### Fields Edges

| Field | Notes |
| ----- | ----- |
| `source` | Node `id` of the source entity. Must match a `nodes.json` id. |
| `target` | Node `id` of the target entity. Must match a `nodes.json` id. |
| `label` | Relationship type (uppercase). Used as the display label in NodePanel. |
| `strength` | 0–1 float. Not currently used for rendering but available for filtering. |
| `mentions` | How many times this relationship appeared in source data. |
| `source_url` | Origin URL (appears to contain lat/long values in demo data — generation artifact). |
| `domain` | Domain of the relationship. Used for edge colour assignment. |
| `color` | Hex colour for the edge. If missing, GraphCanvas falls back to `#3d7bd4`. |

> **Note for pipeline-generated edges:** The pipeline produces edges with fields `relationship`, `direction`, `weight`, `context`. GraphCanvas uses `e.color` for edge colour and will fall back gracefully if it's absent.

---

## `feed.json`

Array of 30 intelligence feed items displayed in `FeedPanel`.

### Schema Feed

```json
{
  "id":         20,
  "type":       "THREAT",
  "domain":     "geopolitics",
  "text":       "Intelligence item headline text",
  "timestamp":  "14:32",
  "confidence": 87,
  "source":     "Source Name"
}
```

### Fields Feed

| Field | Notes |
| ----- | ----- |
| `id` | Unique integer. Used as React key via `feed-${item.id}`. Must be unique across the array. |
| `type` | Feed item category. Controls badge colour via `TYPE_COLORS` in FeedPanel: THREAT/CYBER (red), ECONOMIC (amber), GEOPOLITICAL (blue), DIPLOMATIC (purple), SIGNAL/CLIMATE/SPACE (green). |
| `domain` | Intelligence domain label. Displayed as uppercase abbreviation next to the type badge. |
| `text` | Headline text for the item. |
| `timestamp` | Display time string (e.g. `"14:32"`). No date component — these are treated as same-day items. |
| `confidence` | 0–100 integer. Rendered as a colour-coded progress bar at the bottom of each item. |
| `source` | Source attribution label. Currently stored but not displayed in the default UI. |

---

## `decisions.json`

Array of 3 decision intelligence cases displayed in `DecisionWorkspace`.

### Top-level schema

```json
{
  "id":       "DEC-2024-0847",
  "title":    "Should India join the US-led Semiconductor...",
  "summary":  "...",
  "domain":   "technology",
  "priority": "CRITICAL",
  "status":   "ACTIVE",
  "deadline": "Q1 2025",
  "owner":    "National Security Council",
  "alerts":   [...],
  "evidence": [...],
  "scenarios": [...],
  "watchlist": [...],
  "past_decisions": [...]
}
```

### `alerts[]`

```json
{ "severity": "HIGH", "text": "Alert text", "time": "2h ago" }
```

### `evidence[]`

```json
{
  "id":         "E1",
  "type":       "FACT|INTELLIGENCE|RISK|FORECAST|SIGNAL",
  "claim":      "Evidence text",
  "confidence": 92,
  "impact":     "HIGH",
  "supports":   "JOIN|RESPOND|ACCELERATE|CAUTION|WAIT|NEUTRAL",
  "sources": [
    { "name": "Reuters", "verified": true }
  ],
  "timestamp":  "2024-11-15"
}
```

> **Important:** Evidence `id` values (E1, E2, ...) are reused across different decisions. This is safe because only one decision renders at a time, but avoid rendering multiple decisions' evidence in the same list.

### `scenarios[]`

```json
{
  "id":        "S1",
  "title":     "JOIN",
  "subtitle":  "Full integration",
  "color":     "#2a9e58",
  "riskLevel": "MEDIUM",
  "risk":      "Risk description text",
  "outcomes": [
    { "label": "GDP Impact", "value": "+2.4%", "color": "#2a9e58" }
  ]
}
```

### `watchlist[]`

```json
{
  "label":     "TSMC Technology Transfer Decision",
  "current":   "Pending review",
  "threshold": "If approved, triggers immediate JOIN recommendation"
}
```

### `past_decisions[]`

```json
{
  "title":   "India-US COMCASA Agreement 2018",
  "date":    "September 2018",
  "outcome": "SUCCESS",
  "color":   "#2a9e58",
  "detail":  "Precedent detail text"
}
```
