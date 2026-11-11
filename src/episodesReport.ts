import type { Episode } from './types'
import type { RankedShow } from './ranking'
import { byRating, hasRating } from './utils'

export interface EpisodeInput {
  show: RankedShow
  episodes: Episode[]
}

export interface TopEpisode {
  id: number
  name: string
  season: number
  number: number | null
  rating: number
}

export interface EpisodeSheet {
  showId: number
  showName: string
  seasons: number
  episodes: number
  runtime: { totalMinutes: number; episodesWithoutRuntime: number }
  airdates: { first: string | null; last: string | null }
  topEpisode: TopEpisode | null
}

function bestEpisode(episodes: Episode[]): TopEpisode | null {
  const best = episodes.filter(hasRating).sort(byRating)[0]
  if (!best) return null
  return { id: best.id, name: best.name, season: best.season, number: best.number, rating: best.rating.average }
}

// missing runtimes are left out of the total and counted instead of guessed
function episodeSheet({ show, episodes }: EpisodeInput): EpisodeSheet {
  let totalMinutes = 0
  let episodesWithoutRuntime = 0
  for (const ep of episodes) {
    if (ep.runtime === null) episodesWithoutRuntime++
    else totalMinutes += ep.runtime
  }

  // unaired episodes come with an empty airdate
  const airdates = episodes.map((ep) => ep.airdate).filter((d) => !!d).sort()

  return {
    showId: show.id,
    showName: show.name,
    seasons: new Set(episodes.map((ep) => ep.season)).size,
    episodes: episodes.length,
    runtime: { totalMinutes, episodesWithoutRuntime },
    airdates: { first: airdates[0] ?? null, last: airdates[airdates.length - 1] ?? null },
    topEpisode: bestEpisode(episodes),
  }
}

export function buildEpisodesReport(inputs: EpisodeInput[], generatedAt: string) {
  return {
    report: 'top-shows-episodes',
    generatedAt,
    basedOn: {
      report: 'top-shows-by-rating',
      period: 'allTime',
      shows: inputs.map(({ show }) => ({ rank: show.rank, id: show.id, name: show.name })),
    },
    shows: inputs.map(episodeSheet),
  }
}