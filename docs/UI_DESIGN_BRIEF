# Neptune — UI Design System Brief

*For use when prompting AI agents to design consistent pages within the Neptune app.*

---

## In one sentence

Deep-space dark glassmorphism with precision typography, restrained motion, and deliberate contrast — built to feel like high-grade intelligence tooling, not a consumer product.

---

## Colour

**Background:** `#060810` — near-black with a faint blue-navy cast. Not pure black.

**Primary text:** `#f0f4ff` — slightly blue-tinted white. Never pure `#ffffff`.

**Text hierarchy:**

- Primary: `rgba(240,244,255, 1.0)` — headings, labels
- Secondary: `rgba(240,244,255, 0.68)` — body copy
- Tertiary: `rgba(240,244,255, 0.45)` — captions, meta
- Ghost: `rgba(240,244,255, 0.22)` — disabled, very dim

**Brand blue:** `#3d7bd4` — the dominant accent. Used for borders, glows, overlines, interactive elements.
**Brand purple:** `#7050b8` — secondary depth accent. Used sparingly for variety.

**Domain colours** (semantic — always use the correct one, never decoratively swap):

- Geopolitics `#c94040`, Economics `#c87c3a`, Defense `#b85a30`
- Technology `#3d7bd4`, Climate `#2a9e58`, Society `#7050b8`

**Status:** Live/success `#2a9e58` · Critical/error `#c94040` · Warning `#c87c3a`

---

## Typography

**Display / headings:** Sora (700–800). Tight `letter-spacing: -0.02em`. Used for section titles, card titles, large numbers.

**Body / UI:** DM Sans (300–600). Used for everything else — nav, body copy, buttons, labels, captions.

**Logo wordmark:** DM Sans 300, `letter-spacing: 0.36em`, uppercase. Deliberately thin — refined, not bold.

**Overlines / labels:** 10px, DM Sans 600, `letter-spacing: 0.3–0.4em`, uppercase. These precede section headings and act as visual anchors.

**Scale:**
- Hero display: `clamp(64px, 10vw, 132px)`
- Section headings: `clamp(32px, 4vw, 54px)`, Sora 700
- Card titles: 22px, Sora 700
- Body: 15–18px, DM Sans 400, `line-height: 1.75–1.82`
- Small labels: 9–11px, DM Sans 600, uppercase

---

## Glass panels

The main surface treatment. Used for cards, modals, stat blocks, any "floating" UI element.

```css
background: rgba(255,255,255, 0.040);
backdrop-filter: blur(28px);
border: 1px solid rgba(255,255,255, 0.082);
border-radius: 16px;  /* cards */
border-radius: 20–24px;  /* larger containers */
```

Every glass panel gets a **top-left light leak** via a `::before` pseudo-element:

```css
::before {
  content: '';
  position: absolute; inset: 0; border-radius: inherit;
  background: linear-gradient(135deg, rgba(255,255,255,0.055) 0%, transparent 55%);
  pointer-events: none;
}
```

Cards with a coloured accent get a 2px **bottom accent bar**:

```css
position: absolute; bottom: 0; left: 0; right: 0; height: 2px;
background: linear-gradient(90deg, {accent}00, {accent}80, {accent}00);
```

---

## Corners and shapes

- **Cards / panels:** `border-radius: 12–24px` depending on size. Never sharp, never pill.
- **Buttons:** `border-radius: 6px`. Slightly rounded rectangle. Not pill (`border-radius: 100px`) and not square (`border-radius: 0`). This is a hard rule — pill buttons only acceptable for tiny status badges or domain pills.
- **Full-page sections:** No border-radius. Sections bleed edge-to-edge.
- **Input fields:** `border-radius: 8px`.
- **Badges / tags:** `border-radius: 4–6px` for rectangular tags. `border-radius: 999px` only for domain pills and tiny status dots.
- **Icons:** `border-radius: 13px` for icon containers.

---

## Buttons

**Primary:**

```css
background: rgba(61,123,212, 0.18);
border: 1px solid rgba(61,123,212, 0.52);
border-radius: 6px;
color: #c8e4ff;
font-family: DM Sans; font-size: 13px; font-weight: 600; letter-spacing: 2px;
```
Has a `::after` shine overlay: `linear-gradient(135deg, rgba(255,255,255,0.09), transparent 55%)`.
Hover: brighter background + border, `translateY(-2px)`, blue glow `box-shadow`.

**Secondary / ghost:**

