'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Plus, Loader2, AlertCircle, RefreshCw, Search, X, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type Tab = 'IN' | 'US';
type WatchlistItem = { id: string; ticker: string; display_name: string; market: 'IN' | 'US' };
type Quote = { ticker: string; price: number; change: number; changePercent: number; high: number; low: number };
type SearchResult = { ticker: string; name: string };

const POLL_INTERVAL = 5 * 60_000;
const springTransition = { type: 'spring' as const, stiffness: 400, damping: 30 };

function isMarketOpen(market: Tab): boolean {
  const now = new Date();
  const day = now.getUTCDay();
  if (day === 0 || day === 6) return false; // weekend
  
  if (market === 'IN') {
    // 9:15 AM - 3:30 PM IST (UTC+5:30)
    // 03:45 UTC - 10:00 UTC
    const hrs = now.getUTCHours();
    const mins = now.getUTCMinutes();
    const time = hrs * 60 + mins;
    return time >= 225 && time <= 600;
  } else {
    // 9:30 AM - 4:00 PM EST (UTC-5:00 usually, ignoring DST strictly for simplicity)
    // 14:30 UTC - 21:00 UTC
    const hrs = now.getUTCHours();
    const mins = now.getUTCMinutes();
    const time = hrs * 60 + mins;
    return time >= 870 && time <= 1260; // 14.5 * 60 to 21 * 60
  }
}

