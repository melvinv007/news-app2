---
applyTo: "components/**/*.tsx,app/**/*.tsx"
---

## Component Rules

- Add `'use client'` only when using hooks, event handlers, or browser APIs
- Use Tailwind utility classes only — no inline styles, no CSS modules
- Colors: CSS variables ONLY — `bg-[var(--bg-secondary)]` not `bg-[#292524]`
- Fonts: `font-serif` (Lora), `font-display` (Bricolage), `font-sans` (DM Sans), `font-mono` (JetBrains Mono)
- Dark mode only — no light mode, no theme toggle
- Animations: Framer Motion with spring transitions — no CSS transitions on interactive elements
- All write interactions POST to `/api/` routes — never write directly to Supabase from components
- Reading Mode opens as slide-in panel from right (desktop) / fullscreen (mobile)
- Story Timeline only renders when `source_count >= 2`
- Thumbnails: only show when `userPreferences.show_thumbnails === true`
- Loading: shimmer skeleton cards (not spinners for page load)
- Empty state: icon + message + 4 skeleton outlines
- Focus: `focus:outline-none focus:ring-2 focus:ring-[var(--accent)]`
