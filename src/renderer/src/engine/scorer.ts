import { RATING_POINTS } from './rules'
import type { Instrument, MatchEvent, Rating } from './types'

export interface Stats {
  expected: number
  hits: number
  misses: number
  extras: number
  ratings: Record<Rating, number>
  /** Punti ottenuti / punti massimi, 0-100. */
  accuracy: number
  /** Scarto medio in ms: negativo = tendi ad anticipare, positivo = a ritardare. */
  meanOffsetMs: number
  /** Deviazione standard degli scarti: più bassa = più costante. */
  stdDevMs: number
}

export interface Summary {
  total: Stats
  byInstrument: Partial<Record<Instrument, Stats>>
}

function computeStats(events: MatchEvent[]): Stats {
  const ratings: Record<Rating, number> = { perfect: 0, good: 0, ok: 0, off: 0 }
  const offsets: number[] = []
  let misses = 0
  let extras = 0
  let points = 0

  for (const e of events) {
    if (e.type === 'hit') {
      ratings[e.rating]++
      offsets.push(e.offsetMs)
      points += RATING_POINTS[e.rating]
    } else if (e.type === 'miss') {
      misses++
    } else {
      extras++
    }
  }

  const hits = offsets.length
  const expected = hits + misses
  const mean = hits ? offsets.reduce((s, o) => s + o, 0) / hits : 0
  const variance = hits ? offsets.reduce((s, o) => s + (o - mean) ** 2, 0) / hits : 0

  return {
    expected,
    hits,
    misses,
    extras,
    ratings,
    accuracy: expected ? (points / (expected * RATING_POINTS.perfect)) * 100 : 0,
    meanOffsetMs: mean,
    stdDevMs: Math.sqrt(variance)
  }
}

function instrumentOf(e: MatchEvent): Instrument {
  return e.type === 'miss' ? e.expected.instrument : e.played.instrument
}

export function summarize(events: MatchEvent[]): Summary {
  const groups = new Map<Instrument, MatchEvent[]>()
  for (const e of events) {
    const key = instrumentOf(e)
    groups.set(key, [...(groups.get(key) ?? []), e])
  }

  const byInstrument: Summary['byInstrument'] = {}
  for (const [instrument, list] of groups) byInstrument[instrument] = computeStats(list)

  return { total: computeStats(events), byInstrument }
}
