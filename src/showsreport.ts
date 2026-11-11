import type { Show } from './types'
import { SHOW_PAGES } from './api'
import { latestPremiere, premieredIn, yearInterval } from './period'
import { topShows } from './ranking'

export function buildShowsReport(shows: Show[]) {
  const anchor = latestPremiere(shows)
  const year = Number(anchor.slice(0, 4))
  const interval = yearInterval(year)

  return {
    report: 'top-shows-by-rating',
    generatedAt: new Date().toISOString(),
    scope: { endpoint: '/shows', pages: SHOW_PAGES },
    reference: { latestPremiere: anchor, year },
    periods: {
      allTime: { interval: null, ranking: topShows(shows) },
      recent: { interval, ranking: topShows(premieredIn(shows, interval)) },
    },
  }
}