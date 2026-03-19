/**
 * lib/supabase/client.ts
 * ─────────────────────────────────────────────────────────────────
 * Frontend Supabase client. Used in React components and client-side code.
 * Uses anon key — subject to RLS policies.
 * NEVER use service_role key here.
 */

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/lib/supabase/types';

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
