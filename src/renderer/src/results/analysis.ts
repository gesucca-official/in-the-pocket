import type { Stats } from '../engine/scorer'
import type { StoredEvent } from './record'

/** Scarto medio sotto il quale si considera il colpo "in mezzo al click". */
const CENTERED_MS = 4
/** Differenza tra seconda e prima metà oltre la quale si parla di deriva. */
const DRIFT_MS = 8
const MIN_HITS = 4

/** "Corri o trascini": lettura dello scarto medio e della costanza. */
export function tendencyText(stats: Stats): string {
  if (stats.hits < MIN_HITS) return 'Troppi pochi colpi per dare un giudizio.'
  const mean = stats.meanOffsetMs
  const position =
    Math.abs(mean) < CENTERED_MS
      ? 'Sei in mezzo al click'
      : mean < 0
        ? `Tendi ad anticipare di ${Math.abs(mean).toFixed(0)} ms`
        : `Tendi a ritardare di ${mean.toFixed(0)} ms`
  const consistency =
    stats.stdDevMs < 10
      ? 'molto costante'
      : stats.stdDevMs < 20
        ? 'abbastanza costante'
        : 'poco costante'
  return `${position}, ${consistency}.`
}

const mean = (xs: number[]): number => xs.reduce((s, x) => s + x, 0) / xs.length

/**
 * Differenza tra lo scarto medio della seconda metà e della prima (in ms, per tempo).
 * Positivo = col passare del tempo si ritarda sempre di più. Null se i colpi sono pochi.
 */
export function driftMs(events: StoredEvent[]): number | null {
  const hits = events
    .filter((e): e is StoredEvent & { offsetMs: number } => e.offsetMs !== null)
    .sort((a, b) => a.timeMs - b.timeMs)
  if (hits.length < MIN_HITS * 2) return null
  const half = Math.floor(hits.length / 2)
  return (
    mean(hits.slice(half).map((e) => e.offsetMs)) - mean(hits.slice(0, half).map((e) => e.offsetMs))
  )
}

export function driftText(drift: number | null): string | null {
  if (drift === null || Math.abs(drift) < DRIFT_MS) return null
  return drift > 0
    ? `Nel corso dell’esercizio sei andato sempre più in ritardo (${drift.toFixed(0)} ms di differenza tra metà e metà).`
    : `Nel corso dell’esercizio hai anticipato sempre di più (${Math.abs(drift).toFixed(0)} ms di differenza tra metà e metà).`
}

/** Media mobile degli ultimi `window` scarti, per mostrare l'andamento nel grafico. */
export function rollingMean(
  events: StoredEvent[],
  window = 8
): { timeMs: number; offsetMs: number }[] {
  const hits = events
    .filter((e): e is StoredEvent & { offsetMs: number } => e.offsetMs !== null)
    .sort((a, b) => a.timeMs - b.timeMs)
  return hits.map((e, i) => ({
    timeMs: e.timeMs,
    offsetMs: mean(hits.slice(Math.max(0, i - window + 1), i + 1).map((h) => h.offsetMs))
  }))
}
