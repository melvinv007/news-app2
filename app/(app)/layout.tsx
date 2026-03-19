/**
 * app/(app)/layout.tsx
 * ─────────────────────────────────────────────────────────────────
 * App shell layout for all authenticated routes. Renders the desktop
 * Sidebar and mobile BottomNav around the main content area.
 *
 * This layout is the single source of truth for sidebar collapsed state.
 * It reads the initial value from localStorage and persists on toggle.
 * The Sidebar receives collapsed + onToggle as props (no polling).
 *
 * SidebarContext is imported from components/Layout/SidebarContext.tsx
 * (Next.js disallows named exports from layout files).
 *
 * Desktop: fixed sidebar (w-16/w-64) on left + scrollable main content.
 * Mobile:  full-width content + fixed bottom tab bar.
 *
 * How to add a new section: Add the route inside this (app) group,
 * then update Sidebar NAV_ITEMS and/or BottomNav NAV_ITEMS.
 *
 * Used by: All protected pages (world, india, sports, stocks, etc.)
 */

'use client';

import {
  useState,
  useCallback,
  useEffect,
  type ReactNode,
  type ReactElement,
} from 'react';
import Sidebar from '@/components/Layout/Sidebar';
import BottomNav from '@/components/Layout/BottomNav';
import { SidebarContext } from '@/components/Layout/SidebarContext';

const STORAGE_KEY = 'sidebar-collapsed';

export default function AppLayout({
  children,
}: {
  children: ReactNode;
}): ReactElement {
  const [collapsed, setCollapsed] = useState<boolean>(true);
  const [mounted, setMounted] = useState<boolean>(false);

  // Read initial value from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      setCollapsed(stored === 'true');
    }
    setMounted(true);
  }, []);

  // Toggle handler — updates state + persists to localStorage
  const handleToggle = useCallback((): void => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  const isCollapsed = mounted ? collapsed : true;

  return (
    <SidebarContext.Provider value={{ collapsed: isCollapsed }}>
      <Sidebar collapsed={isCollapsed} onToggle={handleToggle} />

      <main className="min-h-screen">
        {/* Desktop: offset by sidebar width. Mobile: full width + bottom padding for BottomNav */}
        <div
          className={`px-4 py-6 md:px-6 md:py-8 pb-20 md:pb-8 transition-all duration-300 ease-out ${isCollapsed ? 'md:ml-16' : 'md:ml-64'}`}
        >
          {children}
        </div>
      </main>

      <BottomNav />
    </SidebarContext.Provider>
  );
}
