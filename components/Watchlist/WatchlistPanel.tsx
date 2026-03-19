/**
 * components/Watchlist/WatchlistPanel.tsx
 * ─────────────────────────────────────────────────────────────────
 * List of all user watchlist items with management controls.
 *
 * Each item: label + type badge + unread_count amber badge + remove button.
 * Unread badge click → marks as read (resets to 0).
 * "Add Topic" button opens AddTopicModal.
 * Empty state if no items.
 *
 * How to change: Edit this file only.
 * Used by: app/(app)/watchlist/page.tsx
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, X, Eye, Loader2, Bookmark } from 'lucide-react';
import type { WatchlistItem } from '@/lib/supabase/types';
import AddTopicModal from '@/components/Watchlist/AddTopicModal';

export default function WatchlistPanel(): React.ReactElement {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchItems = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch('/api/watchlist');
      if (res.ok) {
        const data = (await res.json()) as { items: WatchlistItem[] };
        setItems(data.items);
      }
    } catch { /* graceful */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleRemove = async (id: string): Promise<void> => {
    try {
      const res = await fetch('/api/watchlist', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.id !== id));
      }
    } catch { /* graceful */ }
  };

  const handleMarkRead = async (id: string): Promise<void> => {
    // Optimistic update
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, unread_count: 0 } : i)),
    );
    // No API for this yet — will be implemented when user_watchlist has an endpoint
  };

  if (loading) {
    return (
      <div
        className="rounded-xl p-4 md:p-5"
        style={{ backgroundColor: 'var(--bg-secondary)' }}
      >
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 rounded-lg shimmer" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className="rounded-xl p-4 md:p-5"
        style={{ backgroundColor: 'var(--bg-secondary)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <span className="font-sans text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Tracked Topics
          </span>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-sans text-xs font-medium transition-colors"
            style={{ backgroundColor: 'var(--accent)', color: 'var(--bg-primary)' }}
          >
            <Plus size={12} />
            Add Topic
          </button>
        </div>

        {items.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: 'var(--bg-tertiary)' }}
            >
              <Bookmark size={24} style={{ color: 'var(--text-muted)' }} />
            </div>
            <p className="font-sans text-sm" style={{ color: 'var(--text-muted)' }}>
              No topics tracked yet
            </p>
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg font-sans text-sm font-medium transition-colors"
              style={{ backgroundColor: 'var(--accent)', color: 'var(--bg-primary)' }}
            >
              <Plus size={14} />
              Add your first topic
            </button>
          </div>
        ) : (
          /* Items list */
          <div className="space-y-1.5">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors"
                style={{ backgroundColor: 'var(--bg-primary)' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-primary)')}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="font-sans text-sm font-medium truncate"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {item.label}
                  </span>
                  <span
                    className="px-1.5 py-0.5 rounded font-sans text-[10px] font-semibold uppercase flex-shrink-0"
                    style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}
                  >
                    {item.type}
                  </span>
                  {item.unread_count > 0 && (
                    <button
                      onClick={() => handleMarkRead(item.id)}
                      className="flex items-center gap-1 px-1.5 py-0.5 rounded-full font-mono text-[10px] font-bold flex-shrink-0 transition-colors"
                      style={{ backgroundColor: 'var(--accent-subtle)', color: 'var(--accent)' }}
                      title="Mark as read"
                    >
                      {item.unread_count} new
                      <Eye size={10} />
                    </button>
                  )}
                </div>

                <button
                  onClick={() => handleRemove(item.id)}
                  className="w-6 h-6 rounded flex items-center justify-center transition-colors flex-shrink-0"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--error)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                  title="Remove topic"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddTopicModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdded={fetchItems}
      />
    </>
  );
}
