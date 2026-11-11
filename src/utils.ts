export type Rated<T> = T & { rating: { average: number } }

export function hasRating<T extends { rating: { average: number | null } }>(item: T): item is Rated<T> {
  return item.rating.average !== null
}

// keep in sync with byRating
export const RATING_ORDER = ['rating.average desc', 'id asc']

// brief rule: higher rating first, ties by ascending id
export function byRating<T extends { id: number; rating: { average: number } }>(a: T, b: T): number {
  return b.rating.average - a.rating.average || a.id - b.id
}