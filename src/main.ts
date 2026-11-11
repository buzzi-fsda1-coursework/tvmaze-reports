import { fetchShows } from './api'
import { buildShowsReport } from './showsReport'

async function main() {
  const shows = await fetchShows()
  const generatedAt = new Date().toISOString()
  console.log(JSON.stringify(buildShowsReport(shows, generatedAt), null, 2))
}

main()