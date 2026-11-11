import { ApiError, fetchEpisodes, fetchShows } from './api'
import { buildEpisodesReport } from './episodesReport'
import { buildShowsReport } from './showsReport'

function render(text: string, isError = false) {
  const pre = document.createElement('pre')
  pre.textContent = text
  if (isError) pre.style.color = 'crimson'
  document.body.append(pre)
}

function print(report: object) {
  const json = JSON.stringify(report, null, 2)
  console.log(json)
  render(json)
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
  const message =
    err instanceof ApiError
      ? `Impossibile completare i report. ${err.message}`
      : `Errore inatteso durante la generazione dei report: ${err}`
  console.error(message, ...(err instanceof ApiError ? [] : [err]))
  render(message, true)
})