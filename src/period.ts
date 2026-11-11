import type { Show } from './types'

// inclusive, YYYY-MM-DD
export interface Interval {
  start: string
  end: string
}

// premiered is a plain date with no time or offset, so string comparison is enough
export function latestPremiere(shows: Show[]): string {
  const dates = shows.map((s) => s.premiered).filter((d): d is string => !!d)
  // TODO: reduce throws on an empty array (no premieres at all)
  return dates.reduce((latest, d) => (d > latest ? d : latest))
}

export function yearInterval(year: number): Interval {
  return { start: `${year}-01-01`, end: `${year}-12-31` }
}

export function premieredIn(shows: Show[], interval: Interval): Show[] {
  return shows.filter((s) => !!s.premiered && s.premiered >= interval.start && s.premiered <= interval.end)
}