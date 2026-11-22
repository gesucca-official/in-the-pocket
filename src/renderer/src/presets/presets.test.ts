import { describe, expect, it } from 'vitest'
import { activeInstruments, generateGrid } from '../engine/grid'
import { DEFAULT_EXERCISE, isValidExercise } from '../storage/exerciseStorage'
import { deletePreset, loadPresets, savePreset } from '../storage/presetStorage'
import { BEAT_PRESETS, exerciseFromBeat } from './beats'

function fakeStorage(): Pick<Storage, 'getItem' | 'setItem'> {
  const store = new Map<string, string>()
  return {
    getItem: (k) => store.get(k) ?? null,
    setItem: (k, v) => void store.set(k, v)
  }
}

describe('beat da praticare', () => {
  it('hanno id unici e tempi ragionevoli', () => {
    expect(new Set(BEAT_PRESETS.map((b) => b.id)).size).toBe(BEAT_PRESETS.length)
    for (const b of BEAT_PRESETS) expect(b.bpm).toBeGreaterThanOrEqual(60)
  })

  it.each(BEAT_PRESETS.map((b) => [b.name, b] as const))('%s è un esercizio valido', (_n, beat) => {
    const ex = exerciseFromBeat(beat, DEFAULT_EXERCISE)
    expect(isValidExercise(ex)).toBe(true)
    expect(activeInstruments(ex).length).toBeGreaterThanOrEqual(3)
    // nessun colpo duplicato sullo stesso strumento e istante
    const grid = generateGrid(ex, 0)
    const keys = grid.map((h) => `${h.instrument}@${h.timeMs.toFixed(3)}`)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('il rock classico ha cassa su 1 e 3 e rullante su 2 e 4 a 120 bpm', () => {
    const rock = BEAT_PRESETS.find((b) => b.id === 'rock-base')!
    const ex = { ...exerciseFromBeat(rock, DEFAULT_EXERCISE), bpm: 120, bars: 1 }
    const grid = generateGrid(ex, 0)
    const at = (inst: string): number[] =>
      grid.filter((h) => h.instrument === inst).map((h) => h.timeMs)
    expect(at('kick')).toEqual([0, 1000])
    expect(at('snare')).toEqual([500, 1500])
    expect(at('hihat')).toHaveLength(8)
  })

  it('applicare un beat mantiene battute e count-in dell’utente', () => {
    const ex = exerciseFromBeat(BEAT_PRESETS[0], { ...DEFAULT_EXERCISE, bars: 16, countInBars: 2 })
    expect(ex).toMatchObject({ bars: 16, countInBars: 2, bpm: BEAT_PRESETS[0].bpm, parts: {} })
  })

  it('applicare un beat non modifica il preset originale', () => {
    const before = JSON.stringify(BEAT_PRESETS[0])
    const ex = exerciseFromBeat(BEAT_PRESETS[0], DEFAULT_EXERCISE)
    ex.patterns!.kick!.hits.push(3)
    expect(JSON.stringify(BEAT_PRESETS[0])).toBe(before)
  })
})

describe('validazione esercizi con pattern', () => {
  it('scarta pattern fuori griglia o malformati', () => {
    const bad = (patterns: unknown): boolean => isValidExercise({ ...DEFAULT_EXERCISE, patterns })
    expect(bad({ kick: { stepsPerBeat: 4, bars: 1, hits: [16] } })).toBe(false)
    expect(bad({ kick: { stepsPerBeat: 0, bars: 1, hits: [0] } })).toBe(false)
    expect(bad({ kick: { stepsPerBeat: 4, bars: 1, hits: [0.5] } })).toBe(false)
    expect(bad({ cowbell: { stepsPerBeat: 4, bars: 1, hits: [0] } })).toBe(false)
    expect(bad({ kick: { stepsPerBeat: 4, bars: 1, hits: [0, 8] } })).toBe(true)
  })
})

describe('preset utente', () => {
  it('salva, ricarica ed elimina', () => {
    const st = fakeStorage()
    let n = 0
    const id = (): string => `id${++n}`
    savePreset('Il mio', DEFAULT_EXERCISE, st, id)
    savePreset('Altro', { ...DEFAULT_EXERCISE, bpm: 140 }, st, id)
    expect(loadPresets(st).map((p) => p.name)).toEqual(['Il mio', 'Altro'])
    expect(deletePreset('id1', st).map((p) => p.name)).toEqual(['Altro'])
  })

  it('salvare con lo stesso nome sostituisce', () => {
    const st = fakeStorage()
    savePreset('A', DEFAULT_EXERCISE, st, () => 'x')
    savePreset(' A ', { ...DEFAULT_EXERCISE, bpm: 150 }, st, () => 'y')
    const list = loadPresets(st)
    expect(list).toHaveLength(1)
    expect(list[0].exercise.bpm).toBe(150)
  })

  it('ignora dati salvati non validi', () => {
    const st = fakeStorage()
    st.setItem('itp.presets', JSON.stringify([{ id: '1', name: 'rotto', exercise: { bpm: 5 } }]))
    expect(loadPresets(st)).toEqual([])
    st.setItem('itp.presets', 'non json')
    expect(loadPresets(st)).toEqual([])
  })
})
