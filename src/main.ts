import { fetchShows } from './api'
import { topShows } from './ranking'

async function main() {
  const shows = await fetchShows()
  console.log(JSON.stringify(topShows(shows), null, 2))
}

main()