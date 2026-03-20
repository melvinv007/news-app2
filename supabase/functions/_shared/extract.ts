/**
 * supabase/functions/_shared/extract.ts
 * Article extraction for Edge Functions — pure fetch + regex, no jsdom.
 */

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { logger } from './logger.ts';

export async function extractArticle(
  url: string,
  supabase: SupabaseClient,
): Promise<string | null> {
  const log = logger(supabase, 'extractor');

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)' },
    });
    clearTimeout(timeout);

    if (!res.ok) return null;

    const html = await res.text();

    // Remove scripts, styles, nav, footer, ads
    const cleaned = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[\s\S]*?<\/footer>/gi, '')
      .replace(/<header[\s\S]*?<\/header>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim();

    if (cleaned.length < 100) return null;

    // Return first 3000 chars — enough for Gemini summarization
    return cleaned.slice(0, 3000);

  } catch (err: unknown) {
    const isTimeout = err instanceof Error && err.name === 'AbortError';
    await log.warn(
      isTimeout ? 'Article fetch timed out' : 'Article extraction error',
      { url, error: String(err) }
    );
    return null;
  }
}