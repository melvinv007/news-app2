'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Notifications = {
  breaking_news: boolean;
  f1_race_start: boolean;
  daily_digest: boolean;
  watchlist_updates: boolean;
};

const defaultNotifications: Notifications = {
  breaking_news: false,
  f1_race_start: false,
  daily_digest: false,
  watchlist_updates: false
};

const LABELS: Record<keyof Notifications, { title: string, desc: string }> = {
  breaking_news: { title: 'Breaking News', desc: 'Alerts for major world events' },
  f1_race_start: { title: 'F1 Race Start', desc: 'Reminder 30 mins before lights out' },
  daily_digest: { title: 'Daily Digest', desc: 'Email digest of top stories at 8am' },
  watchlist_updates: { title: 'Watchlist Updates', desc: 'Alerts when tracked entities are in the news' },
};

export default function NotificationSettings({ current }: { current: Partial<Notifications> }) {
  const [prefs, setPrefs] = useState<Notifications>({ ...defaultNotifications, ...current });
  const supabase = createClient() as any;
  
  const toggle = async (key: keyof Notifications) => {
    const nextPrefs = { ...prefs, [key]: !prefs[key] };
    setPrefs(nextPrefs);
    await supabase.from('user_preferences').update({ notification_settings: nextPrefs }).eq('id', 1);
  };

  return (
    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      {Object.entries(LABELS).map(([key, info], i, arr) => {
        const k = key as keyof Notifications;
        const isActive = prefs[k];
        
        return (
          <div 
            key={k} 
            className={`flex items-center justify-between p-4 ${i !== arr.length - 1 ? 'border-b' : ''}`}
            style={{ borderColor: 'var(--border)' }}
          >
            <div>
              <p className="font-sans text-sm text-[var(--text-primary)] font-medium mb-0.5">{info.title}</p>
              <p className="font-sans text-xs text-[var(--text-muted)]">{info.desc}</p>
            </div>
            <button
              role="switch"
              aria-checked={isActive}
              onClick={() => toggle(k)}
              className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg-secondary)]"
              style={{ backgroundColor: isActive ? 'var(--accent)' : 'var(--bg-tertiary)' }}
            >
              <span
                aria-hidden="true"
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isActive ? 'translate-x-5' : 'translate-x-0'}`}
              />
            </button>
          </div>
        );
      })}
    </div>
  );
}
