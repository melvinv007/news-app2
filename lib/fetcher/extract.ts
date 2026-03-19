/**
 * lib/fetcher/extract.ts
 * ─────────────────────────────────────────────────────────────────
 * Extracts full article text using Mozilla Readability + jsdom.
 * Same engine as Firefox Reader Mode — strips ads, nav, sidebars.
 * Returns null on failure — callers show summary only + "Read on [Source]" link.
 *
 * Used by: Edge Functions
 * NOTE: In Edge Functions, import via esm.sh:
 *   import { JSDOM } from 'https://esm.sh/jsdom@22.1.0';
 *   import { Readability } from 'https://esm.sh/@mozilla/readability@0.5.0';
 */

import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import type { SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

export async function extractArticle(
  url: string,
  supabase: SupabaseClient,
): Promise<string | null> {
  const log = logger(supabase, 'extractor');

  try {
    // 10 second timeout — slow articles should not block the pipeline
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)' },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      await log.warn(`Article fetch failed: HTTP ${res.status}`, { url });
      return null;
    }

    const html = await res.text();
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article?.textContent) {
      await log.warn('Readability extraction failed', { url });
      return null;
    }

    // Clean up whitespace
    return article.textContent.replace(/\s+/g, ' ').trim();

  } catch (err: unknown) {
    const isTimeout = err instanceof Error && err.name === 'AbortError';
    await log.warn(
      isTimeout ? 'Article fetch timed out' : 'Article extraction error',
      { url, error: String(err) }
    );
    return null;
  }
}
