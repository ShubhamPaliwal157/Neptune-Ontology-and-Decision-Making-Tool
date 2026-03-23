# Neptune — Design System & UI Reference

This document is the single source of truth for Neptune's visual language, component patterns, and interaction conventions. Every page, component, and feature must follow this system. It is written to be used directly with AI tools — paste relevant sections as context when generating new UI.

---

## Core Aesthetic

Neptune's UI is a **deep-space intelligence terminal**. The aesthetic sits at the intersection of:

- Near-black backgrounds with layered depth through subtle transparency
- A single dominant accent colour — deep authoritative blue (`#3d7bd4`) — used sparingly
- Glass panels that appear to float over a star-field environment
- Monospace typography that reinforces the sense of a precision data tool
- Uppercase labels, tight letter-spacing, and sparse layouts — information density without clutter

The design should feel like a high-grade analyst terminal. Every decision reinforces that the user is handling serious, structured intelligence data. It should never look like a consumer SaaS product, a dashboard template, or an AI chatbot.

**The UI is not decorative. Everything on screen has a reason to exist.**

---

## Typography

### Fonts

| Font | Role | CSS Variable |
| ---- | ---- | ------------ |
| **Bebas Neue** | Display — wordmark, section headings, large numbers, card titles | `var(--font-display)` |
| **IBM Plex Mono** | Everything else — body, labels, inputs, buttons, nav, metadata | `var(--font-mono)` |

Loaded in `app/layout.js` via `next/font/google`. Applied globally in `globals.css`:

```css
body {
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.6;
}
```

### Type Scale

| Use | Size | Font | Letter-spacing | Case |
| --- | ---- | ---- | -------------- | ---- |
| Hero wordmark / logo | 44px | Bebas Neue | 10px | UPPER |
| Section / modal title | 26–32px | Bebas Neue | 3–8px | UPPER |
| Card title | 22px | Bebas Neue | 3px | UPPER |
| Body paragraph | 11–13px | IBM Plex Mono | 0 | Mixed |
| Navigation label | 13px | IBM Plex Mono 600 | 3px | UPPER |
| Overline / category tag | 9–10px | IBM Plex Mono | 2–4px | UPPER |
| Input label | 8px | IBM Plex Mono | 2px | UPPER |
| Micro caption / timestamp | 8–9px | IBM Plex Mono | 1px | UPPER |

### Rules

- Display font (Bebas Neue) is for headings and large numbers only — never body copy
- All labels, overlines, and category text are uppercase with letter-spacing
- Line height for body copy: `1.6–1.85`
- Never use system fonts, Inter, Roboto, or any font outside this list

---

## Colour System

### CSS Variables (defined in `globals.css`)

```css
:root {
  /* Backgrounds — darkest to lightest */
  --bg-base:    #04060e;   /* page background */
  --bg-deep:    #070c1c;   /* deeper inset areas */
  --bg-panel:   #080d1f;   /* sidebar, panel backgrounds */
  --bg-card:    #0b1228;   /* card fills */
  --bg-hover:   #0f1835;   /* hover state on cards */

  /* Borders */
  --border:        rgba(58,110,200,0.14);   /* default subtle border */
  --border-mid:    rgba(100,160,240,0.22);  /* mid-emphasis border */
  --border-bright: rgba(168,210,255,0.32);  /* high-emphasis border */

  /* Brand blue ramp */
  --neptune-core:  #2558b8;               /* logo fill, deep buttons */
  --neptune-mid:   #3d7bd4;               /* primary accent — links, active states */
  --neptune-light: #7aaeee;               /* lighter accent — secondary text, icons */
  --neptune-pale:  #c8e4ff;               /* near-white blue — high contrast text */
  --neptune-glow:  rgba(61,123,212,0.18); /* tinted fill for active/hover areas */
  --neptune-ring:  rgba(168,210,255,0.1); /* faint ring/border glow */

  /* Text */
  --text-primary:   #ddeeff;   /* main text */
  --text-secondary: #7a9fbe;   /* secondary / meta text */
  --text-dim:       #3a5878;   /* dimmed / placeholder */

  /* Status / semantic */
  --red:    #c94040;   /* critical / error / threat */
  --orange: #c87c3a;   /* high / warning */
  --green:  #2a9e58;   /* live / success / positive */
  --yellow: #b89a30;   /* medium / caution */
  --purple: #7050b8;   /* society domain / depth accent */
}
```

