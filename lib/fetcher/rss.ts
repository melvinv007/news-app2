/**
 * lib/fetcher/rss.ts
 * ─────────────────────────────────────────────────────────────────
 * RSS feed parser. Fetches and parses feeds using rss-parser.
 * Handles empty feeds, network errors, and malformed XML gracefully.
 *
 * Used by: all Edge Functions (fetch-world, fetch-sports, etc.)
 * NOTE: In Edge Functions, import via relative path: '../../lib/fetcher/rss.ts'
 */

import Parser from 'rss-parser';
import type { NewsSource } from '@/config/sources';
import type { SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

export type RSSItem = {
  title: string;
  link: string;
  contentSnippet: string;
  pubDate: string;
  source: string;
  category: string;
  enclosure?: { url: string };
};

const parser = new Parser({
  timeout: 10000, // 10 second timeout per feed
  headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)' },
});

// Fetch a single RSS feed — returns empty array on any failure
export async function fetchFeed(source: NewsSource): Promise<RSSItem[]> {
  try {
    const feed = await parser.parseURL(source.url);
    return (feed.items ?? []).map(item => ({
      title:          item.title?.trim() ?? '',
      link:           item.link ?? item.guid ?? '',
      contentSnippet: item.contentSnippet?.trim() ?? item.summary?.trim() ?? '',
      pubDate:        item.pubDate ?? item.isoDate ?? new Date().toISOString(),
      source:         source.name,
      category:       source.category,
      enclosure:      item.enclosure ? { url: item.enclosure.url } : undefined,
    })).filter(item => item.title && item.link);
  } catch {
    return [];
  }
}

// Fetch all sources SEQUENTIALLY (never parallel — Edge Function 150s limit)
// Also performs URL deduplication against existing articles in DB
export async function fetchAllRSS(
  sources: NewsSource[],
  supabase: SupabaseClient,
): Promise<RSSItem[]> {
  const log = logger(supabase, 'rss-fetcher');

  // Load existing URLs to deduplicate
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

    // URL deduplication
    const newItems = items.filter(item => {
      if (seenUrls.has(item.link)) return false;
      seenUrls.add(item.link);
      return true;
    });

    results.push(...newItems);
  }

  return results;
}
