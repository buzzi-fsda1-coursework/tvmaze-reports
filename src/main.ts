import { fetchEpisodes, fetchShows } from './api'
import { buildEpisodesReport } from './episodesReport'
import { buildShowsReport } from './showsReport'

async function main() {
  const shows = await fetchShows()
  const generatedAt = new Date().toISOString()

  const showsReport = buildShowsReport(shows, generatedAt)
  const top = showsReport.periods.allTime.ranking
  const inputs = await Promise.all(top.map(async (show) => ({ show, episodes: await fetchEpisodes(show.id) })))
  const episodesReport = buildEpisodesReport(inputs, generatedAt)

  for (const report of [showsReport, episodesReport]) {
    console.log(JSON.stringify(report, null, 2))
  }
}

main()