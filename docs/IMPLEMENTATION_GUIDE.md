# Personal News App — Implementation Guide v3
> **Complete specification. All decisions made. Follow exactly.**
> **If anything is unclear — ASK THE USER before proceeding.**
> This project has specific constraints (free tiers, no credit card, personal use only).

---

## 1. What This App Does

A personal, AI-powered news dashboard for ONE user only. Features:
- Pulls from 47 RSS feeds across 10 categories
- AI distills every article to facts only (no padding, no clickbait)
- Deduplicates stories across sources (5 outlets = 1 card)
- Learns from reading behaviour to personalise World News feed
- Tracks custom topics/people/companies (watchlist)
- Live stock prices (India + US)
- Sports: Cricket, Football (EPL/UCL live), F1 standings + calendar
- Self-monitoring health dashboard
- Zero ads, zero tracking, zero credit cards

---

## 2. Tech Stack — FINAL, DO NOT CHANGE

| Layer | Technology | Why |
|---|---|---|
| Frontend | Next.js 14 App Router | SSR, next/font, best DX |
| Hosting | Vercel Hobby | Free, no card, GitHub deploy |
| Database | Supabase PostgreSQL + pgvector(768) | Free, Realtime, Auth all-in-one |
| Auth | Supabase Auth + Google OAuth | Passwordless, no card |
| Realtime | Supabase Realtime | Built-in, 2M messages/month free |
| Backend | Supabase Edge Functions (Deno/TypeScript) | 500K invocations/month free |
| Scheduling | cron-job.org | Free, no card — replaces Vercel Cron (1/day limit) AND pg_cron (paid) |
| AI primary | Gemini 2.5 Flash | Best quality, 1500 req/day free |
| AI fallback | Gemini 1.5 Flash | Same API key, separate quota |
| AI fast | Groq llama-3.1-8b-instant | 14,400 req/day, ultra-fast |
| Embeddings | Gemini text-embedding-004 | Same API key, 768-dim, reliable |
| RSS | rss-parser (npm) | Battle-tested |
| Article extraction | @mozilla/readability + jsdom | Firefox Reader Mode engine |
| Styling | Tailwind CSS | Dark mode, responsive |
| UI Primitives | Radix UI (@radix-ui/react-dialog, react-tooltip, react-dropdown-menu) | Accessible, unstyled — we style with Tailwind |
| Icons | lucide-react | Consistent, tree-shakeable, MIT licensed |
| Animation | Framer Motion | Rich spring animations |
| Fonts | Google Fonts via next/font | Lora + Bricolage Grotesque + DM Sans + JetBrains Mono |

### REJECTED — Never suggest these:
- ❌ Vercel Cron — 1 job/day on free tier
- ❌ pg_cron — paid on Supabase free tier
- ❌ HuggingFace Inference — cold starts break 150s Edge Function limit
- ❌ Cohere — 1,000 calls/month total on free tier
- ❌ Python backend — no viable free hosting without credit card
- ❌ Railway/Render/Fly.io — require credit card
- ❌ External vector DBs — Supabase pgvector covers this free

---

## 3. UI/UX Specification — COMPLETE

### 3.1 Design System

**Fonts:**
| Use | Font | Tailwind class |
|---|---|---|
| Article summaries + body text | Lora (serif) | `font-serif` |
| Headlines | Bricolage Grotesque | `font-display` |
| UI chrome (nav, labels, timestamps, buttons) | DM Sans | `font-sans` |
| Stock prices + numbers | JetBrains Mono | `font-mono` |

**Colors (Stone dark palette):**
```css
--bg-primary:    #1c1917  /* Main background */
--bg-secondary:  #292524  /* Cards, panels */
--bg-tertiary:   #44403c  /* Hover states, borders */
--text-primary:  #fafaf9  /* Headlines */
--text-secondary:#d6d3d1  /* Body, summaries */
--text-muted:    #78716c  /* Timestamps, labels */
--accent:        #f59e0b  /* Amber — likes, active, badges */
--accent-subtle: #451a03  /* Amber dark — accent backgrounds */
--error:         #ef4444
--success:       #22c55e
```

