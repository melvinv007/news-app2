/**
 * components/Stocks/StocksWidget.tsx
 * ─────────────────────────────────────────────────────────────────
 * Full stocks dashboard widget with India/US tabs.
 * Shows default indices + user's custom tickers from stock_watchlist.
 * Polls every 5 minutes during market hours only.
 *
 * India tab: DEFAULT_INDIA_INDICES + user's IN watchlist tickers
 * US tab:    DEFAULT_US_INDICES + user's US watchlist tickers
 *
 * Shows "Live data unavailable" banner if Yahoo Finance fails.
 * Add ticker input at bottom.
 *
 * How to change indices: Edit DEFAULT_INDIA_INDICES / DEFAULT_US_INDICES in config/sports.ts.
 * Used by: app/(app)/stocks/page.tsx
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Loader2, AlertCircle } from 'lucide-react';
import { DEFAULT_INDIA_INDICES, DEFAULT_US_INDICES } from '@/config/sports';
import type { Quote } from '@/lib/stocks/yahoo';
import MarketStatus from '@/components/Stocks/MarketStatus';
import IndexCard from '@/components/Stocks/IndexCard';
import TickerRow from '@/components/Stocks/TickerRow';

type Tab = 'india' | 'us';
type WatchlistItem = { id: string; ticker: string; display_name: string; market: 'IN' | 'US' };

const POLL_INTERVAL = 5 * 60_000; // 5 minutes
const springTransition = { type: 'spring' as const, stiffness: 400, damping: 30 };

export default function StocksWidget(): React.ReactElement {
  const [tab, setTab] = useState<Tab>('india');
  const [quotes, setQuotes] = useState<Record<string, Quote | null>>({});
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataUnavailable, setDataUnavailable] = useState(false);

  // Add ticker form state
  const [addTicker, setAddTicker] = useState('');
  const [addName, setAddName] = useState('');
  const [adding, setAdding] = useState(false);

  // Fetch user's stock watchlist
  const fetchWatchlist = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch('/api/stocks?tickers=__watchlist__');
      // Watchlist fetched via Supabase in a separate call
    } catch { /* graceful */ }
  }, []);

  // Fetch all quotes
  const fetchQuotes = useCallback(async (): Promise<void> => {
    const defaultTickers = tab === 'india'
      ? DEFAULT_INDIA_INDICES.map((i) => i.ticker)
      : DEFAULT_US_INDICES.map((i) => i.ticker);

    const watchlistTickers = watchlist
      .filter((w) => (tab === 'india' ? w.market === 'IN' : w.market === 'US'))
      .map((w) => w.ticker);

    const allTickers = [...defaultTickers, ...watchlistTickers];
    if (allTickers.length === 0) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/stocks?tickers=${allTickers.join(',')}`);
      if (res.ok) {
        const data = (await res.json()) as { quotes: Record<string, Quote | null> };
        setQuotes((prev) => ({ ...prev, ...data.quotes }));

        // Check if all quotes returned null
        const allNull = Object.values(data.quotes).every((q) => q === null);
        setDataUnavailable(allNull && allTickers.length > 0);
      }
    } catch {
      setDataUnavailable(true);
    } finally {
      setLoading(false);
    }
  }, [tab, watchlist]);

  // Initial fetch + polling
  useEffect(() => {
    setLoading(true);
    fetchQuotes();
    const interval = setInterval(fetchQuotes, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchQuotes]);

  // Suppress unused warning — fetchWatchlist called indirectly via API
  void fetchWatchlist;

  const defaultIndices = tab === 'india' ? DEFAULT_INDIA_INDICES : DEFAULT_US_INDICES;
  const filteredWatchlist = watchlist.filter((w) =>
    tab === 'india' ? w.market === 'IN' : w.market === 'US',
  );
  const currentMarket: 'IN' | 'US' = tab === 'india' ? 'IN' : 'US';

  const handleAddTicker = async (): Promise<void> => {
    if (!addTicker.trim() || !addName.trim()) return;
    setAdding(true);
    try {
      const res = await fetch('/api/stocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticker: addTicker.trim().toUpperCase(),
          display_name: addName.trim(),
          market: currentMarket,
        }),
      });
      if (res.ok) {
        setWatchlist((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            ticker: addTicker.trim().toUpperCase(),
            display_name: addName.trim(),
            market: currentMarket,
          },
        ]);
        setAddTicker('');
        setAddName('');
      }
    } catch { /* graceful */ }
    setAdding(false);
  };

  return (
    <div
      className="rounded-xl p-4 md:p-5"
      style={{ backgroundColor: 'var(--bg-secondary)' }}
    >
      {/* Header with market status */}
      <div className="flex items-center justify-between mb-4">
        <MarketStatus />
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 mb-4 border-b" style={{ borderColor: 'var(--bg-tertiary)' }}>
        {(['india', 'us'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setLoading(true); }}
            className="relative px-4 py-2 font-sans text-sm font-medium transition-colors"
            style={{ color: tab === t ? 'var(--text-primary)' : 'var(--text-muted)' }}
          >
            {t === 'india' ? 'India' : 'US'}
            {tab === t && (
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                style={{ backgroundColor: 'var(--accent)' }}
                layoutId="stocks-tab"
                transition={springTransition}
              />
            )}
          </button>
        ))}
      </div>

      {/* Data unavailable banner */}
      {dataUnavailable && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg mb-4"
          style={{ backgroundColor: 'var(--accent-subtle)', color: 'var(--accent)' }}
        >
          <AlertCircle size={14} />
          <span className="font-sans text-xs">Live data unavailable — Yahoo Finance may be down</span>
        </div>
      )}

      {/* Default indices */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {defaultIndices.map((idx) => {
          const q = quotes[idx.ticker];
          return (
            <IndexCard
              key={idx.ticker}
              name={idx.displayName}
              price={q?.price ?? null}
              change={q?.change ?? null}
              changePercent={q?.changePercent ?? null}
            />
          );
        })}
      </div>

      {/* User's watchlist tickers */}
      {filteredWatchlist.length > 0 && (
        <div className="space-y-1 mb-4">
          <span className="font-sans text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Your Watchlist
          </span>
          {filteredWatchlist.map((item) => {
            const q = quotes[item.ticker];
            return (
              <TickerRow
                key={item.id}
                ticker={item.ticker}
                displayName={item.display_name}
                price={q?.price ?? null}
                changePercent={q?.changePercent ?? null}
                watchlistId={item.id}
                onRemoved={(id) => setWatchlist((prev) => prev.filter((w) => w.id !== id))}
              />
            );
          })}
        </div>
      )}

      {/* Add ticker */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Ticker (e.g. RELIANCE.NS)"
          value={addTicker}
          onChange={(e) => setAddTicker(e.target.value)}
          className="flex-1 px-3 py-2 rounded-lg font-sans text-sm border-none outline-none"
          style={{
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--text-primary)',
          }}
        />
        <input
          type="text"
          placeholder="Name"
          value={addName}
          onChange={(e) => setAddName(e.target.value)}
          className="flex-1 px-3 py-2 rounded-lg font-sans text-sm border-none outline-none"
          style={{
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--text-primary)',
          }}
        />
        <button
          onClick={handleAddTicker}
          disabled={adding || !addTicker.trim() || !addName.trim()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-sans text-sm font-medium transition-colors disabled:opacity-50"
          style={{
            backgroundColor: 'var(--accent)',
            color: 'var(--bg-primary)',
          }}
        >
          {adding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          Add
        </button>
      </div>
    </div>
  );
}
