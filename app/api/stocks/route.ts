/**
 * app/api/stocks/route.ts
 * ─────────────────────────────────────────────────────────────────
 * Stock data and watchlist management API.
 *
 * GET  ?tickers=AAPL,GOOGL   → fetch quotes via Yahoo Finance proxy
 * POST { ticker, display_name, market }  → add to stock_watchlist
 * DELETE { id }              → remove from stock_watchlist
 *
 * Used by: components/Stocks/StocksWidget.tsx, TickerRow.tsx
 */

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { fetchMultipleQuotes } from '@/lib/stocks/yahoo';
import type { StockWatchlistItem } from '@/lib/supabase/types';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const tickersParam = request.nextUrl.searchParams.get('tickers') ?? '';
    const tickers = tickersParam.split(',').map((t) => t.trim()).filter(Boolean);

    if (tickers.length === 0) {
      return NextResponse.json({ quotes: {} });
    }

    const quotes = await fetchMultipleQuotes(tickers);
    return NextResponse.json({ quotes });
  } catch (err) {
    console.error('[Stocks GET] Error:', err);
    return NextResponse.json({ quotes: {} });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as {
      ticker?: string;
      display_name?: string;
      market?: 'IN' | 'US';
    };

    if (!body.ticker || !body.display_name || !body.market) {
      return NextResponse.json({ error: 'ticker, display_name, market required.' }, { status: 400 });
    }

    const supabase = createClient();
    const insertData: Omit<StockWatchlistItem, 'id' | 'added_at'> = {
      ticker: body.ticker,
      display_name: body.display_name,
      market: body.market,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('stock_watchlist') as any).insert(insertData);

    if (error) {
      console.error('[Stocks POST] Insert error:', error.message);
      return NextResponse.json({ error: 'Failed to add ticker.' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[Stocks POST] Error:', err);
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
      .from('stock_watchlist')
      .delete()
      .eq('id', body.id);

    if (error) {
      console.error('[Stocks DELETE] Error:', error.message);
      return NextResponse.json({ error: 'Failed to remove ticker.' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[Stocks DELETE] Error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