**Spacing scale (Tailwind):**
- Card padding: `p-4` (mobile) / `p-5` (desktop)
- Card gap: `gap-4` (mobile) / `gap-5` (desktop)
- Section padding: `px-4 py-6` (mobile) / `px-6 py-8` (desktop)
- Sidebar width: `w-16` (collapsed icon-only) / `w-64` (expanded)

**Border radius:** `rounded-xl` for cards, `rounded-lg` for buttons, `rounded-full` for badges/chips

**Shadows:** `shadow-lg` for cards, `shadow-2xl` for panels and modals

### 3.2 Layout

**Desktop:**
```
┌─────────────────────────────────────────────────────┐
│ [Sidebar w-16/w-64 collapsible] │ [Main content]    │
│  ↑ fixed left, full height      │  2-column card grid│
│  icons only when collapsed      │                   │
│  hover/click to expand          │                   │
└─────────────────────────────────────────────────────┘
```

**Mobile:**
```
┌───────────────────────────────┐
│         [Main content]        │
│      1-column card feed       │
│                               │
├───────────────────────────────┤
│  [Bottom tab bar — fixed]     │
│  World India Sports AI Stocks │
└───────────────────────────────┘
```

**Sidebar items (in order):**
World, India, Mumbai, AI/Tech, Business, Sports, Stocks, Watchlist, Settings

**Bottom nav items (mobile — 5 most used):**
World, India, Sports, AI/Tech, Settings

**Sidebar behaviour:**
- Default: collapsed (icons only, w-16)
- Click hamburger or any icon to expand (w-64, shows labels)
- State persisted in localStorage
- Smooth spring animation on expand/collapse (Framer Motion)
- Active section highlighted with amber accent + subtle bg

### 3.3 Article Cards

**Card layout (2-column grid on desktop, 1-column on mobile):**
```
┌────────────────────────────────────────────────────┐
│ [Source logo 20px] [Source name] • [time ago]      │
│ [🔄 Updated] [📌 Watchlist match badges]           │
├────────────────────────────────────────────────────┤
│ HEADLINE (Bricolage Grotesque, text-lg font-bold)  │
│ Max 2 lines, truncated with ellipsis               │
├────────────────────────────────────────────────────┤
│ [Thumbnail — only if settings.show_thumbnails=true]│
│ h-40 object-cover rounded-lg                       │
├────────────────────────────────────────────────────┤
│ Summary (Lora serif, text-sm, text-secondary)      │
│ Max 2 lines, truncated — this is the key info      │
├────────────────────────────────────────────────────┤
│ [Stock badge TATAMOTORS ▲2.1%] [tag] [tag]        │
├────────────────────────────────────────────────────┤
│  👍  👎  ✓ Read  📌 Track  │  3 sources ›         │
└────────────────────────────────────────────────────┘
```

**Card interaction states:**
- Default: bg-secondary
- Hover: bg-tertiary, subtle scale(1.01) with spring animation
- Read: opacity-60, slightly muted
- Has update: amber left border (border-l-2 border-accent)

**Card click:** Anywhere on card body (not action buttons) opens Reading Mode

### 3.4 Reading Mode

Built on @radix-ui/react-dialog — gives free focus trapping, ESC to close, screen reader support.
Slide-in panel from the right. Desktop: w-1/2 max-w-2xl. Mobile: full screen.
Backdrop blur + dark overlay on the feed behind it.

