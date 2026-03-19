/**
 * supabase/functions/_shared/logger.ts
 * Structured logger — writes to system_logs table in Supabase.
 */

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    console.error(`[Logger] Failed to write: ${message}`);
  }
}

export const logger = (supabase: SupabaseClient, source: string) => ({
  info:  (message: string, context?: Record<string, unknown>) =>
    log(supabase, 'info',    source, message, context),
  warn:  (message: string, context?: Record<string, unknown>, autoResolved = false) =>
    log(supabase, 'warning', source, message, context, autoResolved),
  error: (message: string, context?: Record<string, unknown>, autoResolved = false) =>
    log(supabase, 'error',   source, message, context, autoResolved),
});
