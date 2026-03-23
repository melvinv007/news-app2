import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import SectionHeader from '@/components/Layout/SectionHeader';
import HealthDashboard from '@/components/Settings/HealthDashboard';
import ErrorLog from '@/components/Settings/ErrorLog';
import ThemeSwitcher from '@/components/Settings/ThemeSwitcher';
import NotificationSettings from '@/components/Settings/NotificationSettings';
import ArticleCountSettings from '@/components/Settings/ArticleCountSettings';

export default async function SettingsPage() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
  );

  let prefs = null;
  try {
    const { data } = await supabase.from('user_preferences').select('*').eq('id', 1).single();
    if (data) prefs = data;
  } catch {}

  return (
    <>
      <SectionHeader title="Settings" subtitle="Preferences & System health" />
      
      <div className="mb-6">
         <h2 className="font-display text-base font-semibold mb-3 text-[var(--text-primary)]">Theme</h2>
         <ThemeSwitcher currentTheme={prefs?.theme || 'stone-dark'} />
      </div>

      <div className="mb-6">
         <h2 className="font-display text-base font-semibold mb-3 text-[var(--text-primary)]">Notifications</h2>
         <NotificationSettings current={prefs?.notification_settings || {}} />
      </div>

      <div className="mb-6">
         <h2 className="font-display text-base font-semibold mb-3 text-[var(--text-primary)]">Article Limits</h2>
         <ArticleCountSettings current={prefs?.section_article_counts || {}} />
      </div>

      <div className="mb-6">
         <h2 className="font-display text-base font-semibold mb-3 text-[var(--text-primary)]">System Health</h2>
         <HealthDashboard />
      </div>

      <div>
         <h2 className="font-display text-base font-semibold mb-3 text-[var(--text-primary)]">Error Log</h2>
         <ErrorLog />
      </div>
    </>
  );
}