```
┌───────────────────────────────────────────────────┐
│ ← Back                           [Open Original ↗]│
│                                                   │
│ HEADLINE (Bricolage, text-2xl)                    │
│ [Source] • [Date] • [Est. read time]              │
│ [Thumbnail if settings.show_thumbnails = true]    │
│                                                   │
│ ▌ SUMMARY                   ← amber left border  │
│   Distilled 3-4 sentence facts.   (Lora, larger) │
│   Everything you need, nothing extra.             │
│                                                   │
│ ─────────────────────────────────────────────     │
│                                                   │
│ FULL ARTICLE                                      │
│ Cleaned text. All padding removed. (Lora)         │
│                                                   │
│ ─────────────────────────────────────────────     │
│                                                   │
│ STORY TIMELINE  (only if source_count >= 2)       │
│ ● Day 1 — Initial report (BBC)                    │
│ ● Day 2 — Update (Reuters)                        │
│ ● Today — Latest (The Hindu)                      │
│                                                   │
│ COVERED BY                                        │
│ [BBC] [Reuters] [Al Jazeera] +2 more              │
└───────────────────────────────────────────────────┘
```

**Read timer:** useRef(Date.now()) on open, POST to /api/interactions on unmount.

### 3.5 Loading States

**Shimmer skeleton cards** while articles load:
- Same dimensions as real cards
- Shimmer animation (gradient sweep left-to-right)
- Show 4 skeleton cards in 2-column grid
- Fade in real cards when loaded (Framer Motion stagger)

**Spinner:** Used for single actions (like/dislike button, adding watchlist topic)
- Small (w-4 h-4) amber spinner
- Replaces button content while action is pending

### 3.6 Empty States

When no articles are available:
```
┌────────────────────────────────┐
│                                │
│   📰  (icon)                   │
│                                │
│   No articles yet              │
│   ───────────────              │
│   [4 skeleton card outlines]   │
│   Check back soon              │
│                                │
└────────────────────────────────┘
```

The skeleton outlines give visual structure even when empty.

### 3.7 Animations (Framer Motion)

**Card entrance:** Stagger fade-in + slight y-translate on page load
```typescript
// Each card animates in with 0.05s delay between cards
initial={{ opacity: 0, y: 8 }}
animate={{ opacity: 1, y: 0 }}
transition={{ type: 'spring', stiffness: 400, damping: 30 }}
```

**Sidebar expand/collapse:**
```typescript
// Spring animation for smooth feel
transition={{ type: 'spring', stiffness: 300, damping: 30 }}
```

**Reading Mode slide-in:**
```typescript
initial={{ x: '100%' }}
animate={{ x: 0 }}
exit={{ x: '100%' }}
transition={{ type: 'spring', stiffness: 300, damping: 30 }}
```

**Action button feedback:**
```typescript
// Micro-interaction on like/dislike
whileTap={{ scale: 0.9 }}
transition={{ type: 'spring', stiffness: 400, damping: 20 }}
```

**New article pop-in (Realtime):**
```typescript
// New cards slide down from top with spring
initial={{ opacity: 0, y: -20, scaleY: 0.95 }}
animate={{ opacity: 1, y: 0, scaleY: 1 }}
```

### 3.8 Typography Scale

```
Headlines (card):      font-display text-base font-semibold leading-snug
Headlines (reading):   font-display text-2xl font-bold leading-tight
Summary (card):        font-serif text-sm text-secondary leading-relaxed (2 lines)
Summary (reading):     font-serif text-base text-primary leading-relaxed
Full article:          font-serif text-sm text-secondary leading-relaxed
Source chip:           font-sans text-xs font-medium
Timestamps:            font-sans text-xs text-muted
Topic tags:            font-sans text-xs
Stock prices:          font-mono text-sm font-medium
Nav labels:            font-sans text-sm font-medium
Section headers:       font-display text-xl font-bold
```

### 3.9 Interactive States

**Buttons:** amber bg, dark text. Hover: slightly lighter. Active: scale 0.97.
**Links in nav:** Default muted, hover accent, active accent + bg-tertiary pill
**Checkboxes/toggles:** Custom amber accent style
**Inputs:** bg-tertiary, text-primary, accent focus ring, rounded-lg

---

## 4. One-Time Service Setup

All free, no credit card required.

### 4.1 Supabase
1. https://supabase.com → Sign up (email)
2. New project → Name: `news-app` → Region: `Southeast Asia (Singapore)`
3. Settings → API → save: Project URL, anon key, service_role key
4. Database → Extensions → Enable `vector`

