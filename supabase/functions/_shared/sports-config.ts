/**
 * supabase/functions/_shared/sports-config.ts
 * Sports config — copied from config/sports.ts.
 */

export type F1Race = {
  round: number;
  name: string;
  circuit: string;
  country: string;
  date: string;
  sprintDate?: string;
};

export const F1_CALENDAR_2026: F1Race[] = [
  { round: 1,  name: 'Australian Grand Prix',    circuit: 'Albert Park',              country: 'Australia',    date: '2026-03-15' },
  { round: 2,  name: 'Chinese Grand Prix',        circuit: 'Shanghai',                 country: 'China',        date: '2026-03-22', sprintDate: '2026-03-21' },
  { round: 3,  name: 'Japanese Grand Prix',       circuit: 'Suzuka',                   country: 'Japan',        date: '2026-04-05' },
  { round: 4,  name: 'Bahrain Grand Prix',        circuit: 'Sakhir',                   country: 'Bahrain',      date: '2026-04-19' },
  { round: 5,  name: 'Saudi Arabian Grand Prix',  circuit: 'Jeddah',                   country: 'Saudi Arabia', date: '2026-04-26' },
  { round: 6,  name: 'Miami Grand Prix',          circuit: 'Miami International',      country: 'USA',          date: '2026-05-10', sprintDate: '2026-05-09' },
  { round: 7,  name: 'Emilia Romagna Grand Prix', circuit: 'Imola',                    country: 'Italy',        date: '2026-05-24' },
  { round: 8,  name: 'Monaco Grand Prix',         circuit: 'Monte Carlo',              country: 'Monaco',       date: '2026-05-31' },
  { round: 9,  name: 'Spanish Grand Prix',        circuit: 'Barcelona',                country: 'Spain',        date: '2026-06-14' },
  { round: 10, name: 'Canadian Grand Prix',       circuit: 'Montreal',                 country: 'Canada',       date: '2026-06-21' },
  { round: 11, name: 'Austrian Grand Prix',       circuit: 'Red Bull Ring',            country: 'Austria',      date: '2026-06-28' },
  { round: 12, name: 'British Grand Prix',        circuit: 'Silverstone',              country: 'UK',           date: '2026-07-05' },
  { round: 13, name: 'Belgian Grand Prix',        circuit: 'Spa-Francorchamps',        country: 'Belgium',      date: '2026-07-26' },
  { round: 14, name: 'Hungarian Grand Prix',      circuit: 'Hungaroring',              country: 'Hungary',      date: '2026-08-02' },
  { round: 15, name: 'Dutch Grand Prix',          circuit: 'Zandvoort',                country: 'Netherlands',  date: '2026-08-30' },
  { round: 16, name: 'Italian Grand Prix',        circuit: 'Monza',                    country: 'Italy',        date: '2026-09-06' },
  { round: 17, name: 'Azerbaijan Grand Prix',     circuit: 'Baku',                     country: 'Azerbaijan',   date: '2026-09-20' },
  { round: 18, name: 'Singapore Grand Prix',      circuit: 'Marina Bay',               country: 'Singapore',    date: '2026-10-04' },
  { round: 19, name: 'US Grand Prix',             circuit: 'Circuit of Americas',      country: 'USA',          date: '2026-10-18', sprintDate: '2026-10-17' },
  { round: 20, name: 'Mexico City Grand Prix',    circuit: 'Autodromo Hermanos Rodriguez', country: 'Mexico',   date: '2026-10-25' },
  { round: 21, name: 'São Paulo Grand Prix',      circuit: 'Interlagos',               country: 'Brazil',       date: '2026-11-08', sprintDate: '2026-11-07' },
  { round: 22, name: 'Las Vegas Grand Prix',      circuit: 'Las Vegas Strip',          country: 'USA',          date: '2026-11-21', sprintDate: '2026-11-20' },
  { round: 23, name: 'Qatar Grand Prix',          circuit: 'Lusail',                   country: 'Qatar',        date: '2026-11-29', sprintDate: '2026-11-28' },
  { round: 24, name: 'Abu Dhabi Grand Prix',      circuit: 'Yas Marina',               country: 'UAE',          date: '2026-12-06' },
];

export function getNextRace(): F1Race | null {
  const today = new Date().toISOString().split('T')[0];
  return F1_CALENDAR_2026.find(r => r.date >= today) ?? null;
}

export const FOOTBALL_COMPETITIONS = {
  PL: 'PL',
  CL: 'CL',
} as const;

export const FOOTBALL_API_BASE = 'https://api.football-data.org/v4';

export const DEFAULT_INDIA_INDICES = [
  { ticker: '^NSEI',    displayName: 'NIFTY 50' },
  { ticker: '^BSESN',   displayName: 'SENSEX' },
  { ticker: '^NSEBANK', displayName: 'Bank NIFTY' },
];

export const DEFAULT_US_INDICES = [
  { ticker: '^GSPC', displayName: 'S&P 500' },
  { ticker: '^IXIC', displayName: 'NASDAQ' },
  { ticker: '^DJI',  displayName: 'Dow Jones' },
];
