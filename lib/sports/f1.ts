/**
 * lib/sports/f1.ts
 * ─────────────────────────────────────────────────────────────────
 * F1 data helpers. No official free API — data comes from:
 *   - Hardcoded calendar in config/sports.ts (update December each year)
 *   - RSS news articles for results/standings
 */

import { F1_CALENDAR_2026, getNextRace, type F1Race } from '@/config/sports';

export function getCalendar(): F1Race[] {
  return F1_CALENDAR_2026;
}

export { getNextRace };

export function getRacesWithStatus(): (F1Race & { isPast: boolean; isNext: boolean })[] {
  const today = new Date().toISOString().split('T')[0];
  const next = getNextRace();
  return F1_CALENDAR_2026.map(race => ({
    ...race,
    isPast: race.date < today,
    isNext: race.name === next?.name,
  }));
}

export function getCountdownToNextRace(): { days: number; hours: number; minutes: number } | null {
  const next = getNextRace();
  if (!next) return null;

  const raceDate = new Date(`${next.date}T05:10:00Z`); // F1 races typically start ~10:10 UTC
  const now = new Date();
  const diff = raceDate.getTime() - now.getTime();

  if (diff <= 0) return null;

  const days    = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours   = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return { days, hours, minutes };
}
