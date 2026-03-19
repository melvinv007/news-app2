/**
 * app/(auth)/login/page.tsx
 * ─────────────────────────────────────────────────────────────────
 * Login page. Google OAuth only — no password, no email/password form.
 * Clean, minimal dark UI. Only the owner's Google account can log in
 * (enforced by Supabase RLS after first login).
 */

'use client';

import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const handleGoogleLogin = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
      <div className="w-full max-w-sm mx-4">
        {/* Logo / App name */}
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl text-[var(--text-primary)] mb-2">
            My News
          </h1>
          <p className="font-sans text-[var(--text-muted)] text-sm">
            Your personal AI news dashboard
          </p>
        </div>

        {/* Login card */}
        <div className="bg-[var(--bg-secondary)] rounded-2xl p-8 shadow-2xl border border-[var(--bg-tertiary)]">
          <p className="font-sans text-[var(--text-secondary)] text-sm text-center mb-6">
            Sign in to access your personalised feed
          </p>

          <button
            onClick={handleGoogleLogin}
            aria-label="Sign in with Google"
            className="
              w-full flex items-center justify-center gap-3
              bg-[var(--accent)] hover:bg-amber-400
              text-[var(--bg-primary)] font-sans font-medium
              px-6 py-3 rounded-xl
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg-secondary)]
              active:scale-[0.98]
            "
          >
            {/* Google icon */}
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
              <path d="M3.964 10.706A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
        </div>

        <p className="font-sans text-[var(--text-muted)] text-xs text-center mt-6">
          Personal use only — no ads, no tracking
        </p>
      </div>
    </div>
  );
}