### 4.2 Google AI Studio (Gemini)
1. https://aistudio.google.com → sign in → Get API Key → Create
2. One key: Gemini 2.5 Flash + 1.5 Flash + text-embedding-004
3. Limits: 1,500 req/day per model (reset midnight Pacific)

### 4.3 Groq
1. https://console.groq.com → sign up → API Keys → Create
2. Limit: 14,400 req/day llama-3.1-8b-instant (reset midnight UTC)

### 4.4 Google Cloud Console (OAuth)
1. https://console.cloud.google.com → New project: `news-app-auth`
2. APIs & Services → OAuth consent screen:
   - External, App name: `My News`, add your email as test user
3. Credentials → Create → OAuth Client ID → Web application
   - JS origins: `http://localhost:3000` (add Vercel URL after deploy)
   - Redirect URI: `https://YOUR_REF.supabase.co/auth/v1/callback`
4. Copy Client ID + Secret
5. Supabase → Authentication → Providers → Google → Enable → paste both → Save

**IMPORTANT — If Google OAuth shows "Unsupported provider" error:**
The Supabase UI sometimes fails to save credentials. Use the Management API:
```powershell
$headers = @{ "Authorization" = "Bearer YOUR_SUPABASE_ACCESS_TOKEN"; "Content-Type" = "application/json" }
$body = '{"external_google_enabled":true,"external_google_client_id":"YOUR_CLIENT_ID","external_google_secret":"YOUR_CLIENT_SECRET"}'
Invoke-RestMethod -Uri "https://api.supabase.com/v1/projects/YOUR_PROJECT_REF/config/auth" -Method PATCH -Headers $headers -Body $body
```
Get access token: https://supabase.com/dashboard/account/tokens

### 4.5 football-data.org
1. https://www.football-data.org/client/register → email
2. Copy API key. FREE: Premier League + Champions League ONLY.

### 4.6 cron-job.org
1. https://cron-job.org → sign up. Configure jobs AFTER Edge Functions deploy.

### 4.7 Vercel
1. https://vercel.com → sign up with GitHub. Deploy in final step.

### Environment Variables (.env.local)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GEMINI_API_KEY=your-gemini-key
GROQ_API_KEY=your-groq-key
FOOTBALL_DATA_API_KEY=your-football-key
CRON_SECRET=your-random-secret-32-chars
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 5. Database Schema

Run `supabase/migrations/001_initial_schema.sql` in Supabase → SQL Editor.

**Key tables:**
- `articles` — all news articles with 768-dim embeddings
- `story_sources` — multiple sources per clustered story
- `user_interactions` — like/dislike/read/track actions
- `user_profile` — single-row preference vector (768-dim)
- `user_watchlist` — custom tracked topics/people/companies
- `stock_watchlist` — custom stock tickers
- `system_logs` — health dashboard data
- `user_preferences` — settings (thumbnails, source toggles, custom prompts)

**SQL Functions:**
- `get_recommended_articles(category, limit)` — pgvector cosine similarity ranked feed
- `update_preference_vector(embedding, weight)` — updates preference vector on interaction
- `increment(x)` — helper for source_count updates

**RLS:** Run AFTER first login. Get UUID from Supabase → Authentication → Users.

---

## 6. File Structure

