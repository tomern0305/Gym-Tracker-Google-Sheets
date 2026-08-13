---
name: quiet-luxury-mobile-ui
description: Design principles, typography, color palette, touch-target guidelines, and component patterns for building a state-of-the-art Quiet Luxury / Old Money mobile web UI in React & Tailwind CSS.
---

# Quiet Luxury Mobile UI Skill & Guidelines

This skill defines the visual architecture, typography, color palette, and mobile UX standards for the Gym Tracker web application.

---

## 1. Design System & Aesthetics (Old Money / Quiet Luxury)

Warm parchment and leather brown, in a **light** theme. No gold, no neon, no
glassmorphism. Restraint plus one confident serif is the whole look.

### Color Palette (No Gold, No Tacky Neon)

Never write these hex values in a component. They are defined once as
`@theme` tokens in `src/index.css`; use the generated utilities
(`bg-page`, `text-ink`, `border-line`, `bg-accent`, `text-on-accent`, …).

| Token | Hex | Use |
|---|---|---|
| `page` | `#EFE9DE` | the page itself |
| `surface` | `#F8F4EC` | cards lifted off the page |
| `raised` | `#FDFBF7` | inputs, sheets, topmost surfaces |
| `tint` | `#E7DECF` | neutral chips, inactive fills |
| `ink` | `#2A2018` | primary text — 13.2:1 on page |
| `ink-soft` | `#6A5A49` | secondary text — 5.5:1 |
| `ink-faint` | `#75624B` | tertiary text — 4.8:1 |
| `line` / `line-strong` | `#E0D6C6` / `#CDBFA9` | hairlines, separators |
| `accent` / `accent-deep` | `#6B4A32` / `#513525` | chestnut: the single brand colour |
| `on-accent` | `#FBF7F0` | text on chestnut — 7.4:1 |
| `moss` | `#525F41` | completed / cardio semantics only |
| `oxblood` | `#8A3B2E` | destructive only |

Every foreground token clears WCAG AA (4.5:1) on every surface it is allowed to
sit on, including over its own 15% tint. Verify before introducing a new one.

### Surfaces
- `.card` / `.card-raised` — cream surface, 1px `line` border, barely-there shadow.
- `.chrome` — the fixed header and tab bar: 82% page colour over a blur.
- `.rule-fade` — hairline that fades to nothing; the one flourish.
- `.eyebrow` — 11px, 600, `0.18em` tracking, uppercase. The old-money tell.

---

## 2. Typography & Fonts

Loaded in `index.html` with `display=swap`.

- **Editorial Headers**: *Playfair Display*, 400–500 weight. Large and calm — size carries the emphasis, not weight.
- **Interface Body**: *Inter* for labels, buttons, and running text.
- **Metrics**: *JetBrains Mono* with `tabular-nums` (`.tabular`) for weights, reps, timers, and calendar numerals so digits never shift as they change.

---

## 3. Mobile UX & Ergonomics ("Thumb-First")

- **Touch Target Size**: Minimum `48px x 48px` interactive areas for all buttons, set checkmarks, and exercise cards.
- **Bottom Drawers & Action Sheets**: Use bottom-anchored modal sheets for logging sets, selecting exercises, and picking workout templates so all controls are easily reached by one thumb.
- **Micro-Interactions & Haptics**: Smooth 150ms-250ms cubic-bezier transitions for card taps, completion checkmarks, and tab switching.
- **Offline & Loading States**: Clean skeletal pulse placeholders (never jarring loading spinners).

---

## 4. Component Patterns

- **Daily Calendar Badge**: Subtle pill shape with solid Muted Sage fill for completed days, soft stroke outline for today.
- **Set Logging Card**: Clear numerical input step buttons (`-` and `+`) with inline previous session benchmark chips (`Prev: 80kg x 8`).
- **Cardio Tracker**: Dedicated timer pill with start/pause control and dual slider/inputs for Resistance and Duration.
