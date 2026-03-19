/**
 * components/Layout/SidebarContext.tsx
 * ─────────────────────────────────────────────────────────────────
 * Shared context for sidebar collapsed state. Separated from
 * layout.tsx because Next.js App Router disallows named exports
 * from layout files.
 *
 * Used by: app/(app)/layout.tsx (provider), any child (consumer)
 */

'use client';

import { createContext, useContext } from 'react';

type SidebarContextValue = {
  collapsed: boolean;
};

export const SidebarContext = createContext<SidebarContextValue>({ collapsed: true });

/** Hook to read sidebar collapsed state from any child component */
export function useSidebarState(): SidebarContextValue {
  return useContext(SidebarContext);
}
