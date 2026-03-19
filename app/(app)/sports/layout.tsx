/**
 * app/(app)/sports/layout.tsx
 * ─────────────────────────────────────────────────────────────────
 * Sports section layout with sub-tabs: Cricket / Football / F1 / Others.
 * Active tab gets an amber underline animated with Framer Motion layoutId.
 *
 * How to add a sport tab: Add to TABS array below.
 * Used by: All sports sub-pages (cricket, football, f1, others)
 */

'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import SectionHeader from '@/components/Layout/SectionHeader';
import type { ReactNode, ReactElement } from 'react';

type Tab = {
  label: string;
  href: string;
};

const TABS: Tab[] = [
  { label: 'Cricket',  href: '/sports/cricket' },
  { label: 'Football', href: '/sports/football' },
  { label: 'F1',       href: '/sports/f1' },
  { label: 'Others',   href: '/sports/others' },
];

const springTransition = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 30,
};

export default function SportsLayout({
  children,
}: {
  children: ReactNode;
}): ReactElement {
  const pathname = usePathname();

  return (
    <>
      <SectionHeader title="Sports" />

      {/* Sub-tabs */}
      <nav className="flex gap-1 mb-6 border-b" style={{ borderColor: 'var(--bg-tertiary)' }}>
        {TABS.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(`${tab.href}/`);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="relative px-4 py-2.5 font-sans text-sm font-medium transition-colors"
              style={{
                color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.color = 'var(--text-secondary)';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.color = 'var(--text-muted)';
              }}
            >
              {tab.label}
              {isActive && (
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                  style={{ backgroundColor: 'var(--accent)' }}
                  layoutId="sports-tab-underline"
                  transition={springTransition}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {children}
    </>
  );
}
