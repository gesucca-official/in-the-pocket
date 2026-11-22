import type { Exercise, Subdivision } from '../engine/types'

const KEY = 'itp.exercise'

export const DEFAULT_EXERCISE: Exercise = {
  bpm: 100,
  bars: 8,
  countInBars: 1,
  beatsPerBar: 4,
  parts: { kick: 'quarter', hihat: 'eighth', snare: 'off' }
}

const SUBDIVISIONS: Subdivision[] = ['off', 'quarter', 'eighth', 'eighthTriplet', 'sixteenth']

function isValid(x: unknown): x is Exercise {
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
    Object.values(e.parts).every((s) => SUBDIVISIONS.includes(s))
  )
}

export function loadExercise(storage: Pick<Storage, 'getItem'> = localStorage): Exercise {
  try {
    const parsed: unknown = JSON.parse(storage.getItem(KEY) ?? 'null')
    if (isValid(parsed)) return parsed
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
