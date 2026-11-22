import type { Exercise, Instrument, Pattern, Subdivision } from '../engine/types'
import { INSTRUMENTS, INSTRUMENT_LABELS } from '../midi/padMapping'
import { BEAT_PRESETS } from './beats'
import { EXERCISE_PROPOSALS } from './proposals'

export const SUBDIVISION_LABELS: Record<Subdivision, string> = {
  off: 'spento',
  quarter: '4ti',
  eighth: '8vi',
  eighthTriplet: 'terzine di 8vo',
  sixteenth: '16esimi'
}

/** Cosa si suona, indipendentemente da tempo, battute e introduzione. */
function shapeKey(ex: Exercise): string {
  const patterns = Object.fromEntries(
    INSTRUMENTS.filter((i) => ex.patterns?.[i]?.hits.length).map((i) => {
      const p = ex.patterns![i] as Pattern
      return [i, { s: p.stepsPerBeat, b: p.bars, h: [...new Set(p.hits)].sort((a, b) => a - b) }]
    })
  )
  const parts = Object.fromEntries(
    INSTRUMENTS.filter((i) => ex.parts[i] && ex.parts[i] !== 'off' && !(i in patterns)).map((i) => [
      i,
      ex.parts[i]
    ])
  )
  return JSON.stringify([parts, patterns])
}

/** Nome leggibile: quello del ritmo o dell'esercizio proposto se coincide, altrimenti un elenco. */
export function describeExercise(ex: Exercise): string {
  const key = shapeKey(ex)
  const beat = BEAT_PRESETS.find(
    (b) => shapeKey({ ...ex, parts: {}, patterns: b.patterns }) === key
  )
  if (beat) return beat.name
  const proposal = EXERCISE_PROPOSALS.find((p) => shapeKey(p.exercise) === key)
  if (proposal) return proposal.name

  const items = INSTRUMENTS.flatMap((inst: Instrument) => {
    if (ex.patterns?.[inst]?.hits.length) return [`${INSTRUMENT_LABELS[inst]} (ritmo)`]
    const sub = ex.parts[inst]
    return sub && sub !== 'off' ? [`${INSTRUMENT_LABELS[inst]} ${SUBDIVISION_LABELS[sub]}`] : []
  })
  return items.join(' · ') || 'Esercizio'
}
