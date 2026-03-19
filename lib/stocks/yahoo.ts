/**
 * lib/stocks/yahoo.ts
 * ─────────────────────────────────────────────────────────────────
 * Yahoo Finance polling. Unofficial API — no key needed.
 * Returns null on ANY failure — frontend shows "Live data unavailable" banner.
 * Never throws — always degrades gracefully.
 *
 * Yahoo Finance has broken before without warning.
 * If this stops working, check the URL endpoint — community usually has a fix quickly.
 * Update the URL in fetchQuote() below.
 */

export type Quote = {
  ticker: string;
  price: number;
  change: number;      // absolute change
  changePercent: number;
  previousClose: number;
  marketState: 'REGULAR' | 'PRE' | 'POST' | 'CLOSED';
};

export async function fetchQuote(ticker: string): Promise<Quote | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    });

    if (!res.ok) return null;

    const data = await res.json();
    const result = data?.chart?.result?.[0];
    if (!result) return null;

    const meta = result.meta;
    const price = meta?.regularMarketPrice ?? null;
    if (price === null) return null;

    return {
      ticker,
      price,
      change:        price - (meta.previousClose ?? price),
      changePercent: ((price - (meta.previousClose ?? price)) / (meta.previousClose ?? price)) * 100,
      previousClose: meta.previousClose ?? price,
      marketState:   meta.marketState ?? 'CLOSED',
    };
  } catch {
    return null;
  }
}

export async function fetchMultipleQuotes(
  tickers: string[],
): Promise<Record<string, Quote | null>> {
  const results: Record<string, Quote | null> = {};
  // Sequential — don't hammer Yahoo Finance
  for (const ticker of tickers) {
    results[ticker] = await fetchQuote(ticker);
  }
  return results;
}

// IST-aware market hours check
export function isMarketOpen(market: 'IN' | 'US'): boolean {
  const nowUTC = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const ist = new Date(nowUTC.getTime() + istOffset);
  const hours = ist.getUTCHours();
  const minutes = ist.getUTCMinutes();
  const day = ist.getUTCDay(); // 0=Sun, 6=Sat

  if (day === 0 || day === 6) return false; // Weekend

  const totalMins = hours * 60 + minutes;

  if (market === 'IN') {
    // NSE/BSE: 9:15 AM – 3:30 PM IST
    return totalMins >= 555 && totalMins <= 930;
  }

  if (market === 'US') {
    // NYSE: 9:30 AM – 4:00 PM EST = 7:00 PM – 1:30 AM IST
    return totalMins >= 1170 || totalMins <= 90;
  }

  return false;
}
