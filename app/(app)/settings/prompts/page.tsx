/**
 * app/(app)/settings/prompts/page.tsx
 * ─────────────────────────────────────────────────────────────────
 * AI prompts editor page.
 *
 * Used by: app/(app)/layout.tsx (routed via /settings/prompts)
 */

'use client';

import SectionHeader from '@/components/Layout/SectionHeader';
import PromptViewer from '@/components/Settings/PromptViewer';

export default function PromptsSettingsPage(): React.ReactElement {
  return (
    <>
      <SectionHeader title="AI Prompts" subtitle="Customize how the AI processes articles" />
      <PromptViewer />
    </>
  );
}