```
news-app/
├── .env.local                    # Secrets — gitignored
├── .env.example                  # Template
├── .gitignore
├── middleware.ts                 # Auth protection for all routes
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
│
├── .github/
│   ├── copilot-instructions.md  # Auto-loaded on every Copilot request
│   └── instructions/
│       ├── edge-functions.instructions.md
│       └── components.instructions.md
│
├── config/
│   ├── sources.ts               # All 47 RSS URLs — ONLY place to add/edit sources
│   ├── ai.ts                    # Model assignments + all prompts
│   ├── cron.ts                  # Fetch intervals (documents cron-job.org settings)
│   ├── dedup.ts                 # Similarity thresholds per category
│   └── sports.ts                # F1 calendar (update December) + football IDs
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts            # Frontend browser client (anon key)
│   │   ├── server.ts            # Server-side client (anon key + SSR cookies)
│   │   └── types.ts             # TypeScript types matching DB schema exactly
│   ├── ai/
│   │   ├── gemini.ts            # Summarize, embed, watchlist confirm, why-this
│   │   └── groq.ts              # Fingerprint, keyword match, ticker match
│   ├── fetcher/
│   │   ├── rss.ts               # RSS parsing + URL dedup
│   │   ├── extract.ts           # Readability article extraction
│   │   ├── dedup.ts             # TF-IDF story fingerprint matching
│   │   └── watchlist-match.ts  # Keyword + Gemini confirm
│   ├── recommendation/
│   │   └── vectors.ts           # Preference vector update logic + weights
│   ├── stocks/
│   │   └── yahoo.ts             # Yahoo Finance + market hours (IST-aware)
│   ├── sports/
│   │   ├── football.ts          # football-data.org (EPL + UCL only)
│   │   └── f1.ts                # F1 calendar helpers + countdown
│   └── logger.ts                # Writes to system_logs table
│
├── supabase/
│   ├── functions/
│   │   ├── fetch-world/index.ts      # World + India + Mumbai (20 min)
│   │   ├── fetch-sports/index.ts     # All sports categories (20 min)
│   │   ├── fetch-aitech/index.ts     # AI/Tech only (10 min — fastest)
│   │   ├── fetch-business/index.ts   # Business + Stocks news (20 min)
│   │   └── process-embeddings/index.ts # Async embedding queue (5 min)
│   └── migrations/
│       └── 001_initial_schema.sql
│
├── app/
│   ├── layout.tsx               # Root: fonts, metadata
│   ├── page.tsx                 # Redirects to /world
│   ├── globals.css              # CSS variables + Tailwind
│   ├── (auth)/
│   │   ├── login/page.tsx       # Google OAuth button
│   │   └── auth/callback/route.ts # Exchange code for session
│   └── (app)/                   # All protected routes
│       ├── layout.tsx           # App shell: Sidebar + BottomNav
│       ├── world/page.tsx       # Personalised feed (pgvector)
│       ├── india/page.tsx
│       ├── mumbai/page.tsx
│       ├── ai-tech/page.tsx
│       ├── business/page.tsx
│       ├── sports/
│       │   ├── layout.tsx       # Sub-tabs: Cricket/Football/F1/Others
│       │   ├── cricket/page.tsx
│       │   ├── football/page.tsx
│       │   ├── f1/page.tsx
│       │   └── others/page.tsx
│       ├── stocks/page.tsx      # India + US tabs
│       ├── watchlist/page.tsx
│       └── settings/
│           ├── page.tsx         # Health dashboard
│           ├── sources/page.tsx
│           ├── prompts/page.tsx
│           └── users/page.tsx
│
├── app/api/
│   ├── interactions/route.ts    # POST: log interaction + update preference vector
│   ├── watchlist/route.ts       # POST/GET/DELETE: watchlist management
│   ├── why-this/route.ts        # GET: generate/return "why am I seeing this"
│   └── admin/users/route.ts     # GET/DELETE: user management (service_role)
│
└── components/
    ├── Layout/
    │   ├── Sidebar.tsx          # Desktop — collapsible, icon-only when collapsed
    │   ├── BottomNav.tsx        # Mobile — bottom tab bar
    │   └── SectionHeader.tsx
    ├── ArticleCard/
    │   ├── index.tsx            # Card: headline + 2-line summary + source
    │   ├── ActionBar.tsx        # Like/Dislike/Read/Track buttons
    │   ├── SourceChip.tsx       # Source logo + name
    │   └── StockBadge.tsx       # Ticker + price chip
    ├── ArticleGrid/
    │   ├── index.tsx            # 2-col desktop / 1-col mobile grid
    │   └── SkeletonCard.tsx     # Shimmer loading placeholder
    ├── ReadingMode/
    │   ├── index.tsx            # Slide-in panel (Framer Motion)
    │   ├── Summary.tsx          # Amber left border, Lora
    │   ├── FullArticle.tsx      # Cleaned text
    │   ├── StoryTimeline.tsx    # Only if source_count >= 2
    │   └── SourceList.tsx
    ├── WhyThisTooltip/ (Built on @radix-ui/react-tooltip — handles positioning so it never goes off-screen.)
    │   └── index.tsx            # Hover tooltip, DB cached
    ├── Watchlist/
    │   ├── WatchlistPanel.tsx
    │   └── AddTopicModal.tsx
    ├── Stocks/
    │   ├── StocksWidget.tsx
    │   ├── IndexCard.tsx
    │   ├── TickerRow.tsx
    │   └── MarketStatus.tsx
    ├── Sports/
    │   ├── FootballScores.tsx
    │   ├── F1Standings.tsx
    │   └── F1Calendar.tsx
    └── Settings/
        ├── HealthDashboard.tsx
        ├── ErrorLog.tsx
        ├── SourceManager.tsx
        ├── PromptViewer.tsx
        └── UserManager.tsx
```

