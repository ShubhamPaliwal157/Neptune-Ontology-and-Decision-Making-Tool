# Neptune — Design Philosophy & UI System

This document defines the visual language, interaction patterns, and component conventions used throughout the Neptune front-end. Every new page, component, or feature must follow this system.

---

## Core Aesthetic

Neptune's UI sits at the intersection of **deep-space atmosphere** and **precision intelligence tooling**. The aesthetic is:

- Dark, almost black backgrounds (`#060810`) with layered transparency and blur
- Blue as the dominant accent — not vivid, but deep and authoritative (`#3d7bd4`)
- Purple as a secondary accent for depth and dimension (`#7050b8`)
- Domain colours used sparingly to encode semantic meaning, not for decoration
- Glass panels floating over environmental depth — video, dot grids, ambient orbs
- Typography that is readable first, characterful second

The design should feel like a high-grade intelligence terminal, not a consumer app. Every interface decision should reinforce the sense that the user is handling serious, structured information.

---

## Typography

### Fonts

| Font | Weight | Usage |
| ---- | ------ | ----- |
| **Sora** | 700, 800 | All headings, display numbers, logo wordmark, section titles |
| **DM Sans** | 400, 500, 600 | All body text, nav links, button labels, descriptive copy |

Load via:

```css
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');
```

**Never use:** IBM Plex Mono, Bebas Neue, Inter, Roboto, system-ui, or any font not in this list for visual UI elements. (IBM Plex Mono may remain inside workspace views as a data/terminal font, but not in the landing page or auth pages.)

### Scale & Style

- **Hero wordmark:** `clamp(72px, 10vw, 132px)`, Sora 800, `letterSpacing: 0.04em`, `lineHeight: 0.9`
- **Section headings:** `clamp(34px, 4vw, 56px)`, Sora 700, `letterSpacing: -0.02em`
- **Card titles:** 22px, Sora 700, `letterSpacing: -0.01em`
- **Body copy:** 15–18px, DM Sans 400, `lineHeight: 1.75–1.82`
- **Labels / overlines:** 10px, DM Sans 600, `letterSpacing: 0.3–0.4em`, UPPERCASE
- **Captions / micro text:** 11–13px, DM Sans 400

---

## Colour System

### Background Layers (darkest → lightest)

```md
#060810       Page background
#f0f4ff       Primary text (near-white blue)
rgba(240,244,255, 0.68)   Body copy
rgba(240,244,255, 0.52)   Secondary text
rgba(240,244,255, 0.32)   Dimmed text
rgba(240,244,255, 0.22)   Very dim (labels, captions)
```

### Brand Blues

```md
#3d7bd4   Neptune blue (primary accent, links, borders)
#7050b8   Neptune purple (secondary accent, depth)
#c8e4ff   Neptune pale blue (high-contrast text on dark)
#2558b8   Deep brand blue (logo fills, gradients)
#90c4ff   Light highlight (specular, planet)
```

### Domain Colours

These encode semantic meaning — always use the correct colour for a domain, never swap.

| Domain | Code | Hex |
| ------ | ---- | --- |
| Geopolitics | GEO | `#c94040` |
| Economics | ECO | `#c87c3a` |
| Defense | DEF | `#b85a30` |
| Technology | TEC | `#3d7bd4` |
| Climate | CLI | `#2a9e58` |
| Society | SOC | `#7050b8` |

### Status Colours

```md
#2a9e58   Live / success / positive
#c94040   Critical / error / threat
#c87c3a   High / warning
#b89a30   Medium / caution
```

---

## Glass Panels

The shared `glass` preset is used for all floating card surfaces:

```js
const glass = {
  background:           'rgba(255,255,255,0.040)',
  backdropFilter:       'blur(28px)',
  WebkitBackdropFilter: 'blur(28px)',
  border:               '1px solid rgba(255,255,255,0.082)',
}
```

Every glass card also gets a `::before` pseudo-element light leak:

```css
.card::before {
  content: '';
  position: absolute; inset: 0; border-radius: inherit;
  background: linear-gradient(135deg, rgba(255,255,255,0.055) 0%, transparent 55%);
  pointer-events: none;
}
```

Cards with a coloured accent get a 2px bottom bar:

