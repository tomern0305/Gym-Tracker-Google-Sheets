---
name: quiet-luxury-mobile-ui
description: Design principles, typography, color palette, touch-target guidelines, and component patterns for building a state-of-the-art Quiet Luxury / Old Money mobile web UI in React & Tailwind CSS.
---

# Quiet Luxury Mobile UI Skill & Guidelines

This skill defines the visual architecture, typography, color palette, and mobile UX standards for the Gym Tracker web application.

---

## 1. Design System & Aesthetics (Old Money / Quiet Luxury)

### Color Palette (No Gold, No Tacky Neon)
- **Background Base**: Deep Slate Obsidian (`#0F1317` / `hsl(210, 20%, 7%)`)
- **Surface Elevation**: Soft Charcoal Glass (`#171D22` / `hsl(210, 18%, 11%)`)
- **Primary Text**: Soft Warm Alabaster (`#F4F1EA` / `hsl(40, 25%, 94%)`)
- **Secondary Text**: Muted Warm Gray (`#9E9B93` / `hsl(43, 6%, 60%)`)
- **Subtle Borders**: Soft Warm Stroke (`rgba(244, 241, 234, 0.08)`)
- **Primary Accent (Active State)**: Muted Sage Green (`#6B8E78` / `hsl(143, 14%, 48%)`)
- **Secondary Accent (Cardio / Highlights)**: Muted Dusty Blue (`#5B7B88` / `hsl(198, 20%, 44%)`)
- **Destructive Action**: Muted Soft Brick Crimson (`#A85454` / `hsl(0, 33%, 49%)`)

---

## 2. Typography & Fonts

- **Editorial Headers**: *Playfair Display* or *Cormorant Garamond* (Serif elegance for month titles, workout routine headings, and metrics).
- **Interface & Metrics Body**: *Plus Jakarta Sans* or *Inter* (Crisp, clean geometric sans-serif for numbers, sets, reps, inputs, and button labels).

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
