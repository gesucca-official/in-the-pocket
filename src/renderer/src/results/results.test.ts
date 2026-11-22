import { describe, expect, it } from 'vitest'
import { ExerciseSession } from '../engine/session'
import type { Exercise, Instrument } from '../engine/types'
import { BEAT_PRESETS, exerciseFromBeat } from '../presets/beats'
import { describeExercise } from '../presets/describe'
import { EXERCISE_PROPOSALS } from '../presets/proposals'
import { DEFAULT_EXERCISE } from '../storage/exerciseStorage'
import { addRecord, deleteRecord, loadHistory, MAX_RECORDS } from '../storage/historyStorage'
import { driftMs, driftText, rollingMean, tendencyText } from './analysis'
import { buildRecord, type SessionRecord, type StoredEvent } from './record'

const resolve = (n: number): Instrument | null => (n === 36 ? 'kick' : null)
const ex: Exercise = {
  bpm: 120,
  bars: 1,
  countInBars: 0,
  beatsPerBar: 4,
  parts: { kick: 'quarter' }
}

function finished(): ExerciseSession {
  const s = new ExerciseSession(ex, resolve)
  s.begin(1000) // colpi attesi a 1000, 1500, 2000, 2500
  s.onNote(36, 100, 1012) // +12
  s.onNote(36, 100, 1490) // -10
  s.onNote(36, 100, 2000) // 0
  s.finish() // il quarto è mancato
  return s
}

const hit = (
  timeMs: number,
  offsetMs: number | null,
  instrument: Instrument = 'kick'
): StoredEvent => ({
  instrument,
  timeMs,
  offsetMs
})

describe('buildRecord', () => {
  it('conserva colpi e mancati con tempi relativi all’inizio', () => {
    const r = buildRecord(finished(), 'id1', new Date('2026-11-22T10:00:00Z'))
    expect(r.events).toEqual([hit(0, 12), hit(500, -10), hit(1000, 0), hit(1500, null)])
    expect(r.summary.total).toMatchObject({ hits: 3, misses: 1 })
    expect(r.id).toBe('id1')
    expect(r.dateIso).toBe('2026-11-22T10:00:00.000Z')
  })

  it('si può serializzare e rileggere senza perdere nulla', () => {
    const r = buildRecord(finished(), 'id1', new Date())
    expect(JSON.parse(JSON.stringify(r))).toEqual(r)
  })
})

describe('analisi', () => {
  const stats = (mean: number, sd: number, hits = 20): Parameters<typeof tendencyText>[0] =>
    ({ hits, meanOffsetMs: mean, stdDevMs: sd }) as never

  it('descrive la tendenza e la costanza', () => {
    expect(tendencyText(stats(-12, 8))).toBe('Tendi ad anticipare di 12 ms, molto costante.')
    expect(tendencyText(stats(15, 15))).toBe('Tendi a ritardare di 15 ms, abbastanza costante.')
    expect(tendencyText(stats(1, 30))).toBe('Sei in mezzo al click, poco costante.')
    expect(tendencyText(stats(10, 5, 2))).toMatch(/pochi colpi/)
  })

  it('misura la deriva tra prima e seconda metà', () => {
    const events = Array.from({ length: 20 }, (_, i) => hit(i * 100, i < 10 ? 0 : 20))
    expect(driftMs(events)).toBeCloseTo(20)
    expect(driftText(20)).toMatch(/più in ritardo/)
    expect(driftText(-15)).toMatch(/anticipato/)
    expect(driftText(3)).toBeNull()
    expect(driftText(null)).toBeNull()
  })

  it('la deriva ignora i mancati e serve un minimo di colpi', () => {
    expect(driftMs([hit(0, 5), hit(100, null)])).toBeNull()
    const events = [...Array.from({ length: 8 }, (_, i) => hit(i * 100, 0)), hit(900, null)]
    expect(driftMs(events)).toBeCloseTo(0)
  })

  it('calcola la media mobile', () => {
    const roll = rollingMean([hit(0, 10), hit(100, 20), hit(200, null), hit(300, 30)], 2)
    expect(roll.map((r) => r.offsetMs)).toEqual([10, 15, 25])
    expect(roll.map((r) => r.timeMs)).toEqual([0, 100, 300])
  })
})

describe('describeExercise', () => {
  it('riconosce i ritmi anche con tempo e battute diversi', () => {
    const beat = BEAT_PRESETS[0]
    const custom = { ...exerciseFromBeat(beat, DEFAULT_EXERCISE), bpm: 140, bars: 64 }
    expect(describeExercise(custom)).toBe(beat.name)
  })

  it('riconosce gli esercizi proposti', () => {
    const p = EXERCISE_PROPOSALS[0]
    expect(describeExercise({ ...p.exercise, bpm: 99, bars: 8 })).toBe(p.name)
  })

  it('ignora gli strumenti spenti', () => {
    const p = EXERCISE_PROPOSALS[0]
    expect(describeExercise({ ...p.exercise, parts: { ...p.exercise.parts, snare: 'off' } })).toBe(
      p.name
    )
  })

  it('altrimenti elenca gli strumenti', () => {
    const e: Exercise = { ...DEFAULT_EXERCISE, parts: { kick: 'eighth', ride: 'quarter' } }
    expect(describeExercise(e)).toBe('Cassa 8vi · Ride 4ti')
    expect(describeExercise({ ...e, parts: {} })).toBe('Esercizio')
  })
})

function fakeStorage(limit = Infinity): Pick<Storage, 'getItem' | 'setItem'> {
  let value: string | null = null
  return {
    getItem: () => value,
    setItem: (_k, v) => {
      if (v.length > limit) throw new Error('quota')
      value = v
    }
  }
}

const rec = (id: string, date: string, size = 1): SessionRecord => ({
  ...buildRecord(finished(), id, new Date(date)),
  events: Array.from({ length: size }, (_, i) => hit(i, 0))
})

describe('storico', () => {
  it('salva, ordina dal più recente ed elimina', () => {
    const st = fakeStorage()
    addRecord(rec('a', '2026-01-01T00:00:00Z'), st)
    addRecord(rec('b', '2026-02-01T00:00:00Z'), st)
    expect(loadHistory(st).map((r) => r.id)).toEqual(['b', 'a'])
    expect(deleteRecord('b', st).map((r) => r.id)).toEqual(['a'])
  })

  it('tiene al massimo MAX_RECORDS prove, scartando le più vecchie', () => {
    const st = fakeStorage()
    for (let i = 0; i < MAX_RECORDS + 5; i++) {
      addRecord(rec(`r${i}`, new Date(2026, 0, 1, 0, i).toISOString()), st)
    }
    const list = loadHistory(st)
    expect(list).toHaveLength(MAX_RECORDS)
    expect(list[0].id).toBe(`r${MAX_RECORDS + 4}`)
  })

  it('se lo spazio non basta scarta le più vecchie e salva comunque la nuova', () => {
    const st = fakeStorage(20000)
    for (let i = 0; i < 6; i++) addRecord(rec(`old${i}`, `2026-01-0${i + 1}T00:00:00Z`, 40), st)
    const saved = addRecord(rec('nuova', '2026-03-01T00:00:00Z', 40), st)
    expect(saved[0].id).toBe('nuova')
    expect(loadHistory(st)[0].id).toBe('nuova')
  })

  it('ignora dati salvati illeggibili', () => {
    const st = { getItem: () => 'non json', setItem: () => undefined }
    expect(loadHistory(st)).toEqual([])
    expect(loadHistory({ getItem: () => JSON.stringify([{ id: 1 }]) })).toEqual([])
  })
})