```css
.feat-bar {
  position: absolute; bottom: 0; left: 0; right: 0; height: 2px;
  background: linear-gradient(90deg, {accent}00, {accent}80, {accent}00);
}
```

---

## TiltCard Component

All interactive glass cards use the `TiltCard` component, which applies a smooth 3D tilt on mouse hover using `requestAnimationFrame` (no React state updates — pure DOM).

**API:**

```jsx
<TiltCard accent="#3d7bd4" style={{ ...glass, borderRadius: 16 }}>
  {/* card contents */}
</TiltCard>
```

**Behaviour:**

- On `mouseenter`: starts a rAF loop lerping `rotateX`/`rotateY` toward the cursor position (max ±9°), scales to `1.025`, adds coloured `box-shadow` ring
- On `mouseleave`: springs back to flat (`scale(1)`, no shadow)
- Uses `willChange: transform` and `transformStyle: preserve-3d`
- No React state — runs at 60fps without triggering re-renders

**Do not** use TiltCard on interactive elements that contain buttons or forms — the perspective transform can interfere with pointer events.

---

## Buttons

All buttons use `border-radius: 6px` — a slightly curved rectangle, never fully pill-shaped or perfectly square.

### Primary (`lp-btn-pri`)

```css
background: rgba(61,123,212,0.18);
border: 1px solid rgba(61,123,212,0.52);
border-radius: 6px;
color: #c8e4ff;
font-family: "DM Sans";
font-size: 13px;
font-weight: 600;
letter-spacing: 2px;
padding: 13px 28px;
```

Hover: brighter background, brighter border, `translateY(-2px)`, blue `box-shadow`.

Has a `::after` gradient shimmer overlay (`linear-gradient(135deg, rgba(255,255,255,0.09) 0%, transparent 55%)`).

### Secondary (`lp-btn-sec`)

```css
background: transparent;
border: 1px solid rgba(255,255,255,0.1);
border-radius: 6px;
color: rgba(240,244,255,0.58);
```

Hover: faint background, brighter border, brighter text.

---

## Cursor Orb

A large blurred radial gradient follows the cursor, creating an ambient glow effect.

```jsx
// rendered as a fixed div, positioned via direct DOM style updates (no React state)
<div ref={orbRef} style={{
  position: 'fixed', top: 0, left: 0,
  width: 720, height: 720, borderRadius: '50%',
  background: 'radial-gradient(circle, rgba(61,123,212,0.38) 0%, rgba(112,80,184,0.22) 28%, rgba(61,123,212,0.10) 52%, transparent 70%)',
  filter: 'blur(38px)',
  pointerEvents: 'none', zIndex: 2,
  willChange: 'transform',
  mixBlendMode: 'screen',
}}/>
```

Lerp factor: `0.055` (laggy enough to feel smooth, fast enough to feel responsive).

**Implementation:** Uses a persistent `requestAnimationFrame` loop that updates `orbRef.current.style.transform` directly. Never use `useState` for the orb position — this would cause 60 re-renders per second.

```js
const tick = () => {
  orbPosRef.current.x += (mouseRef.current.x - orbPosRef.current.x) * 0.055
  orbPosRef.current.y += (mouseRef.current.y - orbPosRef.current.y) * 0.055
  orbRef.current.style.transform = `translate(${orbPosRef.current.x - 360}px, ${orbPosRef.current.y - 360}px)`
  rafRef.current = requestAnimationFrame(tick)
}
```

---

## Navbar

Transparent when at top of page. Transitions to frosted glass on scroll (threshold: 50px).

```js
// Scrolled state
background:           'rgba(6,8,18,0.48)'
backdropFilter:       'blur(22px) saturate(160%)'
borderBottom:         '1px solid rgba(255,255,255,0.07)'

// Default (at top)
background:           'transparent'
backdropFilter:       'none'
```

**Intentionally translucent** — not fully opaque when scrolled. The video and ambient orbs should remain faintly visible behind the nav.

Nav link spacing: `gap: 32px`. Text: 13px DM Sans 500, `rgba(240,244,255,0.55)`. Hover: `#f0f4ff`.

---

## Environmental Layers (z-index stack)

