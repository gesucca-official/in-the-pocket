import type { Instrument } from '../engine/types'

/** Note MIDI assegnate a ciascuno strumento (più note per strumento: pelle/cerchio, zone dei piatti...). */
export type PadMapping = Record<Instrument, number[]>

export const INSTRUMENTS: Instrument[] = [
  'kick',
  'snare',
  'hihat',
  'tom1',
  'tom2',
  'tom3',
  'crash',
  'ride'
]

export const INSTRUMENT_LABELS: Record<Instrument, string> = {
  kick: 'Cassa',
  snare: 'Rullante',
  hihat: 'Charleston',
  tom1: 'Tom 1',
  tom2: 'Tom 2',
  tom3: 'Tom 3',
  crash: 'Crash',
  ride: 'Ride'
}

/** Mappatura della Millenium MPS-750X (vedi tabella in PIANO.md). */
export const DEFAULT_MAPPING: PadMapping = {
  kick: [36],
  snare: [38, 37],
  hihat: [42, 46, 44],
  tom1: [48],
  tom2: [45],
  tom3: [43],
  crash: [55, 49],
  ride: [51, 53, 59]
}

export function cloneMapping(m: PadMapping): PadMapping {
  return Object.fromEntries(INSTRUMENTS.map((i) => [i, [...m[i]]])) as PadMapping
}

export function noteToInstrument(mapping: PadMapping, note: number): Instrument | null {
  return INSTRUMENTS.find((i) => mapping[i].includes(note)) ?? null
}

/** Assegna la nota allo strumento; se era di un altro strumento gliela toglie. Non muta l'originale. */
export function assignNote(mapping: PadMapping, instrument: Instrument, note: number): PadMapping {
  const next = cloneMapping(mapping)
  for (const i of INSTRUMENTS) next[i] = next[i].filter((n) => n !== note)
  next[instrument].push(note)
  next[instrument].sort((a, b) => a - b)
  return next
}

export function removeNote(mapping: PadMapping, instrument: Instrument, note: number): PadMapping {
  const next = cloneMapping(mapping)
  next[instrument] = next[instrument].filter((n) => n !== note)
  return next
}

/** Rilegge una mappatura salvata; se non è valida restituisce null. */
export function parseMapping(json: string | null): PadMapping | null {
  if (!json) return null
  try {
    const raw = JSON.parse(json) as Record<string, unknown>
    const out = {} as PadMapping
    const seen = new Set<number>()
    for (const i of INSTRUMENTS) {
      const notes = raw[i]
      if (!Array.isArray(notes)) return null
      for (const n of notes) {
        if (!Number.isInteger(n) || n < 0 || n > 127 || seen.has(n)) return null
        seen.add(n)
      }
      out[i] = [...(notes as number[])]
    }
    return out
  } catch {
    return null
  }
}
