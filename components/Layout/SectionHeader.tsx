/**
 * components/Layout/SectionHeader.tsx
 * ─────────────────────────────────────────────────────────────────
 * Reusable section header for each category page. Renders the section
 * title in Bricolage Grotesque display font with an optional subtitle
 * and right-side action slot.
 *
 * How to use: <SectionHeader title="World" subtitle="Personalised for you" />
 * Used by: All category pages (world, india, mumbai, ai-tech, etc.)
 */

import type { ReactNode, ReactElement } from 'react';

type SectionHeaderProps = {
  /** Section title displayed in display font */
  title: string;
  /** Optional subtitle / description below the title */
  subtitle?: string;
  /** Optional slot for action buttons (e.g. filter, refresh) */
  action?: ReactNode;
};

export default function SectionHeader({
  title,
  subtitle,
  action,
}: SectionHeaderProps): ReactElement {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h1
          className="font-display text-xl font-bold leading-tight"
          style={{ color: 'var(--text-primary)' }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            className="font-sans text-sm mt-1"
            style={{ color: 'var(--text-muted)' }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
