/**
 * components/Layout/BottomNav.tsx
 * ─────────────────────────────────────────────────────────────────
 * Mobile bottom tab bar. Fixed to bottom, shows 5 most-used sections:
 * World, India, Sports, AI/Tech, Settings.
 *
 * Active tab highlighted with amber accent. Visible only below md breakpoint.
 * Desktop uses Sidebar instead.
 *
 * How to change tabs: Edit NAV_ITEMS array below.
 * Used by: app/(app)/layout.tsx
 */

'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Globe,
  Flag,
  Trophy,
  Cpu,
  Settings,
  type LucideIcon,
} from 'lucide-react';

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

const NAV_ITEMS: NavItem[] = [
  { label: 'World',   href: '/world',    icon: Globe },
  { label: 'India',   href: '/india',    icon: Flag },
  { label: 'Sports',  href: '/sports',   icon: Trophy },
  { label: 'AI/Tech', href: '/ai-tech',  icon: Cpu },
  { label: 'Settings',href: '/settings', icon: Settings },
];

const springTransition = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 30,
};

export default function BottomNav(): React.ReactElement {
  const pathname = usePathname();

  function isActive(href: string): boolean {
    if (href === '/sports') {
      return pathname.startsWith('/sports');
    }
    if (href === '/settings') {
      return pathname.startsWith('/settings');
    }
    return pathname === href;
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex md:hidden border-t"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--bg-tertiary)',
      }}
      aria-label="Mobile navigation"
    >
      {NAV_ITEMS.map((item) => {
        const active = isActive(item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center justify-center flex-1 py-2 gap-0.5 relative"
            style={{
              color: active ? 'var(--accent)' : 'var(--text-muted)',
            }}
          >
            {/* Active indicator dot */}
            {active && (
              <motion.div
                className="absolute top-0 left-1/2 -translate-x-1/2 rounded-full"
                style={{
                  width: 20,
                  height: 3,
                  backgroundColor: 'var(--accent)',
                }}
                layoutId="bottom-nav-indicator"
                transition={springTransition}
              />
            )}

            <Icon size={20} strokeWidth={active ? 2.2 : 1.6} />
            <span
              className="text-[10px] font-sans font-medium"
              style={{
                color: active ? 'var(--accent)' : 'var(--text-muted)',
              }}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
