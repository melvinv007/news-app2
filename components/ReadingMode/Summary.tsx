/**
 * components/ReadingMode/Summary.tsx
 * ─────────────────────────────────────────────────────────────────
 * Displays the AI-distilled article summary with an amber left border.
 * Uses Lora serif font at a slightly larger size than card summaries.
 * Shows "SUMMARY" label above in small caps.
 *
 * If summary is null, renders nothing.
 *
 * How to change summary style: Edit this file only.
 * Used by: components/ReadingMode/index.tsx
 */

type SummaryProps = {
  /** AI-distilled summary text (null if unavailable) */
  summary: string | null;
};

export default function Summary({ summary }: SummaryProps): React.ReactElement | null {
  if (!summary) return null;

  return (
    <div
      className="border-l-2 pl-4 py-2"
      style={{ borderColor: 'var(--accent)' }}
    >
      <span
        className="font-sans text-xs font-semibold uppercase tracking-wider block mb-2"
        style={{ color: 'var(--text-muted)' }}
      >
        Summary
      </span>
      <p
        className="font-serif text-base leading-relaxed"
        style={{ color: 'var(--text-primary)' }}
      >
        {summary}
      </p>
    </div>
  );
}
