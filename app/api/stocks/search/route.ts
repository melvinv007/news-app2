import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const NSE_TOP_50 = [
  'RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 'HINDUNILVR', 
  'ITC', 'SBIN', 'BHARTIARTL', 'KOTAKBANK', 'LT', 'AXISBANK', 'MARUTI',
  'SUNPHARMA', 'TITAN', 'ULTRACEMCO', 'BAJFINANCE', 'WIPRO', 'HCLTECH',
  'NTPC', 'POWERGRID', 'ONGC', 'COALINDIA', 'JSWSTEEL', 'TATASTEEL',
  'ADANIENT', 'ADANIPORTS', 'BAJAJFINSV', 'DIVISLAB', 'DRREDDY',
  'EICHERMOT', 'GRASIM', 'HEROMOTOCO', 'HINDALCO', 'INDUSINDBK',
  'ASIANPAINT', 'BAJAJ-AUTO', 'BPCL', 'BRITANNIA', 'CIPLA',
  'NESTLEIND', 'SBILIFE', 'TECHM', 'TATACONSUM', 'TATAMOTORS',
  'TATAPOWER', 'UPL', 'VEDL', 'ZOMATO', 'PIDILITIND'
];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.toUpperCase() || '';
  const market = searchParams.get('market');
  
  if (!q) return NextResponse.json({ results: [] });

  if (market === 'US') {
    try {
      const res = await fetch(`https://finnhub.io/api/v1/search?q=${q}&token=${process.env.FINNHUB_API_KEY}`);
      if (res.ok) {
        const data = await res.json();
        const results = (data.result || []).slice(0, 10).map((r: any) => ({
          ticker: r.symbol,
          name: r.description
        }));
        return NextResponse.json({ results });
      }
    } catch (e) {
      return NextResponse.json({ error: 'Search failed' }, { status: 500 });
    }
  } else {
    // Filter NSE_TOP_50
    const filtered = NSE_TOP_50.filter(t => t.includes(q)).slice(0, 10).map(t => ({
      ticker: t,
      name: t
    }));
    return NextResponse.json({ results: filtered });
  }
  
  return NextResponse.json({ results: [] });
}
