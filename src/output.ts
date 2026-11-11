import { ApiError } from './api'
import type { EpisodesReport } from './episodesReport'
import type { ShowsReport } from './showsReport'

function render(text: string, isError = false) {
  const pre = document.createElement('pre')
  pre.textContent = text
  if (isError) pre.style.color = 'crimson'
  document.body.append(pre)
}

// the JSON in the console is the brief's deliverable, whatever the page shows
function logJson(report: object): string {
  const json = JSON.stringify(report, null, 2)
  console.log(json)
  return json
}

export function showShowsReport(report: ShowsReport) {
  render(logJson(report))
}

export function showEpisodesReport(report: EpisodesReport) {
  render(logJson(report))
}

export function showError(err: unknown) {
  const message =
    err instanceof ApiError
      ? `Impossibile completare i report. ${err.message}`
      : `Errore inatteso durante la generazione dei report: ${err}`
  console.error(message, ...(err instanceof ApiError ? [] : [err]))
  render(message, true)
}