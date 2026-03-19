/**
 * app/(app)/settings/users/page.tsx
 * ─────────────────────────────────────────────────────────────────
 * User management page (admin only).
 *
 * Used by: app/(app)/layout.tsx (routed via /settings/users)
 */

'use client';

import SectionHeader from '@/components/Layout/SectionHeader';
import UserManager from '@/components/Settings/UserManager';

export default function UsersSettingsPage(): React.ReactElement {
  return (
    <>
      <SectionHeader title="Users" subtitle="Manage Supabase auth users" />
      <UserManager />
    </>
  );
}
