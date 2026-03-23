import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { logger } from '../_shared/logger.ts';

Deno.serve(async (req) => {
  if (req.headers.get('x-cron-secret') !== Deno.env.get('CRON_SECRET')) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
  const log = logger(supabase, 'cleanup-articles');

  try {
    await log.info('Starting article cleanup');
    
    const { data: likedIds } = await supabase
      .from('user_interactions')
      .select('article_id')
      .eq('action', 'like');

    const { data: watchlistIds } = await supabase
      .from('user_watchlist')
      .select('pinned_story_id')
      .not('pinned_story_id', 'is', null);

    const keepIds = [
      ...(likedIds ?? []).map((r: { article_id: string }) => r.article_id),
      ...(watchlistIds ?? []).map((r: { pinned_story_id: string }) => r.pinned_story_id),
    ];

    const cutoff = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();

    if (keepIds.length === 0) {
      // No kept articles — delete all old ones
      const { count, error } = await supabase
        .from('articles')
        .delete({ count: 'exact' })
        .lt('created_at', cutoff);
      
      if (error) {
        await log.error('Cleanup delete all failed', { error: error.message });
        return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 });
      }

      await log.info('Cleanup completed', { deleted: count ?? 0 });
      return new Response(JSON.stringify({ ok: true, deleted: count ?? 0 }), { status: 200 });
    }

    // Delete old articles not in keep list
    // Use raw SQL via rpc
    const { data: count, error } = await supabase.rpc('cleanup_old_articles_fn', {
      p_cutoff: cutoff,
      p_keep_ids: keepIds,
    });

    if (error) {
      await log.error('Cleanup RPC failed', { error: error.message });
      return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 });
    }

    await log.info('Cleanup completed', { deleted: count ?? 0 });
    return new Response(JSON.stringify({ ok: true, deleted: count ?? 0 }), { status: 200 });

  } catch (err) {
    await log.error('Cleanup generic failure', { error: String(err) });
    return new Response(JSON.stringify({ ok: false }), { status: 500 });
  }
});
