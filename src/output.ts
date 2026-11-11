import { ApiError, type RetryInfo } from './api'
import type { EpisodeSheet, EpisodesReport, TopEpisode } from './episodesReport'
import type { ChannelRef, RankedShow } from './ranking'
import type { ShowsReport } from './showsReport'

type Cell = string | number | null

// textContent only: names and genres come from the API
function el<K extends keyof HTMLElementTagNameMap>(tag: K, text?: Cell): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag)
  if (text !== undefined) node.textContent = text === null ? '—' : String(text)
  return node
}

// both live in index.html; missing means the page and the code are out of sync
function byId(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`#${id} missing from index.html`)
  return node
}

export function setStatus(text: string) {
  const status = byId('status')
  status.textContent = text
  status.hidden = false
}

export function hideStatus() {
  byId('status').hidden = true
}

export function showRetry({ status, delayMs }: RetryInfo) {
  const cause = status === 429 ? 'TVmaze ha limitato le richieste' : 'Nessuna risposta da TVmaze'
  setStatus(`${cause}, nuovo tentativo tra ${delayMs / 1000} s…`)
}

// the JSON in the console is the brief's deliverable, whatever the page shows
function logJson(report: object): string {
  const json = JSON.stringify(report, null, 2)
  console.log(json)
  return json
}

function rawJson(json: string): HTMLDetailsElement {
  const details = el('details')
  details.append(el('summary', 'JSON del report'), el('pre', json))
  return details
}

function channelLabel(channel: ChannelRef | null): Cell {
  if (!channel) return null
  return `${channel.name} (${channel.type === 'network' ? 'network' : 'web'})`
}

// header and cell live together, so columns can't get out of step
const SHOW_COLUMNS: Array<[string, (s: RankedShow) => Cell]> = [
  ['#', (s) => s.rank],
  ['ID', (s) => s.id],
  ['Nome', (s) => s.name],
  ['Generi', (s) => s.genres.join(', ') || null],
  ['Stato', (s) => s.status],
  ['Premiere', (s) => s.premiered],
  ['Rating', (s) => s.rating],
  ['Durata', (s) => (s.runtime === null ? null : `${s.runtime} min`)],
  ['Canale', (s) => channelLabel(s.channel)],
]

function rankingTable(ranking: RankedShow[]): HTMLElement {
  if (ranking.length === 0) return el('p', 'Nessuna serie con rating in questo periodo.')

  const table = el('table')
  const head = table.createTHead().insertRow()
  for (const [label] of SHOW_COLUMNS) head.append(el('th', label))

  const body = table.createTBody()
  for (const show of ranking) {
    const row = body.insertRow()
    for (const [, value] of SHOW_COLUMNS) row.append(el('td', value(show)))
  }
  return table
}

export function showShowsReport(report: ShowsReport) {
  const json = logJson(report)
  const { scope, anchor, periods } = report
  const interval = periods.recent.interval

  const section = el('section')
  section.append(
    el('h2', 'Top 3 serie per rating'),
    el('p', `Generato il ${new Date(report.generatedAt).toLocaleString('it-IT')} · Dati: ${scope.endpoint}, pagine ${scope.pages.join(', ')} · Ordine: ${report.rankedBy.join(', ')}`),
    el('h3', 'All time'),
    rankingTable(periods.allTime.ranking),
    el('h3', interval ? `Anno di riferimento: ${anchor.year}` : 'Anno di riferimento: non disponibile'),
    el('p', interval ? `Ultima premiere nei dati: ${anchor.latestPremiere} · intervallo dal ${interval.start} al ${interval.end}` : 'Nessuna serie con data di premiere.'),
    rankingTable(periods.recent.ranking),
    rawJson(json),
  )
  byId('reports').append(section)
}

function runtimeLabel({ totalMinutes, episodesWithoutRuntime }: EpisodeSheet['runtime']): string {
  const total = `${totalMinutes.toLocaleString('it-IT')} min`
  if (episodesWithoutRuntime === 0) return total
  const episodes = episodesWithoutRuntime === 1 ? '1 episodio' : `${episodesWithoutRuntime} episodi`
  return `${total} (esclusi ${episodes} senza durata)`
}

function topEpisodeLabel(ep: TopEpisode | null): string {
  if (!ep) return 'nessun episodio con rating'
  return `"${ep.name}", stagione ${ep.season}, episodio ${ep.number ?? '—'}, rating ${ep.rating} (ID ${ep.id})`
}

const SHEET_FIELDS: Array<[string, (s: EpisodeSheet) => Cell]> = [
  ['Stagioni', (s) => s.seasons],
  ['Episodi', (s) => s.episodes],
  ['Durata totale', (s) => runtimeLabel(s.runtime)],
  ['Primo episodio', (s) => s.airdates.first],
  ['Ultimo episodio', (s) => s.airdates.last],
  ['Episodio migliore', (s) => topEpisodeLabel(s.topEpisode)],
]

function sheetCard(sheet: EpisodeSheet, rank: number | undefined): HTMLElement {
  const list = el('dl')
  for (const [label, value] of SHEET_FIELDS) list.append(el('dt', label), el('dd', value(sheet)))

  const article = el('article')
  article.append(el('h3', `${rank ?? '—'}. ${sheet.showName} (ID ${sheet.showId})`), list)
  return article
}

export function showEpisodesReport(report: EpisodesReport) {
  const json = logJson(report)
  const rankById = new Map(report.basedOn.shows.map((s) => [s.id, s.rank]))

  const section = el('section')
  section.append(
    el('h2', 'Scheda episodi delle top 3 all time'),
    el('p', `Generato il ${new Date(report.generatedAt).toLocaleString('it-IT')} · Serie dalla classifica all time di ${report.basedOn.report}`),
  )
  if (report.sheets.length === 0) section.append(el('p', 'Nessuna serie nella classifica all time.'))
  for (const sheet of report.sheets) section.append(sheetCard(sheet, rankById.get(sheet.showId)))
  section.append(rawJson(json))

  byId('reports').append(section)
}

export function showError(err: unknown) {
  const message =
    err instanceof ApiError
      ? `Impossibile completare i report. ${err.message}`
      : `Errore inatteso durante la generazione dei report: ${err}`
  console.error(message, ...(err instanceof ApiError ? [] : [err]))

  setStatus(message)
  const status = byId('status')
  status.setAttribute('role', 'alert')
  // TODO: move to the stylesheet
  status.style.color = 'crimson'
}