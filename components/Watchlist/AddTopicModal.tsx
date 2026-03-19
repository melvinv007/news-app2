/**
 * components/Watchlist/AddTopicModal.tsx
 * ─────────────────────────────────────────────────────────────────
 * Modal for adding a new topic to the user's watchlist.
 * Built on @radix-ui/react-dialog.
 *
 * Input: topic name + type selector (topic/person/company).
 * Submit → POST /api/watchlist → AI generates keywords → success state.
 *
 * How to change: Edit this file only.
 * Used by: components/Watchlist/WatchlistPanel.tsx
 */

'use client';

import { useState, useCallback } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Loader2, CheckCircle2, Search } from 'lucide-react';

type AddTopicModalProps = {
  /** Whether the modal is open */
  open: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** Callback after successfully adding a topic */
  onAdded: () => void;
};

type GeneratedKeywords = {
  canonical_name: string;
  search_keywords: string[];
  related_terms: string[];
  type: string;
};

const slideSpring = { type: 'spring' as const, stiffness: 300, damping: 30 };

export default function AddTopicModal({
  open,
  onClose,
  onAdded,
}: AddTopicModalProps): React.ReactElement {
  const [topic, setTopic] = useState('');
  const [type, setType] = useState<'topic' | 'person' | 'company'>('topic');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [keywords, setKeywords] = useState<GeneratedKeywords | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async (): Promise<void> => {
    if (!topic.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.trim(), type }),
      });

      if (res.ok) {
        const data = (await res.json()) as { keywords: GeneratedKeywords };
        setKeywords(data.keywords);
        setSuccess(true);
        onAdded();
      } else {
        const data = (await res.json()) as { error: string };
        setError(data.error || 'Failed to add topic.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [topic, type, onAdded]);

  const handleClose = (): void => {
    setTopic('');
    setType('topic');
    setSuccess(false);
    setKeywords(null);
    setError(null);
    onClose();
  };

  return (
    <Dialog.Root open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 z-50"
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            </Dialog.Overlay>

            <Dialog.Content asChild>
              <motion.div
                className="fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl p-6"
                style={{ backgroundColor: 'var(--bg-secondary)' }}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={slideSpring}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                  <Dialog.Title className="font-display text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Add to Watchlist
                  </Dialog.Title>
                  <Dialog.Close asChild>
                    <button
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                      style={{ color: 'var(--text-muted)' }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <X size={16} />
                    </button>
                  </Dialog.Close>
                </div>

                {success && keywords ? (
                  /* Success state */
                  <div className="text-center py-4">
                    <CheckCircle2
                      size={40}
                      className="mx-auto mb-3"
                      style={{ color: 'var(--success)' }}
                    />
                    <p className="font-sans text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>
                      Added &ldquo;{keywords.canonical_name}&rdquo;
                    </p>
                    <div className="text-left rounded-lg p-3" style={{ backgroundColor: 'var(--bg-primary)' }}>
                      <p className="font-sans text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                        Generated Keywords
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {keywords.search_keywords.map((kw) => (
                          <span
                            key={kw}
                            className="px-2 py-0.5 rounded-full font-sans text-xs"
                            style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={handleClose}
                      className="mt-4 px-4 py-2 rounded-lg font-sans text-sm font-medium transition-colors"
                      style={{ backgroundColor: 'var(--accent)', color: 'var(--bg-primary)' }}
                    >
                      Done
                    </button>
                  </div>
                ) : (
                  /* Input form */
                  <div className="space-y-4">
                    {/* Topic input */}
                    <div>
                      <label className="font-sans text-xs font-medium block mb-1.5" style={{ color: 'var(--text-muted)' }}>
                        Topic
                      </label>
                      <div className="relative">
                        <Search
                          size={14}
                          className="absolute left-3 top-1/2 -translate-y-1/2"
                          style={{ color: 'var(--text-muted)' }}
                        />
                        <input
                          type="text"
                          placeholder='e.g. "Elon Musk", "AI regulation", "Adani Group"'
                          value={topic}
                          onChange={(e) => setTopic(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
                          className="w-full pl-9 pr-3 py-2.5 rounded-lg font-sans text-sm border-none outline-none"
                          style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                          autoFocus
                        />
                      </div>
                    </div>

                    {/* Type selector */}
                    <div>
                      <label className="font-sans text-xs font-medium block mb-1.5" style={{ color: 'var(--text-muted)' }}>
                        Type
                      </label>
                      <div className="flex gap-2">
                        {(['topic', 'person', 'company'] as const).map((t) => (
                          <button
                            key={t}
                            onClick={() => setType(t)}
                            className="px-3 py-1.5 rounded-lg font-sans text-xs font-medium capitalize transition-colors"
                            style={{
                              backgroundColor: type === t ? 'var(--accent)' : 'var(--bg-primary)',
                              color: type === t ? 'var(--bg-primary)' : 'var(--text-muted)',
                            }}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Error */}
                    {error && (
                      <p className="font-sans text-xs" style={{ color: 'var(--error)' }}>
                        {error}
                      </p>
                    )}

                    {/* Submit */}
                    <button
                      onClick={handleSubmit}
                      disabled={loading || !topic.trim()}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-sans text-sm font-medium transition-colors disabled:opacity-50"
                      style={{ backgroundColor: 'var(--accent)', color: 'var(--bg-primary)' }}
                    >
                      {loading ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          AI is generating keywords…
                        </>
                      ) : (
                        <>
                          <Plus size={14} />
                          Add to Watchlist
                        </>
                      )}
                    </button>

                    <Dialog.Description className="font-sans text-xs text-center" style={{ color: 'var(--text-muted)' }}>
                      AI will generate search keywords to find matching articles automatically.
                    </Dialog.Description>
                  </div>
                )}
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
