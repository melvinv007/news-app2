/**
 * components/ArticleCard/StockBadge.tsx
 * ─────────────────────────────────────────────────────────────────
 * Compact badge showing a stock ticker with optional price change.
 * Displays in monospace font with green (up) / red (down) coloring.
 *
 * How to change badge style: Edit this file only.
 * Used by: components/ArticleCard/index.tsx
 */

import { TrendingUp, TrendingDown } from 'lucide-react';

type StockBadgeProps = {
  /** Stock ticker symbol (e.g. "TATAMOTORS.NS" or "AAPL") */
  ticker: string;
  /** Optional price change percentage (positive = up, negative = down) */
  changePercent?: number | null;
};

export default function StockBadge({
  ticker,
  changePercent,
}: StockBadgeProps): React.ReactElement {
  const isPositive = changePercent != null && changePercent >= 0;
  const changeColor = changePercent == null
    ? 'var(--text-muted)'
    : isPositive
      ? 'var(--success)'
      : 'var(--error)';

  // Display clean ticker — remove exchange suffix for compact display
  const displayTicker = ticker.replace(/\.(NS|BO|TO)$/, '');

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-xs font-medium"
      style={{
        backgroundColor: 'var(--bg-tertiary)',
        color: changeColor,
      }}
    >
      {displayTicker}
      {changePercent != null && (
        <>
          {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
          <span>
            {isPositive ? '▲' : '▼'}
            {Math.abs(changePercent).toFixed(1)}%
          </span>
        </>
      )}
    </span>
  );
}
