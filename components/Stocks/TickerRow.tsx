/**
 * components/Stocks/TickerRow.tsx
 * ─────────────────────────────────────────────────────────────────
 * Compact horizontal row for user's custom watchlist tickers.
 * Shows ticker + display_name + price + change%.
 * Remove button calls DELETE /api/stocks.
 *
 * How to change: Edit this file only.
 * Used by: components/Stocks/StocksWidget.tsx
 */

'use client';

import { useState } from 'react';
import { TrendingUp, TrendingDown, X, Loader2 } from 'lucide-react';

type TickerRowProps = {
  /** Ticker symbol */
  ticker: string;
  /** User-friendly display name */
  displayName: string;
  /** Current price — null while loading */
  price: number | null;
  /** Percentage change */
  changePercent: number | null;
  /** Watchlist item ID for deletion */
  watchlistId: string;
  /** Callback after successful removal */
  onRemoved: (id: string) => void;
};

export default function TickerRow({
  ticker,
  displayName,
  price,
  changePercent,
  watchlistId,
  onRemoved,
}: TickerRowProps): React.ReactElement {
  const [removing, setRemoving] = useState(false);

  const handleRemove = async (): Promise<void> => {
    setRemoving(true);
    try {
      const res = await fetch('/api/stocks', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: watchlistId }),
      });
      if (res.ok) onRemoved(watchlistId);
    } catch {
      // Graceful degrade
    } finally {
      setRemoving(false);
    }
  };

  const isPositive = (changePercent ?? 0) >= 0;
  const changeColor = isPositive ? 'var(--success)' : 'var(--error)';

  return (
    <div
      className="flex items-center justify-between px-3 py-2 rounded-lg transition-colors"
      style={{ backgroundColor: 'var(--bg-primary)' }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)')}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-primary)')}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="min-w-0">
          <p className="font-mono text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
            {ticker}
          </p>
          <p className="font-sans text-xs truncate" style={{ color: 'var(--text-muted)' }}>
            {displayName}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {price === null ? (
          <div className="h-4 w-16 rounded shimmer" />
        ) : (
          <div className="text-right">
            <p className="font-mono text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              {price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </p>
            <div className="flex items-center gap-0.5 justify-end">
              {isPositive ? (
                <TrendingUp size={10} style={{ color: changeColor }} />
              ) : (
                <TrendingDown size={10} style={{ color: changeColor }} />
              )}
              <span className="font-mono text-xs" style={{ color: changeColor }}>
                {isPositive ? '+' : ''}{(changePercent ?? 0).toFixed(2)}%
              </span>
            </div>
          </div>
        )}

        <button
          onClick={handleRemove}
          disabled={removing}
          className="w-6 h-6 rounded flex items-center justify-center transition-colors flex-shrink-0"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--error)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          title="Remove ticker"
        >
          {removing ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <X size={12} />
          )}
        </button>
      </div>
    </div>
  );
}
