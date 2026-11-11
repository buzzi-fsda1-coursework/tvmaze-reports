import type { Show } from './types'

// inclusive, YYYY-MM-DD
export interface Interval {
  start: string
  end: string
}

// premiered is a plain date with no time or offset, so string comparison is enough
export function latestPremiere(shows: Show[]): string | null {
  return shows.reduce<string | null>((latest, s) => {
    if (!s.premiered) return latest
    return latest === null || s.premiered > latest ? s.premiered : latest
  }, null)
}

export function yearInterval(year: number): Interval {
  return { start: `${year}-01-01`, end: `${year}-12-31` }
}

export function premieredIn(shows: Show[], interval: Interval | null): Show[] {
  if (!interval) return []
  return shows.filter((s) => !!s.premiered && s.premiered >= interval.start && s.premiered <= interval.end)
}