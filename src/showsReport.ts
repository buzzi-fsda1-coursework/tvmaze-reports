import type { Show } from './types'
import { SHOW_PAGES } from './api'
import { latestPremiere, premieredIn, yearInterval } from './period'
import { topShows } from './ranking'
import { RATING_ORDER } from './utils'

export function buildShowsReport(shows: Show[], generatedAt: string) {
  const latest = latestPremiere(shows)
  const year = latest ? Number(latest.slice(0, 4)) : null
  const interval = year === null ? null : yearInterval(year)

  return {
    report: 'top-shows-by-rating',
    generatedAt,
    scope: { endpoint: '/shows', pages: SHOW_PAGES },
    anchor: { latestPremiere: latest, year },
    rankedBy: RATING_ORDER,
    periods: {
      allTime: { interval: null, ranking: topShows(shows) },
      recent: { interval, ranking: topShows(premieredIn(shows, interval)) },
    },
  }
}