### Domain Colour Reference

These encode semantic meaning — always use the correct colour per domain, never decorate with them arbitrarily.

| Domain | Code | Hex | Usage |
| ------ | ---- | --- | ----- |
| Geopolitics | GEO | `#c94040` | Borders, node dots, tags |
| Economics | ECO | `#c87c3a` | Borders, node dots, tags |
| Defence | DEF | `#b85a30` | Borders, node dots, tags |
| Technology | TEC | `#3d7bd4` | Borders, node dots, tags |
| Climate | CLI | `#2a9e58` | Borders, node dots, tags |
| Society | SOC | `#7050b8` | Borders, node dots, tags |

Domain colours appear as 7–8px dots, tag borders, and card accent bars. Never use them as large fill colours.

### Commonly Used Raw Values

These appear frequently across components and may be used inline where CSS variables are not available:

```md
#03050c / #04060e   — deepest page background
#07090f             — star canvas background (auth pages)
rgba(3,5,12,0.75)   — frosted topbar background
rgba(3,5,12,0.88)   — frosted modal overlay/scrim
rgba(11,18,40,0.9)  — card fill (light variant)
rgba(7,11,28,0.95)  — card fill (dark variant)
rgba(58,110,200,0.12) — active nav item fill
rgba(61,123,212,0.1)  — button hover fill
#6a9aba             — medium-brightness secondary text (common)
#5a8ec4             — slightly brighter secondary text
#4a6b8a             — dimmed metadata text
```

---

## Spacing & Layout

### Grid & Containers

- Dashboard grid: `repeat(auto-fill, minmax(260px, 1fr))`, `gap: 16px`
- Large card grid (recent workspaces): `repeat(N, minmax(0, 320px))`, `gap: 16px`
- Modal width: `460px` (narrower) or `640px` (wider)
- Section padding: `52px 64px 32px` (top / sides / bottom)
- Panel padding: `24px` large, `18px 20px` normal
- Topbar height: `~57px` (`padding: 14px 32px`)
- Sidebar width: `56px` (icon-only)

### Spacing Rules

- Consistent `gap: 6–8px` between inline items (dots, tags, badges)
- `marginBottom: 10px` after row-level headers within cards
- `gap: 16px` between card-level elements
- Form fields: `marginBottom: 16–20px`
- Section labels from content: `marginBottom: 18px`

---

## Cards

### Workspace Card

The canonical card pattern used throughout the dashboard.

```js
{
  background: 'linear-gradient(135deg, rgba(11,18,40,0.9) 0%, rgba(7,11,28,0.95) 100%)',
  border: '1px solid rgba(58,110,200,0.2)',
  borderTop: '2px solid rgba(61,123,212,0.45)',   // 2px top accent
  padding: '18px 20px',   // normal; '24px' for large variant
  height: 170,            // normal; 210 for large variant
  position: 'relative',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  transition: 'all 0.2s',
}
```

**Hover state** (applied via `onMouseEnter`/`onMouseLeave` directly on the element — never via CSS class):

```js
borderColor: 'rgba(61,123,212,0.5)'
transform: 'translateY(-2px)'
boxShadow: '0 8px 32px rgba(61,123,212,0.15)'
```

**Inner gradient overlay** (top of card, `pointerEvents: none`):

```js
{
  position: 'absolute', top: 0, left: 0, right: 0, height: 60,
  background: 'linear-gradient(180deg, rgba(61,123,212,0.07) 0%, transparent 100%)',
}
```

**Card anatomy (top to bottom):**

