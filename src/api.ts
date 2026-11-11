import type { Episode, Show } from './types'

const BASE_URL = 'https://api.tvmaze.com'
const MAX_RETRIES = 3
const TIMEOUT_MS = 10_000

export const SHOW_PAGES = [0]

export class ApiError extends Error {}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// null = no response at all: offline, timeout, or a 429 the browser blocked for CORS
async function request(path: string): Promise<Response | null> {
  try {
    return await fetch(BASE_URL + path, { signal: AbortSignal.timeout(TIMEOUT_MS) })
  } catch {
    return null
  }
}

// Retry-After is rarely readable cross-origin, so fall back to 2s, 4s, 8s
function retryDelay(res: Response | null, attempt: number): number {
  const seconds = Number(res?.headers.get('Retry-After'))
  return seconds > 0 ? seconds * 1000 : 2000 * 2 ** attempt
}

// T is a promise to the compiler, nothing is checked at runtime
async function getJson<T>(path: string): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    const res = await request(path)
    if (res?.ok) return res.json()

    const retryable = res === null || res.status === 429
    if (!retryable || attempt === MAX_RETRIES) {
      const reason = res ? `HTTP ${res.status}` : 'nessuna risposta (rete o timeout)'
      throw new ApiError(`GET ${path}: ${reason}`)
    }

    const delay = retryDelay(res, attempt)
    console.warn(`GET ${path}: ${res ? `HTTP ${res.status}` : 'nessuna risposta'}, nuovo tentativo tra ${delay / 1000}s`)
    await sleep(delay)
  }
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