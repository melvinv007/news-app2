/**
 * app/api/why-this/route.ts
 * ─────────────────────────────────────────────────────────────────
 * Returns the "Why am I seeing this?" explanation for an article.
 * Caches the result in articles.why_this after first generation.
 *
 * GET /api/why-this?articleId=xxx
 *
 * Flow:
 *   1. Fetch article — if why_this already set, return cached
 *   2. Get user's top tags from last 20 liked/read articles
 *   3. Call generateWhyThis() from Gemini
 *   4. Save result to articles.why_this
 *   5. Return { text: result }
 *
 * Used by: components/WhyThisTooltip/index.tsx
 */

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateWhyThis } from '@/lib/ai/gemini';
import type { Article, UserInteraction } from '@/lib/supabase/types';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const articleId = request.nextUrl.searchParams.get('articleId');

    if (!articleId) {
      return NextResponse.json({ error: 'articleId is required.' }, { status: 400 });
    }

    const supabase = createClient();

    // 1. Fetch article
    const { data: articleData, error: articleError } = await supabase
      .from('articles')
      .select('*')
      .eq('id', articleId)
      .single();

    if (articleError || !articleData) {
      return NextResponse.json({ error: 'Article not found.' }, { status: 404 });
    }

    const article = articleData as Article;

    // 2. Return cached if already generated
    if (article.why_this) {
      return NextResponse.json({ text: article.why_this });
    }

    // 3. Get user's top tags from last 20 liked/read interactions
    const { data: interactionRows } = await supabase
      .from('user_interactions')
      .select('*')
      .in('action', ['like', 'read'])
      .order('created_at', { ascending: false })
      .limit(20);

    const interactions = (interactionRows ?? []) as UserInteraction[];
    const interactedArticleIds = interactions.map((i) => i.article_id);
    let userTopTags: string[] = [];

    if (interactedArticleIds.length > 0) {
      const { data: interactedRows } = await supabase
        .from('articles')
        .select('*')
        .in('id', interactedArticleIds);

      const interactedArticles = (interactedRows ?? []) as Article[];

      // Flatten all tags and count frequency
      const tagCounts: Record<string, number> = {};
      interactedArticles.forEach((a) => {
        (a.topic_tags ?? []).forEach((tag) => {
          tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
        });
      });

      // Take top 5 most frequent tags
      userTopTags = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([tag]) => tag);
    }

    const articleTags = article.topic_tags ?? [];

    // 4. Generate why-this explanation
    const text = await generateWhyThis(userTopTags, articleTags);
    const result = text ?? 'Recommended based on your reading history.';

    // 5. Cache in DB
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('articles') as any).update({ why_this: result }).eq('id', articleId);

    return NextResponse.json({ text: result });
  } catch (err) {
    console.error('[WhyThis] Error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