1. Status dot (7px circle) + type label (COLLABORATIVE / PERSONAL)
2. Workspace name in display font
3. Description (2-line clamp, `WebkitLineClamp: 2`)
4. Domain colour dots (7–8px circles with glow)
5. Entity count · relation count / last-opened date

### Modal / Dialog Panel

```js
{
  background: 'linear-gradient(160deg, rgba(11,18,40,0.98) 0%, rgba(7,11,28,0.98) 100%)',
  border: '1px solid rgba(58,110,200,0.2)',
  borderTop: '2px solid rgba(61,123,212,0.5)',
  backdropFilter: 'blur(18px)',
}
```

Modal overlay scrim:

```js
{ background: 'rgba(3,5,12,0.88)', backdropFilter: 'blur(12px)' }
```

Modal entrance animation: `modal-rise` — `translateY(24px)` → `translateY(0)`, `opacity 0 → 1`, duration `0.6s`, `cubic-bezier(0.16,1,0.3,1)`.

### "New Workspace" Placeholder Card

Dashed border variant — uses dashed border instead of solid:

```js
{
  background: 'transparent',
  border: '1px dashed rgba(61,123,212,0.3)',
  padding: '20px',
}
```

Hover: `borderColor: 'rgba(61,123,212,0.6)'`, `background: 'rgba(61,123,212,0.05)'`.

---

## Panels & Chrome

### Topbar / Navbar

```js
{
  background: 'rgba(3,5,12,0.75)',
  backdropFilter: 'blur(12px)',
  borderBottom: '1px solid rgba(58,110,200,0.12)',
  padding: '14px 32px',
}
```

- Logo: 30px circle, `background: #2558b8`, display font size 17, `boxShadow: '0 0 10px rgba(61,123,212,0.4)'`
- Wordmark: 13px IBM Plex Mono 600, `letterSpacing: 3px`, `color: #7aaeee`
- Never fully opaque — the star canvas or background should be faintly visible through it

### Sidebar (Workspace View)

```js
{
  width: 56,            // always collapsed — icon only
  background: 'var(--bg-panel)',
  borderRight: '1px solid var(--border)',
}
```

Active nav item:

```js
{
  background: 'rgba(61,123,212,0.12)',
  borderLeft: '2px solid var(--neptune-mid)',
  color: 'var(--neptune-light)',
}
```

Inactive nav item: `background: transparent`, `borderLeft: '2px solid transparent'`, `color: var(--text-dim)`.

Domain indicator dots in sidebar: 7px circles at 70% opacity with `boxShadow: '0 0 5px {color}55'`.

LIVE indicator: 5px green pulsing dot + vertical `writing-mode` label `fontSize: 7px`.

### Intelligence Feed Panel (Left)

- Width: `280–320px`
- Background: `var(--bg-panel)` with `borderRight: '1px solid var(--border)'`
- Feed items reveal progressively with staggered animation on load
- Severity badges use status colours as background tints:
  - `CRITICAL` → `#c94040` text, `rgba(201,64,64,0.12)` background
  - `HIGH` → `#c87c3a`
  - `MEDIUM` → `#b89a30`

### Node Detail Panel (Right)

- Width: `300px`, `background: var(--bg-panel)`, `borderLeft: '1px solid var(--border)'`
- Tab switcher: CONNECTIONS / AI tabs with `borderBottom: '2px solid {accent}'` on active
- Empty state: centered text `SELECT AN ENTITY / TO INSPECT` in dim text

---

## Buttons

### Primary Action Button

Used for main CTAs: "ENTER WORKSPACE", login submit, "START PROCESSING", etc.

```js
{
  background: 'transparent',
  border: '1px solid rgba(100,160,240,0.35)',
  color: '#c8e4ff',       // var(--neptune-pale)
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: 4,
  padding: '13px',        // full-width; or '13px 28px' for inline
  fontFamily: 'var(--font-mono)',
  transition: 'all 0.2s',
}
```

Hover:

```js
background: 'rgba(61,123,212,0.1)'
borderColor: 'rgba(168,210,255,0.5)'
```

