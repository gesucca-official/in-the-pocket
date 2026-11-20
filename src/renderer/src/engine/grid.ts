import { MAX_WINDOW_MS } from './rules'
import type { Exercise, ExpectedHit, Instrument, Subdivision } from './types'

const NOTES_PER_BEAT: Record<Exclude<Subdivision, 'off'>, number> = {
  quarter: 1,
  eighth: 2,
  eighthTriplet: 3,
  sixteenth: 4
}

export function beatMs(bpm: number): number {
  return 60000 / bpm
}

export function intervalMs(bpm: number, subdivision: Exclude<Subdivision, 'off'>): number {
  return beatMs(bpm) / NOTES_PER_BEAT[subdivision]
}

/** Inizio della prima battuta valutata, dato l'istante del primo click del count-in. */
export function scoredStartMs(exercise: Exercise, firstClickMs: number): number {
  return firstClickMs + exercise.countInBars * exercise.beatsPerBar * beatMs(exercise.bpm)
}

/**
 * Genera i colpi attesi per tutte le battute valutate, ordinati per tempo.
 * `startMs` è l'istante del primo movimento della prima battuta valutata.
 */
export function generateGrid(exercise: Exercise, startMs: number): ExpectedHit[] {
  const hits: ExpectedHit[] = []
  const beats = exercise.bars * exercise.beatsPerBar
  let id = 0

  for (const [instrument, subdivision] of Object.entries(exercise.parts) as [
    Instrument,
    Subdivision
  ][]) {
    if (subdivision === 'off') continue
    const step = intervalMs(exercise.bpm, subdivision)
    const windowMs = Math.min(step / 2, MAX_WINDOW_MS)
    const count = beats * NOTES_PER_BEAT[subdivision]
    for (let i = 0; i < count; i++) {
      hits.push({ id: id++, instrument, timeMs: startMs + i * step, windowMs })
    }
  }

  return hits.sort((a, b) => a.timeMs - b.timeMs || a.id - b.id)
}
