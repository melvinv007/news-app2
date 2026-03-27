import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const ALLOWED_FETCHERS = new Set([
  'fetch-world',
  'fetch-india',
  'fetch-mumbai',
  'fetch-cricket',
  'fetch-football',
  'fetch-f1',
  'fetch-sports-other',
  'fetch-aitech',
  'fetch-business',
  'process-articles',
  'process-embeddings',
]);

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!cronSecret) {
      return NextResponse.json(
        { error: 'CRON_SECRET not configured' },
        { status: 500 },
      );
    }

    if (!supabaseUrl) {
      return NextResponse.json(
        { error: 'NEXT_PUBLIC_SUPABASE_URL not configured' },
        { status: 500 },
      );
    }

    const body = await request.json().catch(() => null) as
      | { fetchKey?: string }
      | null;
    const fetchKey = body?.fetchKey;

    if (!fetchKey || !ALLOWED_FETCHERS.has(fetchKey)) {
      return NextResponse.json({ error: 'Invalid fetchKey' }, { status: 400 });
    }

    const res = await fetch(`${supabaseUrl}/functions/v1/${fetchKey}`, {
      method: 'POST',
      headers: {
        'x-cron-secret': cronSecret,
        'Content-Type': 'application/json',
      },
    });

    const text = await res.text();
    return NextResponse.json(
      {
        ok: res.ok,
        status: res.status,
        fetchKey,
        response: text,
      },
      { status: res.ok ? 200 : res.status },
    );
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