### Secondary / Ghost Button

Used for cancel, sign out, back actions:

```js
{
  background: 'transparent',
  border: '1px solid rgba(58,110,200,0.25)',
  color: '#6a9aba',
  fontSize: 12,
  letterSpacing: 1,
  padding: '6px 14px',
}
```

Hover: `color: #c94040`, `borderColor: 'rgba(201,64,64,0.4)'` (for destructive secondary like Sign Out).
Hover: `color: #c8e4ff`, `borderColor: 'rgba(100,160,240,0.35)'` (for neutral secondary).

### Danger Button (Delete / Confirm Destructive)

```js
{
  background: 'rgba(201,64,64,0.15)',
  border: '1px solid rgba(201,64,64,0.4)',
  color: '#c94040',
  fontSize: 10,
  letterSpacing: 1,
}
```

### Icon / Utility Button (3-dot menu, close, etc.)

```js
{
  width: 28, height: 28,
  background: 'transparent',
  border: '1px solid transparent',
  color: '#6a9aba',
  fontSize: 16,
  borderRadius: 2,
  transition: 'all 0.15s',
}
```

Hover: `background: 'rgba(61,123,212,0.15)'`, `borderColor: 'rgba(61,123,212,0.4)'`.

### Button Rules

- All buttons: `fontFamily: 'var(--font-mono)'`, `cursor: 'pointer'`
- Hover/active states are applied via `onMouseEnter`/`onMouseLeave` on the element directly — **never via CSS class or `useState`**
- No border-radius on primary/secondary buttons — sharp corners (`borderRadius: 0`) or `2px` maximum
- Labels are UPPERCASE with letter-spacing

---

## Form Inputs

```js
const inputStyle = {
  background: 'rgba(8,13,31,0.8)',
  border: '1px solid rgba(58,110,200,0.2)',
  borderRadius: 2,
  color: '#ddeeff',
  fontSize: 12,
  padding: '11px 14px',
  fontFamily: 'var(--font-mono)',
  width: '100%',
  outline: 'none',
  transition: 'border-color 0.2s',
}
```

Focus: `borderColor: 'rgba(61,123,212,0.55)'`
Blur: `borderColor: 'rgba(58,110,200,0.2)'`

Input labels:

```js
{ fontSize: 8, letterSpacing: 2, color: '#3a5878', display: 'block', marginBottom: 6 }
```

Error state:

```js
{
  fontSize: 9, color: '#c94040', letterSpacing: 1,
  padding: '8px 12px',
  background: 'rgba(201,64,64,0.08)',
  border: '1px solid rgba(201,64,64,0.2)',
}
```

---

## Dividers & Separators

Horizontal rule — gradient that fades to transparent at both ends:

```js
{
  width: '100%', height: 1,
  background: 'linear-gradient(90deg, rgba(61,123,212,0.4), transparent)',
  marginBottom: 24,
}
```

Subtle section divider (between panels/rows):

```js
{ height: 1, background: 'var(--border)' }
// or inline:
{ borderBottom: '1px solid rgba(58,110,200,0.12)' }
```

Vertical divider (between stats cells in a grid):

```js
{ borderRight: '1px solid var(--border)' }
```

---

## Status Indicators

### Pulsing Dot

Used for LIVE indicator, active workspace, processing states:

```jsx
<div style={{
  width: 5, height: 5, borderRadius: '50%',
  background: '#2a9e58',   // or '#c94040' for critical, '#3d7bd4' for processing
  animation: 'pulse-dot 1.8s infinite',
}} />
```

`pulse-dot` keyframe (defined in `globals.css`):

```css
@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.3; }
}
```

### Processing / Loading State

Three-dot loading indicator:

```jsx
<div style={{ display: 'flex', gap: 5 }}>
  {[0,1,2].map(i => (
    <div key={i} style={{
      width: 5, height: 5, borderRadius: '50%',
      background: '#3d7bd4',
      animation: `pulse-dot 0.8s ${i * 0.18}s infinite`,
    }} />
  ))}
</div>
```

