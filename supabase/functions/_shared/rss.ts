/**
 * supabase/functions/_shared/rss.ts
 * RSS feed parser for Edge Functions — uses esm.sh + relative imports.
 */

import Parser from 'https://esm.sh/rss-parser@3';
import type { NewsSource } from './sources.ts';
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { logger } from './logger.ts';

export type RSSItem = {
  title: string;
  link: string;
  contentSnippet: string;
  pubDate: string;
  source: string;
  category: string;
  enclosure?: { url: string };
};

const parser = new Parser({ timeout: 10000 });

export async function fetchFeed(source: NewsSource): Promise<RSSItem[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(source.url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      }
    });
    clearTimeout(timeout);

    if (!response.ok) return [];
    const xml = await response.text();
    const feed = await parser.parseString(xml);
    return (feed.items ?? []).map((item: any) => ({
      title: item.title?.trim() ?? '',
      link: item.link ?? item.guid ?? '',
      contentSnippet: item.contentSnippet?.trim() ?? item.summary?.trim() ?? '',
      pubDate: item.pubDate ?? item.isoDate ?? new Date().toISOString(),
      source: source.name,
      category: source.category,
      enclosure: item.enclosure ? { url: item.enclosure.url } : undefined,
    })).filter((item: any) => item.title && item.link);
  } catch {
    return [];
  }
}


export async function fetchAllRSS(
  sources: NewsSource[],
  supabase: SupabaseClient,
): Promise<RSSItem[]> {
  const log = logger(supabase, 'rss-fetcher');

  const { data: existingUrls } = await supabase
    .from('articles')
    .select('full_url')
    .gte('created_at', new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString());

  const seenUrls = new Set((existingUrls ?? []).map((r: { full_url: string }) => r.full_url));
  const results: RSSItem[] = [];

  for (const source of sources) {
    const items = await fetchFeed(source);

    if (items.length === 0) {
      await log.warn(`No items from ${source.name}`, { url: source.url });
      continue;
    }

    const newItems = items.filter(item => {
      if (seenUrls.has(item.link)) return false;
      seenUrls.add(item.link);
      return true;
    });

    results.push(...newItems);
  }

  return results;
}
