import type { Exercise } from '../engine/types'
import { isValidExercise } from './exerciseStorage'

const KEY = 'itp.presets'

export interface UserPreset {
  id: string
  name: string
  exercise: Exercise
}

export function loadPresets(storage: Pick<Storage, 'getItem'> = localStorage): UserPreset[] {
  try {
    const parsed: unknown = JSON.parse(storage.getItem(KEY) ?? '[]')
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (p): p is UserPreset =>
        !!p && typeof p.id === 'string' && typeof p.name === 'string' && isValidExercise(p.exercise)
    )
  } catch {
    return []
  }
}

function write(presets: UserPreset[], storage: Pick<Storage, 'setItem'>): UserPreset[] {
  storage.setItem(KEY, JSON.stringify(presets))
  return presets
}

/** Se esiste già un preset con lo stesso nome lo sostituisce. */
export function savePreset(
  name: string,
  exercise: Exercise,
  storage: Pick<Storage, 'getItem' | 'setItem'> = localStorage,
  newId: () => string = () => crypto.randomUUID()
): UserPreset[] {
  const trimmed = name.trim()
  const list = loadPresets(storage)
  const existing = list.find((p) => p.name === trimmed)
  const preset: UserPreset = {
    id: existing?.id ?? newId(),
    name: trimmed,
    exercise: structuredClone(exercise)
  }
  return write([...list.filter((p) => p.id !== preset.id), preset], storage)
}

export function deletePreset(
  id: string,
  storage: Pick<Storage, 'getItem' | 'setItem'> = localStorage
): UserPreset[] {
  return write(
    loadPresets(storage).filter((p) => p.id !== id),
    storage
  )
}
