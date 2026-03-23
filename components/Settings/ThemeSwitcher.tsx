'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Check } from 'lucide-react';

const THEMES = [
  { id: 'stone-dark', name: 'Stone', accent: '#f59e0b', bg: '#1c1917' },
  { id: 'slate-dark', name: 'Slate', accent: '#3b82f6', bg: '#0f172a' },
  { id: 'zinc-dark', name: 'Zinc', accent: '#a855f7', bg: '#18181b' },
  { id: 'forest-dark', name: 'Forest', accent: '#22c55e', bg: '#0f1a0f' },
  { id: 'midnight', name: 'Midnight', accent: '#ffffff', bg: '#000000' },
];

export default function ThemeSwitcher({ currentTheme }: { currentTheme: string }) {
  const [active, setActive] = useState(currentTheme);
  const supabase = createClient() as any;

  const handleSelect = async (id: string) => {
    setActive(id);
    document.documentElement.setAttribute('data-theme', id);
    // Persist to user_preferences
    await supabase.from('user_preferences').update({ theme: id }).eq('id', 1);
  };

  return (
    <div className="flex flex-wrap gap-4 p-4 rounded-xl items-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      {THEMES.map((t) => (
        <button
          key={t.id}
          onClick={() => handleSelect(t.id)}
          className="group flex flex-col items-center gap-2 transition-transform hover:scale-105"
        >
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center relative border-2 transition-colors"
            style={{ 
              backgroundColor: t.bg, 
              borderColor: active === t.id ? t.accent : 'var(--border)' 
            }}
          >
            {active === t.id && <Check size={20} color={t.accent} />}
            <div 
              className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2"
              style={{ backgroundColor: t.accent, borderColor: 'var(--bg-primary)' }}
            />
          </div>
          <span className="text-xs font-sans font-medium" style={{ color: active === t.id ? 'var(--text-primary)' : 'var(--text-muted)' }}>
            {t.name}
          </span>
        </button>
      ))}
    </div>
  );
}