Progress bar:

```js
// Track
{ height: 2, background: 'rgba(58,110,200,0.15)', borderRadius: 2, overflow: 'hidden' }
// Fill
{ height: '100%', width: `${progress}%`, background: '#3d7bd4', transition: 'width 0.6s ease' }
```

---

## Background Environments

### Star Canvas (Auth Pages — Login, Signup)

A `<canvas>` element rendered with `position: fixed; inset: 0; zIndex: 0; pointerEvents: none`. Approximately 200 small stars drawn as circles with randomised radius (`0.15–1.05px`), alpha (`0.08–0.43`), and a slow sine-wave breathing animation. Stars are redrawn every frame via `requestAnimationFrame`.

Never use `useState` for star position — run the animation loop entirely within the `useEffect` cleanup.

### Star Canvas (Dashboard)

Same pattern as auth pages. Star canvas runs behind all content at `zIndex: 0`.

### Video Background (Workspace Preview / Landing)

`<NeptuneBackground />` component renders `neptune-bg.mp4` looping with:

- `muted autoPlay loop playsInline`
- `position: absolute; inset: 0; width: 100%; height: 100%; objectFit: cover`
- A dark overlay gradient on top: `rgba(4,6,14,0.85)` to `rgba(4,6,14,0.92)` ensuring text readability

Other pages do **not** use the video — they use the star canvas instead. The star canvas achieves a similar atmospheric depth at much lower cost.

---

## Animations

All animations are defined as `@keyframes` in `globals.css` and referenced by name.

| Animation | Usage |
| --------- | ----- |
| `pulse-dot` | Pulsing status dots, loading indicators |
| `fade-in-up` | General element entrance: `opacity 0→1`, `translateY(10px→0)` |
| `modal-rise` | Modal entrance: `opacity 0→1`, `translateY(24px→0)`, `0.6s cubic-bezier(0.16,1,0.3,1)` |
| `stars-drift` | Slow vertical drift on star particles |
| `atmosphere-breathe` | `box-shadow` pulse on the Neptune globe visual |
| `ring-pulse` | Opacity pulse on orbital ring elements |

### Animation Rules

- Hover state transforms (translateY, boxShadow) use CSS `transition: 'all 0.2s'` on the element — not animation keyframes
- Never use `useState` for anything that animates at 60fps — use `ref.current.style` for real-time updates
- All entrance animations: `cubic-bezier(0.16,1,0.3,1)` — fast in, spring out

---

## Context Badges & Tags

Domain tag (small coloured pill used in filters, card metadata):

```js
{
  fontSize: 8, letterSpacing: 1,
  padding: '2px 8px',
  border: `1px solid ${color}44`,
  background: `${color}18`,
  color: color,
}
```

Status badge (CRITICAL / HIGH / MEDIUM / LOW):

```js
{
  fontSize: 9, letterSpacing: 1, fontWeight: 600,
  padding: '2px 6px',
  color: statusColor,
  background: `${statusColor}18`,
}
```

Classification / system badge (e.g. "DEVELOPMENT PREVIEW"):

```js
{
  display: 'inline-flex', alignItems: 'center', gap: 7,
  padding: '3px 10px',
  border: '1px solid rgba(200,80,80,0.25)',
  fontSize: 9, letterSpacing: 2, color: '#a05050',
}
```

---

## Scrollbar

Globally styled in `globals.css` — ultra-thin, nearly invisible:

```css
::-webkit-scrollbar { width: 2px; height: 2px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #1a2a44; border-radius: 2px; }
```

---

## Z-Index Stack

| Layer | z-index | Element |
| ----- | ------- | ------- |
| Background canvas / video | 0 | Star canvas, video background |
| Page content | 1 | All sections, panels, cards |
| Cursor / ambient effects | 2 | Orb overlays (if present) |
| Topbar / navbar | 10 | Always on top of content |
| Dropdown menus | 20–30 | Context menus, tooltips |
| Modal scrim | 99 | Overlay scrim |
| Modal panel | 100 | Dialog content |