export default function StocksWidget(): React.ReactElement {
  const [tab, setTab] = useState<Tab>('IN');
  const [quotes, setQuotes] = useState<Record<string, Quote | null>>({});
  const [nifty, setNifty] = useState<any>(null); // Nifty from NSE
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [addingTicker, setAddingTicker] = useState<string | null>(null);

  const supabase = createClient();

  const fetchWatchlist = useCallback(async () => {
    const { data } = await supabase.from('stock_watchlist').select('*');
    if (data) setWatchlist(data);
  }, []);

  const fetchNifty50 = async () => {
    if (tab !== 'IN') return;
    try {
      const res = await fetch('https://www.nseindia.com/api/equity-stockIndices?index=NIFTY%2050');
      if (res.ok) {
        const data = await res.json();
        setNifty({
          name: 'NIFTY 50',
          price: data.data[0]?.lastPrice,
          change: data.data[0]?.change,
          changePercent: data.data[0]?.pChange
        });
      }
    } catch { /* typical CORS failure on frontend without proxy */ }
  };

  const fetchQuotes = useCallback(async () => {
    let activeTickers: string[] = [];
    
    if (tab === 'US') {
      activeTickers.push('^GSPC'); // S&P 500
    }
    
    const wTickers = watchlist.filter(w => w.market === tab).map(w => w.ticker);
    activeTickers = [...activeTickers, ...wTickers];

    fetchNifty50();

    if (activeTickers.length > 0) {
      try {
        const res = await fetch(`/api/stocks?tickers=${activeTickers.join(',')}&market=${tab}`);
        if (res.ok) {
          const data = await res.json();
          setQuotes(prev => ({ ...prev, ...data.quotes }));
        }
      } catch { }
    }
    setLoading(false);
    setRefreshing(false);
  }, [tab, watchlist]);

  useEffect(() => {
    fetchWatchlist().then(() => fetchQuotes());
    const interval = setInterval(fetchQuotes, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchQuotes, fetchWatchlist]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchQuotes();
  };

  // Search trigger
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length === 0) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/stocks/search?q=${searchQuery.trim()}&market=${tab}`);
        const data = await res.json();
        setSearchResults(data.results || []);
      } catch {}
      setSearching(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, tab]);

  const addStock = async (ticker: string, name: string) => {
    setAddingTicker(ticker);
    try {
      const res = await fetch('/api/stocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker, display_name: name, market: tab })
      });
      if (res.ok) {
        const newItem = await res.json();
        setWatchlist(prev => [...prev, newItem]);
        fetchQuotes(); // refresh immediately
        setShowSearch(false);
        setSearchQuery('');
      }
    } catch {}
    setAddingTicker(null);
  };

  const removeStock = async (ticker: string) => {
    try {
      const res = await fetch('/api/stocks', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker })
      });
      if (res.ok) {
        setWatchlist(prev => prev.filter(w => w.ticker !== ticker));
      }
    } catch {}
  };

  const marketOpen = isMarketOpen(tab);
  const activeWatchlist = watchlist.filter(w => w.market === tab);

  if (loading && !refreshing && Object.keys(quotes).length === 0) {
    return (
      <div className="rounded-xl p-4 md:p-5" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <Loader2 className="animate-spin text-[var(--accent)]" size={24} />
      </div>
    );
  }

  return (
    <div className="rounded-xl p-4 md:p-5 flex flex-col gap-4" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-sans text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Markets
          </span>
          <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${marketOpen ? 'bg-emerald-500/20 text-emerald-500' : 'bg-gray-500/20 text-gray-400'}`}>
            {marketOpen ? 'OPEN' : 'CLOSED'}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowSearch(!showSearch)} 
            className="p-1.5 rounded-md transition-colors hover:bg-[var(--bg-tertiary)]"
          >
            <Search size={16} className={showSearch ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'} />
          </button>
          <button 
            onClick={handleRefresh} 
            disabled={refreshing}
            className="p-1.5 rounded-md transition-colors hover:bg-[var(--bg-tertiary)] disabled:opacity-50"
          >
            <RefreshCw size={16} className={`text-[var(--text-muted)] ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 border-b border-[var(--border)]">
        {(['IN', 'US'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setShowSearch(false); setSearchQuery(''); }}
            className="relative px-4 py-2 font-sans text-sm font-medium transition-colors"
            style={{ color: tab === t ? 'var(--text-primary)' : 'var(--text-muted)' }}
          >
            {t === 'IN' ? 'India' : 'US Watchlist'}
            {tab === t && (
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[var(--accent)]"
                layoutId="stocks-tab"
                transition={springTransition}
              />
            )}
          </button>
        ))}
      </div>

      {/* Search Input (conditionally rendered) */}
      {showSearch && (
        <div className="relative">
          <div className="flex flex-col gap-2 p-3 rounded-lg bg-[var(--bg-tertiary)]">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                autoFocus
                type="text"
                placeholder={tab === 'IN' ? "Search NIFTY 50..." : "Search US stocks..."}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-[var(--bg-primary)] text-sm px-9 py-2 rounded border border-[var(--border)] outline-none focus:border-[var(--accent)] text-[var(--text-primary)]"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X size={14} className="text-[var(--text-muted)]" />
                </button>
              )}
            </div>
            
            {/* Results dropdown */}
            {(searchQuery || searching) && (
              <div className="mt-2 max-h-48 overflow-y-auto space-y-1">
                {searching ? (
                  <div className="text-center py-2"><Loader2 size={16} className="animate-spin mx-auto text-[var(--text-muted)]" /></div>
                ) : searchResults.length === 0 ? (
                  <p className="text-center text-xs text-[var(--text-muted)] py-2">No results found</p>
                ) : (
                  searchResults.map(res => (
                    <div key={res.ticker} className="flex items-center justify-between p-2 rounded hover:bg-[var(--bg-primary)]">
                      <div>
                        <p className="text-sm font-bold text-[var(--text-primary)]">{res.ticker}</p>
                        <p className="text-xs text-[var(--text-muted)] truncate max-w-[150px]">{res.name}</p>
                      </div>
                      <button 
                        onClick={() => addStock(res.ticker, res.name)}
                        disabled={addingTicker === res.ticker || activeWatchlist.some(w => w.ticker === res.ticker)}
                        className="px-2 py-1 rounded-md text-xs font-semibold bg-[var(--accent)] text-[var(--bg-primary)] disabled:opacity-50"
                      >
                        {addingTicker === res.ticker ? <Loader2 size={12} className="animate-spin" /> : 
                         activeWatchlist.some(w => w.ticker === res.ticker) ? 'Added' : 'Add'}
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="space-y-4">
        {/* Defaults */}
        <div className="grid grid-cols-2 gap-3">
          {tab === 'IN' ? (
             <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)]">
               <p className="text-xs text-[var(--text-muted)] mb-1">NIFTY 50</p>
               {nifty ? (
                 <>
                   <p className="text-base font-bold text-[var(--text-primary)]">{Number(nifty.price).toFixed(2)}</p>
                   <p className={`text-xs font-semibold ${nifty.change >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                     {nifty.change >= 0 ? '+' : ''}{Number(nifty.change).toFixed(2)} ({Number(nifty.changePercent).toFixed(2)}%)
                   </p>
                 </>
               ) : (
                 <p className="text-xs italic text-[var(--text-muted)] text-center py-2 flex items-center justify-center gap-1">
                   <AlertCircle size={10} /> NSE strict CORS block <br/>(requires proxy)
                 </p>
               )}
             </div>
          ) : (
             <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)]">
               <p className="text-xs text-[var(--text-muted)] mb-1">S&P 500</p>
               {quotes['^GSPC'] ? (
                 <>
                   <p className="text-base font-bold text-[var(--text-primary)]">{Number(quotes['^GSPC']?.price).toFixed(2)}</p>
                   <p className={`text-xs font-semibold ${quotes['^GSPC']?.change >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                     {quotes['^GSPC']?.change >= 0 ? '+' : ''}{Number(quotes['^GSPC']?.change).toFixed(2)} ({Number(quotes['^GSPC']?.changePercent).toFixed(2)}%)
                   </p>
                 </>
               ) : (
                 <div className="h-8 animate-pulse bg-white/5 rounded mt-1"></div>
               )}
             </div>
          )}
        </div>

        {/* Watchlist */}
        {activeWatchlist.length > 0 && (
          <div className="space-y-2">
            <span className="font-sans text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] px-1">
              Your Watchlist
            </span>
            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1 hide-scrollbar">
              {activeWatchlist.map(w => {
                const q = quotes[w.ticker];
                return (
                  <div key={w.id} className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--border)] transition-colors group">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-[var(--text-primary)]">{w.ticker}</span>
                      <span className="text-[10px] text-[var(--text-muted)] truncate max-w-[120px]">{w.display_name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {q ? (
                        <div className="text-right">
                          <p className="text-sm font-semibold text-[var(--text-primary)]">{Number(q.price).toFixed(2)}</p>
                          <p className={`text-xs font-bold ${q.change >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                            {q.change >= 0 ? '+' : ''}{Number(q.changePercent).toFixed(2)}%
                          </p>
                        </div>
                      ) : (
                        q === null ? <span className="text-xs italic text-[var(--text-muted)]">N/A</span> : <Loader2 size={14} className="animate-spin text-[var(--text-muted)]" />
                      )}
                      
                      <button 
                        onClick={() => removeStock(w.ticker)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-red-500 hover:bg-red-500/20 rounded"
                        title="Remove from watchlist"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
