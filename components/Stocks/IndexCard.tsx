/**
 * components/Stocks/IndexCard.tsx
 * ─────────────────────────────────────────────────────────────────
 * Shows an index/stock: name + price + change + changePercent.
 * Green for positive change, red for negative. Monospace numbers.
 * Shimmer skeleton while price === null (loading).
 *
 * How to change: Edit this file only.
 * Used by: components/Stocks/StocksWidget.tsx
 */

import { TrendingUp, TrendingDown } from 'lucide-react';

type IndexCardProps = {
  /** Display name (e.g. "NIFTY 50") */
  name: string;
  /** Current price — null while loading */
  price: number | null;
  /** Absolute change */
  change: number | null;
  /** Percentage change */
  changePercent: number | null;
};

export default function IndexCard({
  name,
  price,
  change,
  changePercent,
}: IndexCardProps): React.ReactElement {
  // Loading skeleton
  if (price === null) {
    return (
      <div
        className="rounded-xl p-4 flex flex-col gap-2"
        style={{ backgroundColor: 'var(--bg-secondary)' }}
      >
        <div className="h-3 w-20 rounded shimmer" />
        <div className="h-5 w-24 rounded shimmer" />
        <div className="h-3 w-16 rounded shimmer" />
      </div>
    );
  }

  const isPositive = (change ?? 0) >= 0;
  const changeColor = isPositive ? 'var(--success)' : 'var(--error)';

  return (
    <div
      className="rounded-xl p-4"
      style={{ backgroundColor: 'var(--bg-secondary)' }}
    >
      <p
        className="font-sans text-xs font-medium mb-1"
        style={{ color: 'var(--text-muted)' }}
      >
        {name}
      </p>
      <p
        className="font-mono text-lg font-bold"
        style={{ color: 'var(--text-primary)' }}
      >
        {price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
      </p>
      <div className="flex items-center gap-1.5 mt-1">
        {isPositive ? (
          <TrendingUp size={12} style={{ color: changeColor }} />
        ) : (
          <TrendingDown size={12} style={{ color: changeColor }} />
        )}
        <span className="font-mono text-xs font-medium" style={{ color: changeColor }}>
          {isPositive ? '+' : ''}
          {(change ?? 0).toFixed(2)} ({isPositive ? '+' : ''}
          {(changePercent ?? 0).toFixed(2)}%)
        </span>
      </div>
    </div>
  );
}
