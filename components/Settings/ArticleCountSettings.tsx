'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Counts = {
  world: number;
  india: number;
  mumbai: number;
  'ai-tech': number;
  business: number;
  'sports-cricket': number;
  'sports-football': number;
  'sports-f1': number;
  'sports-other': number;
  stocks: number;
};

const defaultCounts: Counts = {
  world: 50, india: 50, mumbai: 50,
  'ai-tech': 50, business: 50,
  'sports-cricket': 50, 'sports-football': 50,
  'sports-f1': 50, 'sports-other': 50,
  stocks: 50
};

const LABELS: Record<keyof Counts, string> = {
  world: 'World',
  india: 'India',
  mumbai: 'Mumbai',
  'ai-tech': 'AI / Tech',
  business: 'Business',
  'sports-cricket': 'Cricket',
  'sports-football': 'Football',
  'sports-f1': 'F1',
  'sports-other': 'Other Sports',
  stocks: 'Stocks'
};

export default function ArticleCountSettings({ current }: { current: Partial<Counts> }) {
  const [counts, setCounts] = useState<Counts>({ ...defaultCounts, ...current });
  const [saving, setSaving] = useState(false);
  const supabase = createClient() as any;
  
  const handleChange = async (key: keyof Counts, value: number) => {
    const val = Math.max(10, Math.min(100, value));
    const nextCounts = { ...counts, [key]: val };
    setCounts(nextCounts);
    
    setSaving(true);
    await supabase.from('user_preferences').update({ section_article_counts: nextCounts }).eq('id', 1);
    setSaving(false);
  };

  return (
    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      {Object.entries(LABELS).map(([key, label], i, arr) => {
        const k = key as keyof Counts;
        
        return (
          <div 
            key={k} 
            className={`flex items-center justify-between p-4 ${i !== arr.length - 1 ? 'border-b' : ''}`}
            style={{ borderColor: 'var(--border)' }}
          >
            <div>
              <p className="font-sans text-sm text-[var(--text-primary)] font-medium mb-0.5">{label}</p>
              <p className="font-sans text-xs text-[var(--text-muted)]">Articles to fetch (10 - 100)</p>
            </div>
            <div className="flex items-center gap-2">
              <input 
                type="number"
                min={10}
                max={100}
                value={counts[k]}
                onChange={(e) => handleChange(k, parseInt(e.target.value) || 50)}
                className="w-16 px-2 py-1 rounded text-center font-sans text-sm font-semibold border-none outline-none focus:ring-2 focus:ring-[var(--accent)]"
                style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
