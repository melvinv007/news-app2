/**
 * app/layout.tsx
 * ─────────────────────────────────────────────────────────────────
 * Root layout. Sets up fonts, metadata, and global styles.
 * No provider wrapper needed — @supabase/ssr handles auth via cookies.
 *
 * Fonts loaded via next/font (zero layout shift, cached after first load):
 *   Lora          → article summaries and body text
 *   Bricolage Grotesque → headlines
 *   DM Sans       → UI chrome (nav, labels, timestamps)
 *   JetBrains Mono → stock prices and numbers
 */

import type { Metadata, Viewport } from 'next';
import { Lora, Bricolage_Grotesque, DM_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const lora = Lora({
  subsets: ['latin'],
  variable: '--font-lora',
  display: 'swap',
});

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-bricolage',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const jetBrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'My News',
  description: 'Personal AI-powered news dashboard',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.ico' },
    ],
    apple: { url: '/apple-touch-icon.png', sizes: '180x180' },
    shortcut: '/favicon.ico',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'My News',
  },
};

export const viewport: Viewport = {
  themeColor: '#1c1917',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${lora.variable} ${bricolage.variable} ${dmSans.variable} ${jetBrains.variable}`}
    >
      <body className="bg-[#1c1917] text-[#fafaf9] antialiased">
        {children}
      </body>
    </html>
  );
}
