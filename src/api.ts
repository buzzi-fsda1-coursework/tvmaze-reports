import type { Episode, Show } from './types'

const BASE_URL = 'https://api.tvmaze.com'

export const SHOW_PAGES = [0]

// T is a promise to the compiler, nothing is checked at runtime
// TODO: check res.ok and handle 429
async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(BASE_URL + path)
  return res.json()
}

export async function fetchShows(): Promise<Show[]> {
  const shows: Show[] = []
  // one page at a time: more pages in parallel would hit the rate limit
  for (const page of SHOW_PAGES) {
    shows.push(...(await getJson<Show[]>(`/shows?page=${page}`)))
  }
  return shows
}

export function fetchEpisodes(showId: number): Promise<Episode[]> {
  return getJson<Episode[]>(`/shows/${showId}/episodes`)
}