/**
 * app/api/interactions/route.ts
 * ─────────────────────────────────────────────────────────────────
 * Handles user interactions with articles: like, dislike, read, dismiss, track.
 *
 * POST body: { action: string, article_id: string, read_time_seconds?: number }
 *
 * On every interaction:
 *   1. Inserts a row into user_interactions
 *   2. Calls updatePreferenceVector to adjust the user's 768-dim preference vector
 *
 * Used by: components/ArticleCard/ActionBar.tsx
 */

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updatePreferenceVector } from '@/lib/recommendation/vectors';

const VALID_ACTIONS = new Set(['like', 'dislike', 'read', 'dismiss', 'track']);

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as {
      action?: string;
      article_id?: string;
      read_time_seconds?: number;
    };

    const { action, article_id, read_time_seconds } = body;

    // Validate inputs
    if (!action || !VALID_ACTIONS.has(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be: like, dislike, read, dismiss, track.' },
        { status: 400 },
      );
    }

    if (!article_id || typeof article_id !== 'string') {
      return NextResponse.json(
        { error: 'article_id is required.' },
        { status: 400 },
      );
    }

    const supabase = createClient();

    // 1. Insert interaction record
    // Cast needed: our Database type uses Omit<> for Insert which
    // the Supabase client resolves to a strict shape at compile time.
    const { error: insertError } = await (supabase
      .from('user_interactions') as ReturnType<typeof supabase.from>)
      .insert({
        article_id,
        action: action as 'like' | 'dislike' | 'read' | 'dismiss' | 'track',
        read_time_seconds: read_time_seconds ?? null,
        has_seen_update: false,
      } as Record<string, unknown>);

    if (insertError) {
      console.error('[Interactions] Insert error:', insertError.message);
      return NextResponse.json(
        { error: 'Failed to record interaction.' },
        { status: 500 },
      );
    }

    // 2. Update preference vector (runs in background — non-blocking is fine
    //    but we await here to ensure the vector update completes before responding)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await updatePreferenceVector(supabase as any, article_id, action, read_time_seconds);
    } catch (vecError) {
      // Log but don't fail the request — graceful degrade
      console.error('[Interactions] Preference vector update error:', vecError);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[Interactions] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 },
    );
  }
}
