/**
 * supabase/functions/_shared/extract.ts
 * Article extraction for Edge Functions — jsdom + readability from esm.sh.
 */

import { JSDOM } from 'https://esm.sh/jsdom@22.1.0';
import { Readability } from 'https://esm.sh/@mozilla/readability@0.5.0';
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
