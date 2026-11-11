import { fetchEpisodes, fetchShows } from './api'
import { buildEpisodesReport } from './episodesReport'
import { hideStatus, setStatus, showEpisodesReport, showError, showRetry, showShowsReport } from './output'
import { buildShowsReport } from './showsReport'

async function main() {
  const shows = await fetchShows(showRetry)
  const generatedAt = new Date().toISOString()

  // shown before the episode requests, so it survives if those fail
  const showsReport = buildShowsReport(shows, generatedAt)
  showShowsReport(showsReport)

  setStatus('Caricamento degli episodi delle top 3…')
  const top = showsReport.periods.allTime.ranking
  const inputs = await Promise.all(
    top.map(async (show) => ({ show, episodes: await fetchEpisodes(show.id, showRetry) })),
  )
  showEpisodesReport(buildEpisodesReport(inputs, generatedAt))
  hideStatus()
}

main().catch(showError)