/**
 * app/api/watchlist/route.ts
 * ─────────────────────────────────────────────────────────────────
 * User topic watchlist management API.
 *
 * GET    → fetch all user_watchlist items
 * POST   { topic, type }  → generate keywords via Gemini → insert
 * DELETE { id }           → remove from user_watchlist
 *
 * Used by: components/Watchlist/WatchlistPanel.tsx, AddTopicModal.tsx
 */

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateWatchlistKeywords } from '@/lib/ai/gemini';
import type { WatchlistItem } from '@/lib/supabase/types';

export async function GET(): Promise<NextResponse> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('user_watchlist')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Watchlist GET] Error:', error.message);
      return NextResponse.json({ items: [] });
    }

    return NextResponse.json({ items: (data ?? []) as WatchlistItem[] });
  } catch (err) {
    console.error('[Watchlist GET] Error:', err);
    return NextResponse.json({ items: [] });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as { topic?: string; type?: string };

    if (!body.topic) {
      return NextResponse.json({ error: 'topic is required.' }, { status: 400 });
    }

    // Generate keywords via Gemini
    const result = await generateWatchlistKeywords(body.topic);

    if (!result) {
      return NextResponse.json({ error: 'AI failed to generate keywords. Try again.' }, { status: 500 });
    }

    const supabase = createClient();
    const insertData = {
      label: body.topic,
      canonical_name: result.canonical_name,
      search_keywords: result.search_keywords,
      related_terms: result.related_terms,
      type: result.type,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('user_watchlist') as any)
      .insert(insertData)
      .select('*')
      .single();

    if (error) {
      console.error('[Watchlist POST] Insert error:', error.message);
      return NextResponse.json({ error: 'Failed to add topic.' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, item: data, keywords: result });
  } catch (err) {
    console.error('[Watchlist POST] Error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as { id?: string };

    if (!body.id) {
      return NextResponse.json({ error: 'id is required.' }, { status: 400 });
    }

    const supabase = createClient();
    const { error } = await supabase
      .from('user_watchlist')
      .delete()
      .eq('id', body.id);

    if (error) {
      console.error('[Watchlist DELETE] Error:', error.message);
      return NextResponse.json({ error: 'Failed to remove topic.' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[Watchlist DELETE] Error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
