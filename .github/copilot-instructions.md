# Copilot Instructions — Personal News App

## Critical Rule #1
**If anything is unclear, ambiguous, or seems like it should be done differently — ASK THE USER.**
Never make independent architectural decisions. Every choice was made for specific reasons.

## Critical Rule #2
**Read docs/IMPLEMENTATION_GUIDE.md fully before writing any code in a new session.**
It contains the complete spec including UI/UX details, all constraints, and known issues.

---

## What This Project Is
Personal AI news dashboard. Single owner only. No ads. AI distills articles to facts.
Learns from reading behaviour. Full spec in docs/IMPLEMENTATION_GUIDE.md.

---

## Tech Stack — Non-Negotiable

- **Frontend**: Next.js 14 App Router + Tailwind CSS + Framer Motion
- **Database**: Supabase PostgreSQL + pgvector(768)
- **Auth**: Supabase Auth + Google OAuth (passwordless)
- **Backend**: Supabase Edge Functions (Deno/TypeScript)
- **Scheduler**: cron-job.org (NOT Vercel Cron — 1/day limit. NOT pg_cron — paid)
- **AI primary**: Gemini 2.5 Flash (same key: 2.5 Flash + 1.5 Flash + text-embedding-004)
- **AI fallback**: Gemini 1.5 Flash (same API key, separate daily quota)
- **AI fast**: Groq llama-3.1-8b-instant (fingerprinting, keyword checks)
- **Animations**: Framer Motion — spring animations throughout
- **Fonts**: Lora (serif/body) + Bricolage Grotesque (display/headlines) + DM Sans (sans/UI) + JetBrains Mono (mono/numbers)

### Never suggest these (already evaluated and rejected):
- ❌ Vercel Cron, ❌ pg_cron, ❌ HuggingFace, ❌ Cohere
- ❌ Python backend, ❌ Railway/Render/Fly.io (require card)
- ❌ External vector DBs, ❌ OpenRouter/DeepSeek

---

## UI/UX Rules (from docs/IMPLEMENTATION_GUIDE.md Section 3)

### Layout
- **Desktop**: Collapsible sidebar (w-16 icons-only / w-64 with labels) + 2-column card grid
- **Mobile**: 1-column card feed + bottom tab bar (fixed, like Instagram)
- Sidebar default = collapsed. Spring animation on expand/collapse.

### Colors — always use CSS variables, never hardcode hex:
```
bg-[var(--bg-primary)]    bg-[var(--bg-secondary)]    bg-[var(--bg-tertiary)]
text-[var(--text-primary)] text-[var(--text-secondary)] text-[var(--text-muted)]
text-[var(--accent)]       bg-[var(--accent)]           bg-[var(--accent-subtle)]
```

### Font classes:
- `font-serif` → Lora (article summaries, full article body)
- `font-display` → Bricolage Grotesque (headlines, section titles)
- `font-sans` → DM Sans (UI chrome, buttons, labels, timestamps)
- `font-mono` → JetBrains Mono (stock prices, numbers)

### Article Cards
- Medium density: headline (2 lines max) + 2-line summary + source chip
- Hover: bg-tertiary + scale(1.01) spring animation
- Click card body → opens Reading Mode (slide-in panel from right)
- Cards load with shimmer skeleton → stagger fade-in (Framer Motion)

### Reading Mode
- Slide-in from right: w-1/2 max-w-2xl desktop, fullscreen mobile
- Framer Motion: `initial={{ x: '100%' }} animate={{ x: 0 }}`
- Summary section: amber left border (border-l-2 border-[var(--accent)])
- Story Timeline: only render if `source_count >= 2`
- Read timer: `useRef(Date.now())`, POST on unmount

### Loading States
- Shimmer skeleton cards (same dimensions as real cards)
- Small amber spinner for action buttons

### Empty States
- Icon + "No articles yet" message + 4 skeleton card outlines

### Animations (Framer Motion — always use spring type)
```typescript
// Card entrance stagger
initial={{ opacity: 0, y: 8 }}
animate={{ opacity: 1, y: 0 }}
transition={{ type: 'spring', stiffness: 400, damping: 30 }}

// Sidebar expand
transition={{ type: 'spring', stiffness: 300, damping: 30 }}

// Reading mode slide-in
initial={{ x: '100%' }} animate={{ x: 0 }}
transition={{ type: 'spring', stiffness: 300, damping: 30 }}

// Button tap
whileTap={{ scale: 0.9 }}
```

---

## Code Rules

### Every file must have JSDoc header:
```typescript
/**
 * [filename]
 * ─────────────────────────────────────────────────────────────────
 * What this does: [one paragraph]
 * How to change [main thing]: [specific instruction]
 * Used by: [callers]
 */
```

### TypeScript
- Strict mode. No `any`. Explicit return types on all exports.
- All DB types from `lib/supabase/types.ts`

### Components
- `'use client'` only where hooks/event handlers are actually used
- All write interactions POST to `/api/` routes
- Read data via `createClient()` from `@/lib/supabase/client`
- Never use service_role key in any component or client-side code

### Error handling
- Never unhandled throws in Edge Functions — always try/catch + log
- Always graceful degrade: null returns, never crashes

---

## Edge Function Rules (supabase/functions/**)

- Runtime: **Deno** — NOT Node.js
- Imports: `https://esm.sh/PACKAGE@VERSION` NOT node_modules
- Env vars: `Deno.env.get('KEY')` NOT `process.env.KEY`
- Imports: relative paths (`../../lib/logger.ts`) NOT `@/` aliases
- Auth: always check `x-cron-secret` header first, return 401 if wrong
- DB client: always `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS — correct for Edge Functions)
- Processing: **sequential** not `Promise.all` (150s timeout limit)
- Logging: always log start, end, counts via `logger()` from `../../lib/logger.ts`

---

## Key Behaviours — Preserve These

- **World News ONLY** uses personalised recommendation score. All others = chronological.
- **AI/Tech fetches every 10 min** — all others 20 min.
- **Mark as Read** hides article UNTIL `has_update = true`.
- **Story clusters**: same event from multiple sources = 1 card.
- **Null articles**: `is_null_article = true` → never shown in feed.
- **Watchlist**: string keyword check first, then Gemini confirmation (2-step).
- **Stock badges**: appear on cards when article.stock_tickers matches user's stock_watchlist.
- **Thumbnails**: OFF by default (source logo shown instead). ON = user preference setting.

---

## Settings Pages — Must Be Fully Implemented (no empty useEffects)

- **HealthDashboard**: query system_logs table directly via Supabase client
- **ErrorLog**: query system_logs, filter by level/source, mark resolved
- **SourceManager**: load SOURCES + user_preferences, save overrides to DB
- **PromptViewer**: load DEFAULT_PROMPTS + user_preferences custom prompts, save to DB
- **UserManager**: use /api/admin/users route (service_role), list + delete users

---

## Files Already Built in Zip (do not recreate)

config/, lib/ (all files), supabase/functions/ (all), supabase/migrations/,
middleware.ts, app/layout.tsx, app/globals.css, app/page.tsx,
app/(auth)/login/page.tsx, app/(auth)/auth/callback/route.ts,
package.json, tsconfig.json, next.config.js, tailwind.config.ts,
postcss.config.js, .gitignore, .env.example, docs/IMPLEMENTATION_GUIDE.md
