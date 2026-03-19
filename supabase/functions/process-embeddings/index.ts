/**
 * supabase/functions/process-embeddings/index.ts
 * ─────────────────────────────────────────────────────────────────
 * Processes articles without embeddings every 5 minutes.
 * Runs separately so articles appear immediately in the feed
 * without waiting for embedding generation.
 *
 * Articles without embeddings are shown unranked (recency only)
 * until their embedding is generated.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai@0.21.0';
import { logger } from '../_shared/logger.ts';

Deno.serve(async (req) => {
  if (req.headers.get('x-cron-secret') !== Deno.env.get('CRON_SECRET')) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
  const log = logger(supabase, 'process-embeddings');
  await log.info('Process-embeddings started');

  try {
    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY')!);

    // Get up to 50 articles without embeddings
    const { data: articles } = await supabase
      .from('articles')
      .select('id, title, summary')
      .is('embedding', null)
      .eq('is_null_article', false)
      .limit(50);

    let updated = 0;

    for (const article of (articles ?? [])) {
      if (!article.summary) continue;

      try {
        const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
        const result = await model.embedContent(`${article.title}\n\n${article.summary}`);
        const embedding = result.embedding.values;

        const { error } = await supabase
          .from('articles')
          .update({ embedding })
          .eq('id', article.id);

        if (!error) updated++;
      } catch {
        // Single article failure — continue with others
      }
    }

    await log.info('Process-embeddings completed', { updated });
    return new Response(JSON.stringify({ ok: true, updated }), { status: 200 });

  } catch (err) {
    await log.error('Process-embeddings failed', { error: String(err) });
    return new Response(JSON.stringify({ ok: false }), { status: 500 });
  }
});
