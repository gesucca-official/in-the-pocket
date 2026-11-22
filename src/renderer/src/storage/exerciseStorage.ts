import type { Exercise, Pattern, Subdivision } from '../engine/types'

const KEY = 'itp.exercise'

export const DEFAULT_EXERCISE: Exercise = {
  bpm: 100,
  bars: 8,
  countInBars: 1,
  beatsPerBar: 4,
  parts: { kick: 'quarter', hihat: 'eighth', snare: 'off' }
}

const SUBDIVISIONS: Subdivision[] = ['off', 'quarter', 'eighth', 'eighthTriplet', 'sixteenth']
const INSTRUMENT_IDS = ['kick', 'snare', 'hihat', 'tom1', 'tom2', 'tom3', 'crash', 'ride']

function isValidPattern(p: Pattern, beatsPerBar: number): boolean {
  if (!Number.isInteger(p.stepsPerBeat) || p.stepsPerBeat < 1 || p.stepsPerBeat > 4) return false
  if (!Number.isInteger(p.bars) || p.bars < 1 || p.bars > 4) return false
  if (!Array.isArray(p.hits)) return false
  const length = p.bars * beatsPerBar * p.stepsPerBeat
  return p.hits.every((h) => Number.isInteger(h) && h >= 0 && h < length)
}

export function isValidExercise(x: unknown): x is Exercise {
  const e = x as Exercise
  return (
    !!e &&
    typeof e.bpm === 'number' &&
    e.bpm >= 30 &&
    e.bpm <= 300 &&
    Number.isInteger(e.bars) &&
    e.bars >= 1 &&
    Number.isInteger(e.countInBars) &&
    e.countInBars >= 0 &&
    e.beatsPerBar === 4 &&
    !!e.parts &&
    Object.values(e.parts).every((s) => SUBDIVISIONS.includes(s)) &&
    (e.patterns === undefined ||
      Object.entries(e.patterns).every(
        ([inst, p]) => INSTRUMENT_IDS.includes(inst) && isValidPattern(p, e.beatsPerBar)
      ))
  )
}

export function loadExercise(storage: Pick<Storage, 'getItem'> = localStorage): Exercise {
  try {
    const parsed: unknown = JSON.parse(storage.getItem(KEY) ?? 'null')
    if (isValidExercise(parsed)) return parsed
  } catch {
    // dato salvato illeggibile: si riparte dai default
  }
  return structuredClone(DEFAULT_EXERCISE)
}

export function saveExercise(
  exercise: Exercise,
  storage: Pick<Storage, 'setItem'> = localStorage
): void {
  storage.setItem(KEY, JSON.stringify(exercise))
}
