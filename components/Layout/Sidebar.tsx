/**
 * components/Layout/Sidebar.tsx
 * ─────────────────────────────────────────────────────────────────
 * Desktop sidebar navigation. Collapsible with Framer Motion spring
 * animations — w-16 (icons only) ↔ w-64 (icons + labels).
 *
 * State is owned by app/(app)/layout.tsx and passed as props:
 *   collapsed: boolean  — current collapsed state
 *   onToggle:  () => void — toggles collapsed state
 *
 * Active section highlighted with amber accent + subtle bg.
 * Hidden on mobile (md:flex). Mobile uses BottomNav instead.
 *
 * How to add a section: Add entry to NAV_ITEMS array below.
 * Used by: app/(app)/layout.tsx
 */

'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Globe,
  Flag,
  Building2,
  Cpu,
  Briefcase,
  Trophy,
  TrendingUp,
  Eye,
  Settings,
  Menu,
  ChevronLeft,
  type LucideIcon,
} from 'lucide-react';

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

const NAV_ITEMS: NavItem[] = [
  { label: 'World',     href: '/world',     icon: Globe },
  { label: 'India',     href: '/india',     icon: Flag },
  { label: 'Mumbai',    href: '/mumbai',    icon: Building2 },
  { label: 'AI / Tech', href: '/ai-tech',   icon: Cpu },
  { label: 'Business',  href: '/business',  icon: Briefcase },
  { label: 'Sports',    href: '/sports',    icon: Trophy },
  { label: 'Stocks',    href: '/stocks',    icon: TrendingUp },
  { label: 'Watchlist', href: '/watchlist',  icon: Eye },
  { label: 'Settings',  href: '/settings',  icon: Settings },
];

const sidebarVariants = {
  collapsed: { width: 64 },
  expanded:  { width: 256 },
};

const springTransition = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 30,
};

type SidebarProps = {
  /** Whether the sidebar is in collapsed (icons-only) mode */
  collapsed: boolean;
  /** Callback to toggle collapsed state — owned by parent layout */
  onToggle: () => void;
};

export default function Sidebar({ collapsed, onToggle }: SidebarProps): React.ReactElement {
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
    <motion.aside
      className="hidden md:flex flex-col fixed left-0 top-0 h-screen z-40 border-r"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--bg-tertiary)',
      }}
      variants={sidebarVariants}
      animate={collapsed ? 'collapsed' : 'expanded'}
      transition={springTransition}
      aria-label="Main navigation"
    >
      {/* Toggle button */}
      <div
        className="flex items-center h-14 px-4"
        style={{ justifyContent: collapsed ? 'center' : 'space-between' }}
      >
        {!collapsed && (
          <motion.span
            className="font-display text-lg font-bold truncate"
            style={{ color: 'var(--accent)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            My News
          </motion.span>
        )}
        <button
          onClick={onToggle}
          className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* Navigation items */}
      <nav className="flex flex-col gap-1 px-2 mt-2 flex-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg transition-colors relative group"
              style={{
                padding: collapsed ? '10px 0' : '10px 12px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                backgroundColor: active ? 'var(--accent-subtle)' : 'transparent',
                color: active ? 'var(--accent)' : 'var(--text-muted)',
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--text-muted)';
                }
              }}
            >
              {/* Active indicator bar */}
              {active && (
                <motion.div
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full"
                  style={{
                    height: 24,
                    backgroundColor: 'var(--accent)',
                  }}
                  layoutId="sidebar-active-indicator"
                  transition={springTransition}
                />
              )}

              <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />

              {!collapsed && (
                <motion.span
                  className="font-sans text-sm font-medium truncate"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 }}
                >
                  {item.label}
                </motion.span>
              )}

              {/* Tooltip when collapsed */}
              {collapsed && (
                <div
                  className="absolute left-full ml-2 px-2 py-1 rounded-md text-xs font-sans font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50"
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>
    </motion.aside>
  );
}