| Layer | z-index | Element |
| ----- | ------- | ------- |
| Background video | 0 | `<video>` + gradient overlay |
| Dot grid | 0 | `position: fixed` repeating radial pattern |
| Ambient orbs | 0 | Two large blurred static orbs (top-right purple, bottom-left green) |
| Cursor orb | 2 | 720px blurred radial, `mixBlendMode: screen` |
| Page content | 1 | All sections, cards, text |
| Navbar | 300 | Always on top |

---

## Scroll Animations

### Scroll Reveal

All sections and cards use `[data-reveal]` + `IntersectionObserver`. When an element enters the viewport, `classList.add('lp-in')` is called (with an optional `data-delay` in ms for stagger).

```css
[data-reveal] {
  opacity: 0;
  transform: translateY(34px);
  transition: opacity 0.75s cubic-bezier(0.16,1,0.3,1),
              transform 0.75s cubic-bezier(0.16,1,0.3,1);
}
[data-reveal].lp-in { opacity: 1; transform: translateY(0); }
```

Stagger cards by passing `data-delay={i * 80}` (80ms per card).

### Stats Count-Up

Stats use a cubic-ease count-up animation triggered by `IntersectionObserver` at `threshold: 0.3`. Uses `performance.now()` for frame-accurate timing, not `setInterval`.

### Workflow Sticky Scroll

The Workflow section uses a **sticky scrollytelling** pattern:

- Outer section is `STEPS.length × 100vh` tall (the "runway")
- Inner container is `position: sticky; top: 0; height: 100vh` (the "screen")
- A scroll handler maps progress through the runway to `activeStep`
- Steps are absolutely positioned and fade in/out via `opacity` transition

**Snap behaviour** is handled in JavaScript, not CSS, to avoid conflicts with the sticky positioning. A debounced scroll handler fires 160ms after scroll stops. If the section top is between 2px and 45% viewport height below the fold, it programmatically scrolls the remaining distance:

```js
const trySnap = () => {
  const rect = section.getBoundingClientRect()
  if (rect.top > 2 && rect.top < window.innerHeight * 0.45) {
    window.scrollTo({ top: window.scrollY + rect.top, behavior: 'smooth' })
  }
}
```

**Do not use** `scroll-snap-type` / `scroll-snap-align` CSS for this section — CSS snap fights with `position: sticky` and causes the panel to show empty space.

---

## Orbit Visual (Hero)

A pure CSS animated component — no canvas, no SVG.

**Structure:**

- Central planet: 84px circle, `radial-gradient` from `#90c4ff` → `#2558b8` → `#0d1f4a`
- Three orbital rings: 148px, 208px, 275px diameter circles with `border: 1px solid`
- Each ring has a coloured dot that rotates with it (`position: absolute; top: -4px; left: 50%`)
- Domain labels positioned at fixed angles around the outermost ring using trigonometry
- Float animation: `lp-float` (vertical sine, 8s, ±14px)
- Ring rotations: `lp-ring-cw` / `lp-ring-ccw` at 14s, 22s, 33s

---

## Page Structure (Landing)

```html
<video background>
<dot grid>
<ambient orbs × 2>
<cursor orb>
<nav>
<section: Hero>      — OrbitVisual + text + CTAs + domain pills
<div: Stats>         — 4-cell glass panel with count-up
<section: Features>  — 2-col TiltCard grid (6 cards)
<section: Workflow>  — sticky scroll, 3 steps, alternating layout
<section: Domains>   — flat glass container + 6 TiltCard tiles
<section: CTA>       — large glass panel, centred
<footer>             — 3-col: brand + Product + Legal
```

---

## What Not To Do

- **No gradients that look "AI-generated"** (blue-to-purple on headings). Headings should be solid `#f0f4ff` or white with a subtle glow `text-shadow`.
- **No pill-shaped buttons** (`border-radius: 100px`). Buttons are slightly rounded rectangles (`border-radius: 6px`).
- **No opaque navbars.** The nav at `rgba(6,8,18, 0.48)` should let the video show through.
- **No `useState` for animation loops.** Orb position, TiltCard transforms, and progress bars that animate at 60fps must use direct DOM mutation via `ref.current.style`.
- **No generic fonts** (Inter, Roboto, system-ui). Sora + DM Sans only.
- **No `prototype` language.** Neptune is a full product. Copy should be confident and present-tense.
