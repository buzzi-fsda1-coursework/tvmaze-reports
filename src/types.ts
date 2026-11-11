// only the fields the reports read; nullable where TVmaze can send null

export interface Channel {
  name: string
}

export interface Show {
  id: number
  name: string
  genres: string[]
  status: string
  premiered: string | null
  runtime: number | null
  averageRuntime: number | null
  rating: { average: number | null }
  network: Channel | null
  webChannel: Channel | null
}

export interface Episode {
  id: number
  name: string
  season: number
  number: number | null
  airdate: string
  runtime: number | null
  rating: { average: number | null }
}