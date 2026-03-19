/**
 * app/(app)/settings/sources/page.tsx
 * ─────────────────────────────────────────────────────────────────
 * News sources management page.
 *
 * Used by: app/(app)/layout.tsx (routed via /settings/sources)
 */

'use client';

import SectionHeader from '@/components/Layout/SectionHeader';
import SourceManager from '@/components/Settings/SourceManager';

export default function SourcesSettingsPage(): React.ReactElement {
  return (
    <>
      <SectionHeader title="News Sources" subtitle="Manage RSS feeds and overrides" />
      <SourceManager />
    </>
  );
}
