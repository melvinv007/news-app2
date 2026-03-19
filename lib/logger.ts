/**
 * lib/logger.ts
 * ─────────────────────────────────────────────────────────────────
 * Structured logger — writes to system_logs table in Supabase.
 * Used by Edge Functions and API routes.
 * Visible in app at Settings → Health Dashboard → Error Log.
 *
 * LEVELS:
 *   info    — normal operations, fetch completions
 *   warning — non-critical issues (RSS URL changed etc.)
 *   error   — failures that affected functionality
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export type LogLevel = 'info' | 'warning' | 'error';

export async function log(
  supabase: SupabaseClient,
  level: LogLevel,
  source: string,
  message: string,
  context?: Record<string, unknown>,
  autoResolved = false,
): Promise<void> {
  try {
    await supabase.from('system_logs').insert({
      level,
      source,
      message,
      context: context ?? null,
      resolved: autoResolved,
      auto_resolved: autoResolved,
    });
  } catch {
    // Logger must never crash the pipeline
    console.error(`[Logger] Failed to write: ${message}`);
  }
}

// Convenience factory — creates a logger bound to a source
export const logger = (supabase: SupabaseClient, source: string) => ({
  info:  (message: string, context?: Record<string, unknown>) =>
    log(supabase, 'info',    source, message, context),
  warn:  (message: string, context?: Record<string, unknown>, autoResolved = false) =>
    log(supabase, 'warning', source, message, context, autoResolved),
  error: (message: string, context?: Record<string, unknown>, autoResolved = false) =>
    log(supabase, 'error',   source, message, context, autoResolved),
});
