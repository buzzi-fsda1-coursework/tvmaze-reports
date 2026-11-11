import { fetchShows } from './api'
import { buildShowsReport } from './showsReport'

async function main() {
  const shows = await fetchShows()
  console.log(JSON.stringify(buildShowsReport(shows), null, 2))
}

main()