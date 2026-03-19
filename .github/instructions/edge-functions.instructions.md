---
applyTo: "supabase/functions/**/*.ts"
---

## Edge Function Rules

Runtime is **Deno** — not Node.js. These rules are non-negotiable.

- Import Supabase: `import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'`
- Import npm packages via `https://esm.sh/PACKAGE@VERSION`
- Env vars: `Deno.env.get('KEY')` — NEVER `process.env.KEY`
- Local imports: relative paths ONLY — `../../lib/logger.ts` — NEVER `@/lib/logger`
- Auth: check `x-cron-secret` header FIRST, return 401 if missing/wrong
- DB client: use `SUPABASE_SERVICE_ROLE_KEY` — bypasses RLS (correct and intentional)
- Processing: sequential for-loops — NEVER `Promise.all` on sources (150s timeout)
- Always log start/end/counts via `logger()` from `../../lib/logger.ts`
- Always wrap main logic in try/catch — return `{ ok: false }` with status 500 on error