---

## 7. AI System

### Model Assignments
| Task | Model | Notes |
|---|---|---|
| Story fingerprint | Groq llama-3.1-8b | Every article — must be fast |
| Watchlist first-pass | String match (no AI) | quickKeywordMatch in groq.ts |
| Stock ticker match | Groq llama-3.1-8b | Every article |
| Summarize + distill + clickbait | Gemini 2.5 Flash | Single JSON call, new stories only |
| Watchlist confirmation | Gemini 2.5 Flash | Only when keyword match found |
| "Why am I seeing this?" | Gemini 2.5 Flash | On hover, cached in articles.why_this |
| Watchlist keyword gen | Gemini 2.5 Flash | When user adds watchlist topic |
| Embeddings | text-embedding-004 | 768-dim, separate process-embeddings fn |

### Fallback Chain
```
Gemini 2.5 Flash → Gemini 1.5 Flash → null (graceful degrade)
```
null = article shows without summary. Retried next fetch cycle.

### Interaction Weights (preference vector)
```
like:        +0.15
dislike:     -0.08
read ≥60s:   +0.08
read 20-59s: +0.04
read <20s:   +0.01
dismiss:     -0.02
```
Formula: `pref_vec = l2_normalize(pref_vec + weight × article_embedding)`

### Recommendation Score
```
score = (0.55 × cosine_similarity(embedding, pref_vec))
      + (0.30 × recency_decay)
      + (0.15 × source_priority/10)
```
**Only World News is personalised.** All other sections = chronological.

---

## 8. Edge Function Rules

