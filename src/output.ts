import { ApiError } from './api'
import type { EpisodesReport } from './episodesReport'
import type { ChannelRef, RankedShow } from './ranking'
import type { ShowsReport } from './showsReport'

type Cell = string | number | null

// textContent only: names and genres come from the API
function el<K extends keyof HTMLElementTagNameMap>(tag: K, text?: Cell): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag)
  if (text !== undefined) node.textContent = text === null ? '—' : String(text)
  return node
}

function render(text: string, isError = false) {
  const pre = el('pre', text)
  if (isError) pre.style.color = 'crimson'
  document.body.append(pre)
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
  document.body.append(section)
}

// TODO: still raw JSON, sheets view comes next
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