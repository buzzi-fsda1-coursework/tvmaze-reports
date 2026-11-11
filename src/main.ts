import { fetchEpisodes, fetchShows } from './api'
import { buildEpisodesReport } from './episodesReport'
import { showEpisodesReport, showError, showShowsReport } from './output'
import { buildShowsReport } from './showsReport'

async function main() {
  const shows = await fetchShows()
  const generatedAt = new Date().toISOString()

  // shown before the episode requests, so it survives if those fail
  const showsReport = buildShowsReport(shows, generatedAt)
  showShowsReport(showsReport)

  const top = showsReport.periods.allTime.ranking
  const inputs = await Promise.all(top.map(async (show) => ({ show, episodes: await fetchEpisodes(show.id) })))
  showEpisodesReport(buildEpisodesReport(inputs, generatedAt))
}

main().catch(showError)