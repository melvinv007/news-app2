/**
 * app/(app)/settings/page.tsx
 * ─────────────────────────────────────────────────────────────────
 * Main settings page. Shows HealthDashboard and ErrorLog sections.
 *
 * Used by: app/(app)/layout.tsx (routed via /settings)
 */

'use client';

import SectionHeader from '@/components/Layout/SectionHeader';
import HealthDashboard from '@/components/Settings/HealthDashboard';
import ErrorLog from '@/components/Settings/ErrorLog';

export default function SettingsPage(): React.ReactElement {
  return (
    <>
      <SectionHeader title="Settings" subtitle="System health and logs" />

      {/* System Health */}
      <div className="mb-6">
        <h2
          className="font-display text-base font-semibold mb-3"
          style={{ color: 'var(--text-primary)' }}
        >
          System Health
        </h2>
        <HealthDashboard />
      </div>

      {/* Error Log */}
      <div>
        <h2
          className="font-display text-base font-semibold mb-3"
          style={{ color: 'var(--text-primary)' }}
        >
          Error Log
        </h2>
        <ErrorLog />
      </div>
    </>
  );
}
