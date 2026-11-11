import type { Show } from './types'
import { byRating, hasRating } from './utils'

export interface ChannelRef {
  name: string
  type: 'network' | 'webChannel'
}

export interface RankedShow {
  rank: number
  id: number
  name: string
  genres: string[]
  status: string
  premiered: string | null
  rating: number
  runtime: number | null
  channel: ChannelRef | null
}

function channelOf(show: Show): ChannelRef | null {
  if (show.network) return { name: show.network.name, type: 'network' }
  if (show.webChannel) return { name: show.webChannel.name, type: 'webChannel' }
  return null
}

export function topShows(shows: Show[], limit = 3): RankedShow[] {
  return shows
    .filter(hasRating)
    .sort(byRating)
    .slice(0, limit)
    .map((show, i) => ({
      rank: i + 1,
      id: show.id,
      name: show.name,
      genres: show.genres,
      status: show.status,
      premiered: show.premiered,
      rating: show.rating.average,
      runtime: show.runtime ?? show.averageRuntime,
      channel: channelOf(show),
    }))
}