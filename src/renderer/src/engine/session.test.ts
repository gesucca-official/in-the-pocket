import { describe, expect, it } from 'vitest'
import { ExerciseSession } from './session'
import { summarize } from './scorer'
import type { Exercise, Instrument } from './types'

const exercise: Exercise = {
  bpm: 120,
  bars: 1,
  countInBars: 1,
  beatsPerBar: 4,
  parts: { kick: 'quarter', snare: 'off' }
}
const resolve = (n: number): Instrument | null => (n === 36 ? 'kick' : n === 38 ? 'snare' : null)

// 120 bpm → un movimento = 500 ms; primo click a 1000 → count-in 1000..3000, valutate da 3000.
function started(): ExerciseSession {
  const s = new ExerciseSession(exercise, resolve)
  s.begin(1000)
  return s
}

describe('ExerciseSession', () => {
  it('calcola inizio e fine della parte valutata', () => {
    const s = started()
    expect(s.startMs).toBe(3000)
    expect(s.endMs).toBe(5000)
    expect(s.grid.map((h) => h.timeMs)).toEqual([3000, 3500, 4000, 4500])
  })

  it('ignora i colpi prima di begin()', () => {
    const s = new ExerciseSession(exercise, resolve)
    expect(s.onNote(36, 100, 3000)).toBeNull()
  })

  it('abbina un colpo e ne misura lo scarto', () => {
    const s = started()
    const e = s.onNote(36, 100, 3012)
    expect(e).toMatchObject({ type: 'hit', rating: 'good' })
    expect((e as { offsetMs: number }).offsetMs).toBe(12)
  })

  it('ignora note non mappate e strumenti fuori dall’esercizio', () => {
    const s = started()
    expect(s.onNote(99, 100, 3000)).toBeNull()
    expect(s.onNote(38, 100, 3000)).toBeNull() // rullante spento
    expect(s.events).toHaveLength(0)
  })

  it('ignora i colpi durante il count-in e dopo la fine', () => {
    const s = started()
    expect(s.onNote(36, 100, 2000)).toBeNull()
    expect(s.onNote(36, 100, 5300)).toBeNull()
  })

  it('segna i mancati con flush e finish', () => {
    const s = started()
    s.onNote(36, 100, 3000)
    expect(s.flush(3700)).toHaveLength(1) // 3500 scaduto
    expect(s.finish()).toHaveLength(2) // 4000 e 4500
    const sum = summarize(s.events)
    expect(sum.total).toMatchObject({ hits: 1, misses: 3 })
  })

  it('sa quando è finita', () => {
    const s = started()
    expect(s.isOver(5000)).toBe(false)
    expect(s.isOver(5101)).toBe(true)
  })
})
