import { MAX_WINDOW_MS } from './rules'
import type { Exercise, ExpectedHit, Instrument, Pattern, Subdivision } from './types'

const NOTES_PER_BEAT: Record<Exclude<Subdivision, 'off'>, number> = {
  quarter: 1,
  eighth: 2,
  eighthTriplet: 3,
  sixteenth: 4
}

/** Strumenti con almeno un colpo atteso (suddivisione attiva o pattern non vuoto). */
export function activeInstruments(exercise: Exercise): Instrument[] {
  const set = new Set<Instrument>()
  for (const [inst, sub] of Object.entries(exercise.parts) as [Instrument, Subdivision][]) {
    if (sub !== 'off') set.add(inst)
  }
  for (const [inst, pattern] of Object.entries(exercise.patterns ?? {}) as [
    Instrument,
    Pattern
  ][]) {
    if (pattern.hits.length > 0) set.add(inst)
    else set.delete(inst)
  }
  return [...set]
}

/** Distanza minima (in passi) tra due colpi consecutivi del pattern, contando il giro di ripetizione. */
function minGapSteps(pattern: Pattern, beatsPerBar: number): number {
  const length = pattern.bars * beatsPerBar * pattern.stepsPerBeat
  const hits = [...new Set(pattern.hits)].sort((a, b) => a - b)
  let min = length
  for (let i = 1; i < hits.length; i++) min = Math.min(min, hits[i] - hits[i - 1])
  if (hits.length > 1) min = Math.min(min, length - hits[hits.length - 1] + hits[0])
  return min
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

  const patterns = exercise.patterns ?? {}

  for (const [instrument, subdivision] of Object.entries(exercise.parts) as [
    Instrument,
    Subdivision
  ][]) {
    if (subdivision === 'off' || patterns[instrument]) continue
    const step = intervalMs(exercise.bpm, subdivision)
    const windowMs = Math.min(step / 2, MAX_WINDOW_MS)
    const count = beats * NOTES_PER_BEAT[subdivision]
    for (let i = 0; i < count; i++) {
      hits.push({ id: id++, instrument, timeMs: startMs + i * step, windowMs })
    }
  }

  for (const [instrument, pattern] of Object.entries(patterns) as [Instrument, Pattern][]) {
    if (pattern.hits.length === 0) continue
    const stepMs = beatMs(exercise.bpm) / pattern.stepsPerBeat
    const windowMs = Math.min(
      (minGapSteps(pattern, exercise.beatsPerBar) * stepMs) / 2,
      MAX_WINDOW_MS
    )
    const length = pattern.bars * exercise.beatsPerBar * pattern.stepsPerBeat
    const total = beats * pattern.stepsPerBeat
    const positions = [...new Set(pattern.hits)].sort((a, b) => a - b)
    for (let base = 0; base < total; base += length) {
      for (const pos of positions) {
        if (base + pos >= total) break
        hits.push({ id: id++, instrument, timeMs: startMs + (base + pos) * stepMs, windowMs })
      }
    }
  }

  return hits.sort((a, b) => a.timeMs - b.timeMs || a.id - b.id)
}