```css
background: transparent;
border: 1px solid rgba(255,255,255, 0.1);
border-radius: 6px;
color: rgba(240,244,255, 0.58);
```
Hover: faint background, brighter border and text, `translateY(-1px)`.

---

## Interactive elements

**TiltCard — the signature interaction.** All floating cards respond to mouse movement with a subtle 3D tilt (`rotateX`/`rotateY` max ±9°, `perspective: 900px`, `scale(1.025)`). Implemented via `requestAnimationFrame` with lerp — no React state updates. On hover: coloured `box-shadow` ring matching the card's accent. On leave: springs back to flat.

**Icon hover:** Icon containers scale up with a spring easing (`cubic-bezier(0.34,1.56,0.64,1)`) on parent hover — `scale(1.14) translateY(-3px)`.

**Nav links:** Colour transitions `0.2s`. No underlines in default state.

**Footer links:** Dim at rest (`rgba(240,244,255,0.32)`), brighten on hover (`0.78`).

**Stat cells:** `translateY(-5px)` on hover + glow on the number via `text-shadow`.

---

## Ambient depth layers (for pages with full-screen sections)

Three fixed atmospheric elements sit behind all content:

1. **Top-right purple orb:** 680px blurred radial, `rgba(112,80,184,0.11)`, slow breathe animation.
2. **Bottom-left green orb:** 760px blurred radial, `rgba(42,158,88,0.06)`, slower breathe.
3. **Dot grid:** `radial-gradient` repeating pattern, `rgba(255,255,255,0.02)` at 28px spacing, fixed.

These are always `position: fixed`, `pointer-events: none`, `z-index: 0`. They provide environmental depth without being distracting.

---

## Scroll reveal animations

Four semantic reveal variants — assigned via `data-reveal` attribute:

| Variant | Entry | Duration | Easing | Use for |
| ------- | ----- | -------- | ------ | ------- |
| (base) | `translateY(110px)` + `blur(4px)` | 1.8s | `(0.16,1,0.3,1)` | Containers, generic blocks |
| `"heading"` | `translateY(140px)` | 2.2s | `(0.16,1,0.3,1)` | Section headings |
| `"card"` | `translateY(100px) scale(0.95)` | 2.0s | `(0.22,1.1,0.36,1)` | Cards, CTA blocks |
| `"label"` | `translateX(-72px)` | 1.6s | `(0.16,1,0.3,1)` | Overlines, section labels |
| `"stat"` | `translateY(70px)` | 1.5s | `(0.34,1.4,0.64,1)` | Numbers, stats (spring overshoot) |

All triggered by `IntersectionObserver` at `rootMargin: '0px 0px -4% 0px'` — elements reveal when comfortably inside the viewport. Card stagger: `data-delay={i * 120}` (120ms between items).

---

## Artistic sections

Not every section should be a uniform card grid. At least one section per page should break the pattern in a way that feels purposeful:

- The **workflow section** in the landing page is full-bleed dark (`#060810`), edge-to-edge width, with alternating left/right layouts, giant ghost numbers, animated divider lines, and staggered child reveals. It visually "resets" the pacing between card-heavy sections.
- Consider: **timeline** layouts, **split** layouts with large typographic accents, **table** layouts with glowing row hovers, **command-line / terminal** aesthetic blocks for technical content.

The principle: data and information sections can be grids; process, story, and feature-depth sections should have a distinct visual identity.

---

## Spacing rhythm

- Section vertical padding: `100px` top/bottom (desktop), `60px` (mobile)
- Max content width: `1240px`, centred
- Card gaps: `16px`
- Section padding horizontal: `48px` (desktop), `32px` (tablet), `20px` (mobile)

---

## What not to do

- No emoji in UI copy or labels. Geometric Unicode symbols (⬡ ◈ ⊛) are acceptable as functional icons only when no SVG alternative exists.
- No pill buttons for primary/secondary actions.
- No fully opaque backgrounds on nav or floating panels — glass must let depth through.
- No gradients on heading text that look "AI-generated" (blue-to-purple). Heading text is solid `#f0f4ff` or white with a subtle `text-shadow` glow.
- No `overflow: hidden` on elements with `position: sticky` children — use `overflow: clip` or remove it.
- No `transform-style: preserve-3d` on elements that need `overflow: hidden` — these are mutually exclusive.
- No `cursor: pointer` on static display cards.
- No `border-radius: 0` on buttons. No `border-radius: 9999px` on buttons.
- No generic system fonts. Sora + DM Sans only.
- No "prototype" or "beta" language in copy unless explicitly status-driven.
