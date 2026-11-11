# TVmaze reports

Applicazione TypeScript + Vite che scarica dati pubblici sulle serie TV da [TVmaze](https://www.tvmaze.com/api) e produce due report in JSON:

1. **Top 3 serie per rating**, all time e nell'anno di riferimento;
2. **Scheda episodi** delle tre serie in testa alla classifica all time.

I JSON vengono stampati nella console del browser; la pagina li mostra come tabelle e schede (v2).

## Versioni

| Versione | Tag | Cosa mostra la pagina |
|---|---|---|
| **v2** (attuale, `main`) | `v2.0.0` | Tabelle per il Report 1, schede per il Report 2, riga di stato per caricamento ed errori, JSON grezzo in un blocco richiudibile sotto ogni report |
| **v1** | `v1.0.0` | I due JSON come testo, uno sotto l'altro |

In entrambe le versioni i JSON sono stampati nella console del browser, e la logica dei report è la stessa: **la forma del JSON è identica**, la v2 cambia solo la presentazione nella pagina. Le differenze nel dettaglio sono nel [changelog](#changelog).

Per eseguire la v1:

```bash
git checkout v1.0.0
npm install
npm run dev
```

Per tornare alla versione attuale: `git switch main`.

## Requisiti

- Node.js in una versione supportata da Vite (20.19+ o 22.12+)
- npm (incluso in Node.js) oppure [pnpm](https://pnpm.io/installation)
- Un browser moderno (Firefox, Chrome, Edge)

Non serve nessuna API key.

## Installazione

```bash
git clone <url-del-repo>
cd tvmaze-reports
npm install
```

Con pnpm, al posto di `npm install`:

```bash
pnpm install
```

Il repository include `package-lock.json`, che pnpm non legge: con pnpm le dipendenze vengono risolte di nuovo dai range di `package.json` e salvate in un `pnpm-lock.yaml` locale, quindi le versioni installate possono differire leggermente. Il file `pnpm-lock.yaml` generato non va committato.

## Avvio

```bash
npm run dev
```

Con pnpm:

```bash
pnpm dev
```

Apri l'indirizzo mostrato nel terminale (di solito `http://localhost:5173`).

Il programma gira **nel browser**, non nel terminale. All'apertura della pagina scarica i dati e produce i due report:

- **nella console del browser** (DevTools, `F12` → Console), in JSON, come richiesto dal brief;
- **nella pagina**: il Report 1 come due tabelle (all time e anno di riferimento), il Report 2 come una scheda per serie. Sotto ogni report, il blocco «JSON del report» contiene lo stesso JSON stampato in console.

Durante il caricamento, una riga di stato sotto il titolo indica la fase in corso e gli eventuali nuovi tentativi; sparisce quando i report sono completi.

Il terminale mostra solo i messaggi del server di sviluppo di Vite.

## Scope dei dati

Lo scope è la sola pagina `GET /shows?page=0` (240 serie), più `GET /shows/{id}/episodes` per le tre serie della classifica all time.

Le pagine usate sono definite in un'unica costante, `SHOW_PAGES` in `src/api.ts`, che il Report 1 riporta nel campo `scope`: per estendere lo scope basta aggiungere pagine a quell'array. Le pagine vengono scaricate una alla volta, per non superare il rate limit.

## Anno di riferimento

L'anno di riferimento è l'anno solare della `premiered` più recente tra le serie scaricate (non la data di sistema): con lo scope attuale l'ultima premiere è del 2014-11-17, quindi il periodo recente va dal `2014-01-01` al `2014-12-31`, estremi inclusi.

- Il Report 1 dichiara sia la data da cui l'anno è ricavato sia l'anno stesso (`anchor`), e l'intervallo usato (`periods.recent.interval`).
- Le serie senza `premiered` entrano nella classifica all time, ma non in quella dell'anno di riferimento, perché non hanno un anno.
- Per l'all time l'intervallo è esplicitamente `null` (nessun limite), così i due periodi hanno le stesse chiavi.

## Regole di ranking

- Criterio: `rating.average` decrescente; a parità di rating, `id` crescente. Lo stesso ordinamento è dichiarato nel report (`rankedBy`).
- Le serie senza `rating.average` sono escluse dalle classifiche. Un rating pari a `0` è un rating valido e non viene escluso.
- Ogni classifica contiene **fino a** tre serie: se in un periodo ce ne sono meno, il report mostra solo quelle disponibili.
- Il Report 2 usa esattamente le tre serie della classifica all time del Report 1 (stesso array, non ricalcolato).

## Casi non definiti dal brief

| Caso | Scelta |
|---|---|
| Network e webChannel | Il campo `channel` è `{ name, type }`, con `type` uguale a `"network"` o `"webChannel"`. Se esistono entrambi vince il network; se mancano entrambi, `channel` è `null`. |
| Runtime della serie | `runtime`, oppure `averageRuntime` se `runtime` è assente; se mancano entrambi, `null`. |
| Episodi senza runtime | Il totale somma solo i runtime noti; gli episodi senza runtime non vengono stimati, ma contati in `runtime.episodesWithoutRuntime`, così il totale dichiara quanto è completo. |
| Nessun episodio con rating | `topEpisode` è `null`. |
| Episodio con rating più alto | Stessa regola del Report 1: rating decrescente, poi `id` crescente. |
| Episodi speciali | Esclusi: si usa `/shows/{id}/episodes` senza il parametro `specials`, che restituisce solo gli episodi regolari. |
| `airdate` vuota (episodi non ancora andati in onda) | Ignorata nel calcolo del primo e dell'ultimo episodio; se nessun episodio ha una data, entrambe sono `null`. |
| Nessuna serie con `premiered` | `anchor.latestPremiere`, `anchor.year` e l'intervallo recente sono `null`, la classifica recente è vuota. |

## Gestione degli errori di rete e del 429

Il programma gira nel browser, dove non esiste un exit code: invece dell'uscita con codice non zero, gli errori vengono gestiti come segue e mostrati con un messaggio esplicito, sia in console sia nella riga di stato in cima alla pagina (in rosso).

- **429 o nessuna risposta** (rete assente, timeout di 10 secondi): fino a 3 nuovi tentativi, con attese di 2, 4 e 8 secondi, oppure il tempo indicato da `Retry-After` se il browser permette di leggerlo. Ogni tentativo viene segnalato in console con `console.warn` e nella riga di stato della pagina.
- **Altri errori HTTP** (404, 500, …): nessun nuovo tentativo, perché non sono temporanei.
- **Tentativi esauriti o errore non recuperabile**: messaggio `Impossibile completare i report. GET <percorso>: <causa>`.
- Il Report 1 viene mostrato **prima** di scaricare gli episodi: se le richieste degli episodi falliscono, il Report 1 resta visibile e l'errore spiega cosa manca.

Nel browser un 429 privo di header CORS può arrivare al codice come errore di rete: per questo anche l'assenza di risposta viene ritentata.

## Forma del JSON

### Report 1 — Top 3 serie per rating

```json
{
  "report": "top-shows-by-rating",
  "generatedAt": "2026-11-11T14:00:00.000Z",
  "scope": { "endpoint": "/shows", "pages": [0] },
  "anchor": { "latestPremiere": "2014-11-17", "year": 2014 },
  "rankedBy": ["rating.average desc", "id asc"],
  "periods": {
    "allTime": { "interval": null, "ranking": [] },
    "recent": { "interval": { "start": "2014-01-01", "end": "2014-12-31" }, "ranking": [] }
  }
}
```

Ogni elemento di `ranking`:

| Attributo richiesto | Chiave |
|---|---|
| Posizione in classifica | `rank` |
| Identificativo | `id` |
| Nome | `name` |
| Generi | `genres` |
| Status | `status` |
| Data di premiere | `premiered` |
| Rating medio | `rating` |
| Runtime | `runtime` |
| Network o webChannel | `channel` (`{ name, type }` o `null`) |

### Report 2 — Scheda episodi delle top 3 all time

```json
{
  "report": "top-shows-episodes",
  "generatedAt": "2026-11-11T14:00:00.000Z",
  "basedOn": {
    "report": "top-shows-by-rating",
    "period": "allTime",
    "shows": [{ "rank": 1, "id": 0, "name": "…" }]
  },
  "sheets": []
}
```

Ogni elemento di `sheets`:

| Attributo richiesto | Chiave |
|---|---|
| Identificativo e nome della serie | `showId`, `showName` |
| Stagioni distinte | `seasons` |
| Totale episodi | `episodes` |
| Runtime totale in minuti | `runtime.totalMinutes` (con `runtime.episodesWithoutRuntime`) |
| Primo e ultimo episodio | `airdates.first`, `airdates.last` |
| Episodio con rating più alto | `topEpisode`: `id`, `name`, `season`, `number`, `rating` (o `null`) |

Entrambi i report condividono lo stesso `generatedAt`, perché sono prodotti dalla stessa esecuzione.

## Struttura

```
index.html           titolo, riga di stato, contenitore dei report
src/
  main.ts            avvio: scarica i dati, costruisce i report e li passa a output.ts
  output.ts          presentazione: JSON in console, tabelle e schede, stato ed errori nella pagina
  style.css          stile minimo, con supporto a tema chiaro e scuro
  api.ts             chiamate a TVmaze, retry, timeout, scope (SHOW_PAGES)
  types.ts           tipi dei dati TVmaze, solo i campi usati
  utils.ts           filtro "con rating" e ordinamento del brief, condivisi dai due report
  ranking.ts         classifica delle serie
  period.ts          ultima premiere e intervallo dell'anno di riferimento
  showsReport.ts     Report 1
  episodesReport.ts  Report 2
```

## Limiti noti

- Non c'è validazione a runtime della forma dei dati: i tipi TypeScript descrivono la risposta attesa di TVmaze, ma non la verificano. Una risposta con forma diversa produrrebbe un "errore inatteso" in console e in pagina, senza un messaggio dedicato.
- L'header `Retry-After` di solito non è leggibile da una pagina su un altro dominio; in quel caso si usano le attese fisse di 2, 4 e 8 secondi.

## Changelog

### 2.0.0 — 2026-11-11

Presentazione dei report nella pagina. Logica dei report e forma del JSON invariate.

**Aggiunto**
- Report 1 come due tabelle (all time e anno di riferimento), con l'ordinamento e l'intervallo del periodo indicati sopra le tabelle.
- Report 2 come una scheda per serie, con gli episodi esclusi dal totale dei minuti indicati accanto al totale.
- Riga di stato che mostra le fasi del caricamento e i nuovi tentativi in caso di 429 o di mancata risposta; gli errori finali compaiono nello stesso punto, in rosso.
- Blocco richiudibile «JSON del report» sotto ogni report.
- Foglio di stile minimo, con tema chiaro e scuro e tabelle scorrevoli su schermi stretti.

**Modificato**
- La presentazione è separata in `src/output.ts`; `main.ts` si limita a scaricare i dati e costruire i report.
- `fetchShows` e `fetchEpisodes` accettano un callback opzionale per essere avvisati dei nuovi tentativi; senza callback il comportamento è quello della v1.
- Gli errori compaiono nella riga di stato in cima alla pagina, invece che in fondo.

**Invariato**
- I JSON stampati in console, deliverable del brief.

### 1.0.0 — 2026-11-11

Prima versione completa rispetto al brief.

- Report 1 (top 3 serie per rating, all time e anno di riferimento) e Report 2 (scheda episodi delle top 3 all time) in JSON, stampati in console e mostrati come testo nella pagina.
- Scope `page=0` di `/shows`; anno di riferimento ricavato dall'ultima premiere dei dati.
- Nuovi tentativi per 429 e richieste senza risposta, timeout di 10 secondi, messaggio esplicito per gli errori.