import { fetchEpisodes, fetchShows } from './api'

async function main() {
  const shows = await fetchShows()
  const episodes = await fetchEpisodes(shows[0].id)
  console.log(`${shows.length} serie, ${episodes.length} episodi per "${shows[0].name}"`)
}

main()