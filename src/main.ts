const BASE_URL = 'https://api.tvmaze.com'

// exploration only: no status check, no types yet
async function getJson(path: string) {
  const res = await fetch(BASE_URL + path)
  return res.json()
}

async function main() {
  const shows = await getJson('/shows?page=0')
  console.log('shows:', shows.length)
  console.log('first show', shows[0])

  const premiered = shows.map((s: any) => s.premiered).filter(Boolean).sort()
  const latest = premiered[premiered.length - 1]
  console.log('premiered from', premiered[0], 'to', latest, '| missing:', shows.length - premiered.length)
  console.log('premiered in latest year:', premiered.filter((d: string) => d.startsWith(latest.slice(0, 4))).length)

  console.log('no rating:', shows.filter((s: any) => s.rating?.average == null).length)
  console.log('no runtime [id, averageRuntime]', shows.filter((s: any) => s.runtime == null).map((s: any) => [s.id, s.averageRuntime]))
  console.log('no network [id, webChannel]', shows.filter((s: any) => !s.network).map((s: any) => [s.id, s.webChannel?.name ?? null]))

  const episodes = await getJson(`/shows/${shows[0].id}/episodes`)
  console.log('episodes:', episodes.length)
  console.log('first episode', episodes[0])
  console.log('episodes without runtime:', episodes.filter((e: any) => e.runtime == null).length)
  console.log('episodes without airdate:', episodes.filter((e: any) => !e.airdate).length)
  console.log('episodes without rating:', episodes.filter((e: any) => e.rating?.average == null).length)
}

main()