- **150-second timeout** on Supabase free tier
- Process sources **sequentially** — never `Promise.all` on sources
- Use **relative imports** not `@/` aliases (Deno doesn't resolve `@/`)
- Use `Deno.env.get('VAR')` not `process.env.VAR`
- Import npm packages via `https://esm.sh/PACKAGE@VERSION`
- Always check `x-cron-secret` header — return 401 if missing/wrong
- Always use `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS — intentional)
- Always log start + end + counts to `system_logs` via `lib/logger.ts`
- Always wrap in try/catch — never let Edge Functions crash silently

---

## 9. Coding Standards

### Every file must start with:
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
- Strict mode on. No `any`. Use `unknown` and narrow.
- Explicit return types on all exported functions.
- All DB types from `lib/supabase/types.ts`.

### Error Handling
- Edge Functions: never unhandled throw. Always try/catch. Always log.
- AI calls: primary → fallback → null → log. Never crash pipeline.
- Yahoo Finance: always return null on failure, never throw.
- Frontend: show user-friendly error state, never raw error messages.

### Components
- `'use client'` only where hooks/event handlers are actually used
- Server Components for data fetching where possible
- All interactions POST to `/api/` routes — never call Supabase directly from components (except for reads via `createClient()`)
- Framer Motion for all animations — no CSS transitions on interactive elements
- Icons: always use lucide-react — never inline SVG, never emoji for UI icons
- Dialogs/modals: use @radix-ui/react-dialog as base
- Tooltips: use @radix-ui/react-tooltip as base
- Dropdowns: use @radix-ui/react-dropdown-menu as base

---

## 10. Build Phase Checklist

**Already built in the zip (do not rebuild):**
- ✅ All `config/` files
- ✅ `lib/supabase/` (client, server, types)
- ✅ `lib/logger.ts`
- ✅ `lib/ai/` (gemini, groq)
- ✅ `lib/recommendation/vectors.ts`
- ✅ `lib/fetcher/` (rss, extract, dedup, watchlist-match)
- ✅ `lib/stocks/yahoo.ts`
- ✅ `lib/sports/` (football, f1)
- ✅ All `supabase/functions/`
- ✅ `supabase/migrations/001_initial_schema.sql`
- ✅ `middleware.ts`
- ✅ `app/layout.tsx`, `app/globals.css`, `app/page.tsx`
- ✅ `app/(auth)/login/page.tsx`
- ✅ `app/(auth)/auth/callback/route.ts`
- ✅ Project config files

**Build these next (in order):**
- [ ] Phase A: `app/(app)/layout.tsx` — app shell with Sidebar + BottomNav
- [ ] Phase B: `components/Layout/Sidebar.tsx` — collapsible, Framer Motion
- [ ] Phase C: `components/Layout/BottomNav.tsx` — mobile bottom tabs
- [ ] Phase D: `components/Layout/SectionHeader.tsx`
- [ ] Phase E: `components/ArticleCard/` — all 4 files
- [ ] Phase F: `components/ArticleGrid/` — grid + skeleton
- [ ] Phase G: `app/api/interactions/route.ts`
- [ ] Phase H: `app/(app)/world/page.tsx` — with pgvector recommendation query + Realtime
- [ ] Phase I: `app/(app)/india/`, `mumbai/`, `ai-tech/`, `business/` pages
- [ ] Phase J: `components/ReadingMode/` — all 5 files with Framer Motion slide-in
- [ ] Phase K: `components/WhyThisTooltip/` + `app/api/why-this/route.ts` (Built on @radix-ui/react-tooltip — handles positioning so it never goes off-screen.)
- [ ] Phase L: `app/(app)/sports/` — layout + all 4 sub-pages
- [ ] Phase M: `components/Sports/` — all 3 files
- [ ] Phase N: `lib/stocks/yahoo.ts` already done. `components/Stocks/` — all 4 files
- [ ] Phase O: `app/(app)/stocks/page.tsx`
- [ ] Phase P: `app/api/watchlist/route.ts` + `components/Watchlist/` + page
- [ ] Phase Q: `app/api/admin/users/route.ts`
- [ ] Phase R: `components/Settings/` — all 5 files (fully implemented, no empty useEffects)
- [ ] Phase S: `app/(app)/settings/` — all 4 pages
- [ ] Phase T: `public/manifest.json` + PWA setup
- [ ] Phase U: `npx tsc --noEmit` → fix all errors
- [ ] Phase V: `npm run build` → fix all errors
- [ ] Phase W: Deploy (Edge Functions → Vercel → cron-job.org → first login → RLS)

---

## 11. Settings & Health Dashboard — Full Spec

### Health Page (settings/page.tsx)
Fetches directly from Supabase `system_logs` table. Shows:

1. **Overall status** (Green/Yellow/Red):
   - Green: all sections fetched within 30 min
   - Yellow: any section not fetched in 30-60 min
   - Red: any section not fetched in 60+ min

2. **Last fetch per section** — query system_logs for latest 'info' log per source

3. **API usage bars** — show counts from today's logs (approximate)

4. **Error log** — last 20 logs, filterable by level, show plain English message

5. **Manual "Run fetcher now"** — POST to Edge Function URL with cron secret

6. **Maintenance alerts** — auto-generated from log patterns:
   - 3+ consecutive failures from same source → "⚠️ [Source] RSS may have changed"
   - Gemini fallback triggered → "ℹ️ Fell back to 1.5 Flash X times today"

### Source Manager (settings/sources/page.tsx)
- Load SOURCES from config, merge with user_preferences.disabled_sources and source_url_overrides
- Show each source: name, category badge, status dot, URL input (editable), enable toggle
- Save URL changes to user_preferences.source_url_overrides (jsonb)
- Save toggle changes to user_preferences.disabled_sources (text[])

### Prompt Viewer (settings/prompts/page.tsx)
- Load DEFAULT_PROMPTS from config/ai.ts
- Load custom overrides from user_preferences (custom_summary_prompt etc.)
- Show each prompt in a textarea (editable)
- Save button: update the specific column in user_preferences
- "Reset to default" button: set column to null

### User Manager (settings/users/page.tsx)
- Uses /api/admin/users route (service_role key — never in client)
- GET: list all users (id, email, created_at, last_sign_in_at)
- DELETE: remove user by id (only allow removing other users, not yourself)

---

## 12. Deployment

### Step 1 — Supabase CLI + Edge Functions
```bash
# Install (Windows): scoop install supabase
supabase login
supabase link --project-ref YOUR_PROJECT_REF

supabase secrets set \
  GEMINI_API_KEY=xxx \
  GROQ_API_KEY=xxx \
  FOOTBALL_DATA_API_KEY=xxx \
  CRON_SECRET=xxx \
  SUPABASE_URL=https://YOUR_REF.supabase.co \
  SUPABASE_SERVICE_ROLE_KEY=xxx

supabase functions deploy fetch-world
supabase functions deploy fetch-sports
supabase functions deploy fetch-aitech
supabase functions deploy fetch-business
supabase functions deploy process-embeddings
```

### Step 2 — Vercel
```bash
npm i -g vercel
vercel
# Copy deployment URL
vercel --prod
```

After deploy:
- Add Vercel URL to Vercel env vars: `NEXT_PUBLIC_APP_URL`
- Add Vercel URL to Google Cloud Console → Authorised JS origins

### Step 3 — cron-job.org (after Edge Functions deployed)
| Job | URL | Schedule | Header |
|---|---|---|---|
| fetch-world | `.../functions/v1/fetch-world` | `*/20 * * * *` | `x-cron-secret: YOUR_SECRET` |
| fetch-sports | `.../functions/v1/fetch-sports` | `*/20 * * * *` | same |
| fetch-aitech | `.../functions/v1/fetch-aitech` | `*/10 * * * *` | same |
| fetch-business | `.../functions/v1/fetch-business` | `*/20 * * * *` | same |
| process-embeddings | `.../functions/v1/process-embeddings` | `*/5 * * * *` | same |

Enable email on 3 consecutive failures.

### Step 4 — First Login + RLS Lock
1. Visit app → sign in with Google
2. Supabase → Authentication → Users → copy your UUID
3. Run RLS policies from migration (uncomment the block, replace UUID)

---

## 13. Troubleshooting

| Problem | Cause | Fix |
|---|---|---|
| Google OAuth "Unsupported provider" | Supabase UI bug — credentials not saved | Use Management API (Section 4.4) |
| No articles appearing | Edge Functions not deployed or cron not set up | Check Settings → Health |
| Articles without summaries | Gemini quota exceeded | Check AI status in Health dashboard |
| World News not personalising | Normal — needs ~20 interactions to build vector | Like/dislike/read to accelerate |
| Stock prices "Unavailable" | Yahoo Finance endpoint changed | Update URL in lib/stocks/yahoo.ts |
| Edge Function timeout | Too many sources in one function | Sequential processing only, never Promise.all |
| `@/` import errors in Edge Functions | Deno doesn't resolve @/ aliases | Use relative imports `../../lib/...` |
| `process.env` in Edge Functions | Deno uses Deno.env | Use `Deno.env.get('KEY')` |

---

*IMPLEMENTATION_GUIDE.md v3 — Complete. All decisions final.*
*If anything is unclear, ASK THE USER before changing anything.*
