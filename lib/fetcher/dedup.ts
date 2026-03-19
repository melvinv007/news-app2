/**
 * lib/fetcher/dedup.ts
 * ─────────────────────────────────────────────────────────────────
 * Story deduplication using TF-IDF token similarity on fingerprints.
 * Layer 1 (URL hash) is handled in rss.ts fetchAllRSS.
 * Layer 2 (story fingerprint) is handled here.
 *
 * How it works:
 *   1. Groq extracts a slug: "india-wins-test-series-australia-2026"
 *   2. Compare slug tokens against recent slugs in same category
 *   3. If similarity > threshold → same story → cluster it
 *
 * To adjust aggressiveness: edit DEDUP_THRESHOLDS in config/dedup.ts
 */

import { DEDUP_THRESHOLDS } from '@/config/dedup';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { RSSItem } from '@/lib/fetcher/rss';

type ArticleWithFingerprint = RSSItem & {
  fingerprint: string | null;
  fullText?: string | null;
  summary?: string | null;
  full_content_cleaned?: string | null;
  clickbait_score?: number;
  final_headline?: string | null;
  topic_tags?: string[];
  is_null_article?: boolean;
  watchlist_matches?: string[];
  stock_tickers?: string[];
};

// TF-IDF token similarity between two slugs
function slugSimilarity(a: string, b: string): number {
  const tokensA = a.split('-').filter(t => t.length > 2);
  const tokensB = b.split('-').filter(t => t.length > 2);
  if (tokensA.length === 0 || tokensB.length === 0) return 0;
  const shared = tokensA.filter(t => tokensB.includes(t)).length;
  const total = new Set([...tokensA, ...tokensB]).size;
  return total === 0 ? 0 : shared / total;
}

// Check if an article's fingerprint matches any recent fingerprint
export function isDuplicate(
  fingerprint: string,
  category: string,
  recentFingerprints: string[],
): boolean {
  const threshold = DEDUP_THRESHOLDS[category] ?? 0.80;
  return recentFingerprints.some(fp => slugSimilarity(fingerprint, fp) >= threshold);
}

// Update an existing story cluster when a duplicate is found
// Increments source_count, sets has_update=true, inserts to story_sources
export async function updateCluster(
  supabase: SupabaseClient,
  existingArticleId: string,
  newSource: { name: string; url: string },
): Promise<void> {
  // Increment source count and mark as updated
  await supabase
    .from('articles')
    .update({
      source_count: supabase.rpc('increment', { x: 1 }) as unknown as number,
      has_update: true,
      last_activity_at: new Date().toISOString(),
    })
    .eq('id', existingArticleId);

  // Add source to story_sources table
  await supabase.from('story_sources').insert({
    story_id: existingArticleId,
    source_name: newSource.name,
    source_url: newSource.url,
  });
}

// Filter articles — return only unique ones, handle cluster updates for duplicates
export async function filterDuplicates(
  articles: ArticleWithFingerprint[],
  recentFingerprints: Record<string, string[]>,
  supabase: SupabaseClient,
): Promise<ArticleWithFingerprint[]> {
  const unique: ArticleWithFingerprint[] = [];

  for (const article of articles) {
    if (!article.fingerprint) {
      unique.push(article); // No fingerprint — treat as new
      continue;
    }

    const recents = recentFingerprints[article.category] ?? [];
    if (isDuplicate(article.fingerprint, article.category, recents)) {
      // Find the existing article and update its cluster
      const { data: existing } = await supabase
        .from('articles')
        .select('id')
        .eq('story_fingerprint', article.fingerprint)
        .eq('category', article.category)
        .single();

      if (existing) {
        await updateCluster(supabase, existing.id, {
          name: article.source,
          url: article.link,
        });
      }
      continue; // Skip inserting duplicate
    }

    unique.push(article);
  }

  return unique;
}
