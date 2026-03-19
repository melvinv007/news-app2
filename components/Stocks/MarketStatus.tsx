/**
 * components/Stocks/MarketStatus.tsx
 * ─────────────────────────────────────────────────────────────────
 * Shows "Market Open" or "Market Closed" badges for IN and US markets.
 * Green dot when open, grey when closed. Updates every minute.
 *
 * How to change: Edit this file only.
 * Used by: components/Stocks/StocksWidget.tsx
 */

'use client';

import { useState, useEffect } from 'react';
import { isMarketOpen } from '@/lib/stocks/yahoo';

export default function MarketStatus(): React.ReactElement {
  const [inOpen, setInOpen] = useState<boolean>(false);
  const [usOpen, setUsOpen] = useState<boolean>(false);

  useEffect(() => {
    function update(): void {
      setInOpen(isMarketOpen('IN'));
      setUsOpen(isMarketOpen('US'));
    }
    update();
    const interval = setInterval(update, 60_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-4 font-sans text-xs">
      <StatusBadge label="NSE/BSE" isOpen={inOpen} />
      <StatusBadge label="NYSE" isOpen={usOpen} />
    </div>
  );
}

function StatusBadge({
  label,
  isOpen,
}: {
  label: string;
  isOpen: boolean;
}): React.ReactElement {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className="w-2 h-2 rounded-full"
        style={{
          backgroundColor: isOpen ? 'var(--success)' : 'var(--text-muted)',
        }}
      />
      <span style={{ color: 'var(--text-muted)' }}>
        {label}:{' '}
        <span
          className="font-medium"
          style={{ color: isOpen ? 'var(--success)' : 'var(--text-muted)' }}
        >
          {isOpen ? 'Open' : 'Closed'}
        </span>
      </span>
    </span>
  );
}
