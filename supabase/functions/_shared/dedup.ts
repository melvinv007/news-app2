/**
 * supabase/functions/_shared/dedup.ts
 * Story deduplication for Edge Functions — relative imports only.
 */

import { DEDUP_THRESHOLDS } from './dedup-config.ts';
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type { RSSItem } from './rss.ts';

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

function slugSimilarity(a: string, b: string): number {
  const tokensA = a.split('-').filter(t => t.length > 2);
  const tokensB = b.split('-').filter(t => t.length > 2);
  if (tokensA.length === 0 || tokensB.length === 0) return 0;
  const shared = tokensA.filter(t => tokensB.includes(t)).length;
  const total = new Set([...tokensA, ...tokensB]).size;
  return total === 0 ? 0 : shared / total;
}

export function isDuplicate(
  fingerprint: string,
  category: string,
  recentFingerprints: string[],
): boolean {
  const threshold = DEDUP_THRESHOLDS[category] ?? 0.80;
  return recentFingerprints.some(fp => slugSimilarity(fingerprint, fp) >= threshold);
}

export async function updateCluster(
  supabase: SupabaseClient,
  existingArticleId: string,
  newSource: { name: string; url: string },
): Promise<void> {
  await supabase
    .from('articles')
    .update({
      source_count: supabase.rpc('increment', { x: 1 }) as unknown as number,
      has_update: true,
      last_activity_at: new Date().toISOString(),
    })
    .eq('id', existingArticleId);

  await supabase.from('story_sources').insert({
    story_id: existingArticleId,
    source_name: newSource.name,
    source_url: newSource.url,
  });
}

export async function filterDuplicates(
  articles: ArticleWithFingerprint[],
  recentFingerprints: Record<string, string[]>,
  supabase: SupabaseClient,
): Promise<ArticleWithFingerprint[]> {
  const unique: ArticleWithFingerprint[] = [];

  for (const article of articles) {
    if (!article.fingerprint) {
      unique.push(article);
      continue;
    }

    const recents = recentFingerprints[article.category] ?? [];
    if (isDuplicate(article.fingerprint, article.category, recents)) {
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
      continue;
    }

    unique.push(article);
  }

  return unique;
}