---

## Interaction Patterns

### Hover States

All hover states are applied via `onMouseEnter`/`onMouseLeave` event handlers mutating `e.currentTarget.style` directly. **Never use React state or CSS classes for hover.** This keeps animations synchronous and avoids re-renders.

```jsx
onMouseEnter={e => {
  e.currentTarget.style.borderColor = 'rgba(61,123,212,0.5)'
  e.currentTarget.style.transform = 'translateY(-2px)'
  e.currentTarget.style.boxShadow = '0 8px 32px rgba(61,123,212,0.15)'
}}
onMouseLeave={e => {
  e.currentTarget.style.borderColor = 'rgba(58,110,200,0.2)'
  e.currentTarget.style.transform = 'translateY(0)'
  e.currentTarget.style.boxShadow = 'none'
}}
```

### Context Menus / Dropdowns

Dropdowns are positioned `absolute` relative to a `position: relative` wrapper. They open on button click (toggle), not hover. They dismiss via `onMouseLeave` on the dropdown container itself. Confirmation flows (e.g. delete) flip to a secondary state within the same dropdown — no separate dialog.

### Links

Internal navigation uses Next.js `<Link>` with `textDecoration: 'none'`. Text links in body copy:

```js
{ color: '#7aaeee', textDecoration: 'none', letterSpacing: 2 }
// Hover:
{ color: '#c8e4ff' }
```

---

## What Not To Do

- **No `useState` for animations** — orb positions, hover states, 60fps loops all use direct DOM mutation via `ref.current.style`
- **No opaque navbars** — the topbar is always `rgba(3,5,12,0.75)` with backdrop blur, never fully opaque
- **No pill-shaped buttons** — buttons are sharp (`borderRadius: 0`) or at most `borderRadius: 2`
- **No gradient headings** — text colour is solid `#ddeeff` or `#c8e4ff`, no blue-to-purple gradient on text
- **No Inter, Roboto, or system fonts** — IBM Plex Mono and Bebas Neue only
- **No colour outside the palette** — do not invent new blues, use the defined ramp
- **No decorative use of domain colours** — they encode semantic meaning only
- **No `useEffect` for derived values** — compute inline or with `useMemo`
- **No `setState` synchronously in effects** — derive values directly or use `useMemo`/`useCallback`
- **No consumer SaaS aesthetics** — no rounded cards with shadow, no pastel colours, no sans-serif body text, no rounded buttons

---

## Quick Reference: Generating a New Page

When asking an AI to build a new Neptune page, include this context block:

```md
Neptune Design Rules:
- Background: #04060e page, #080d1f panels, #0b1228 cards
- Star canvas background (position: fixed, zIndex: 0, pointerEvents: none, ~200 breathing stars)
- Topbar: rgba(3,5,12,0.75) with backdropFilter blur(12px), 1px border rgba(58,110,200,0.12)
- Cards: linear-gradient(135deg, rgba(11,18,40,0.9), rgba(7,11,28,0.95)), border rgba(58,110,200,0.2), borderTop 2px solid rgba(61,123,212,0.45)
- Card hover: borderColor rgba(61,123,212,0.5), translateY(-2px), boxShadow 0 8px 32px rgba(61,123,212,0.15)
- Primary button: transparent bg, border rgba(100,160,240,0.35), color #c8e4ff, fontSize 10, letterSpacing 4, UPPERCASE
- Accent colour: #3d7bd4 (mid), #7aaeee (light), #c8e4ff (pale/text)
- Text: #ddeeff (primary), #6a9aba (secondary), #4a6b8a (dim)
- Fonts: Bebas Neue (headings/display), IBM Plex Mono (everything else)
- All hover states via onMouseEnter/onMouseLeave — never useState or CSS classes
- No border-radius on buttons (0 or 2px max), no rounded cards
- Status: green #2a9e58 (live), red #c94040 (critical), orange #c87c3a (high)
```
