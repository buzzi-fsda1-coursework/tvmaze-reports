import { ApiError, fetchEpisodes, fetchShows } from './api'
import { buildEpisodesReport } from './episodesReport'
import { buildShowsReport } from './showsReport'

function print(report: object) {
  console.log(JSON.stringify(report, null, 2))
}

async function main() {
  const shows = await fetchShows()
  const generatedAt = new Date().toISOString()

  // printed before the episode requests, so it survives if those fail
  const showsReport = buildShowsReport(shows, generatedAt)
  print(showsReport)

  const top = showsReport.periods.allTime.ranking
  const inputs = await Promise.all(top.map(async (show) => ({ show, episodes: await fetchEpisodes(show.id) })))
  print(buildEpisodesReport(inputs, generatedAt))
}

main().catch((err) => {
  if (err instanceof ApiError) console.error(`Impossibile completare i report. ${err.message}`)
  else console.error('Errore inatteso durante la generazione dei report:', err)
})