import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tickersStr = searchParams.get('tickers');
  const market = searchParams.get('market');
  
  if (!tickersStr) return NextResponse.json({ quotes: {} });
  
  const tickers = tickersStr.split(',');
  const quotes: Record<string, any> = {};

  if (market === 'US') {
    const promises = tickers.map(async (t) => {
      try {
        const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${t}&token=${process.env.FINNHUB_API_KEY}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.c !== 0) {
             quotes[t] = {
               ticker: t,
               price: data.c,
               change: data.d,
               changePercent: data.dp,
               high: data.h,
               low: data.l
             };
          } else {
             quotes[t] = null;
          }
        } else {
          quotes[t] = null;
        }
      } catch {
        quotes[t] = null;
      }
    });
    await Promise.all(promises);
  } else {
    try {
      const yahooTickers = tickers.map(t => t.includes('.') || t.includes('^') ? t : `${t}.NS`).join(',');
      const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${yahooTickers}`;
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }});
      if (res.ok) {
        const data = await res.json();
        const results = data.quoteResponse?.result || [];
        for (const t of tickers) {
          const q = results.find((r: any) => r.symbol === t || r.symbol === `${t}.NS`);
          if (q) {
            quotes[t] = {
              ticker: t,
              price: q.regularMarketPrice,
              change: q.regularMarketChange,
              changePercent: q.regularMarketChangePercent,
              high: q.regularMarketDayHigh,
              low: q.regularMarketDayLow
            };
          } else {
            quotes[t] = null;
          }
        }
      } else {
        for (const t of tickers) quotes[t] = null;
      }
    } catch {
      for (const t of tickers) quotes[t] = null;
    }
  }

  return NextResponse.json({ quotes });
}

export async function POST(req: Request) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value; },
        set(name: string, value: string, options: CookieOptions) { cookieStore.set({ name, value, ...options }); },
        remove(name: string, options: CookieOptions) { cookieStore.set({ name, value: '', ...options }); },
      },
    }
  );
  
  const body = await req.json();
  const { ticker, display_name, market } = body;
  
  const { data, error } = await supabase.from('stock_watchlist').insert({
    ticker, display_name, market
  }).select().single();
  
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function DELETE(req: Request) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value; },
        set(name: string, value: string, options: CookieOptions) { cookieStore.set({ name, value, ...options }); },
        remove(name: string, options: CookieOptions) { cookieStore.set({ name, value: '', ...options }); },
      },
    }
  );
  
  const body = await req.json();
  const { ticker } = body;
  
  const { error } = await supabase.from('stock_watchlist').delete().eq('ticker', ticker);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
