import { describe, expect, it } from 'vitest'
import { generateGrid, intervalMs, scoredStartMs } from './grid'
import { Matcher } from './matcher'
import { rate } from './rules'
import { summarize } from './scorer'
import type { Exercise, Instrument, MatchEvent, PlayedHit } from './types'

const groove: Exercise = {
  bpm: 120,
  bars: 1,
  countInBars: 1,
  beatsPerBar: 4,
  parts: { kick: 'quarter', hihat: 'eighth', snare: 'sixteenth' }
}

const hit = (instrument: Instrument, timeMs: number): PlayedHit => ({
  instrument,
  timeMs,
  velocity: 100
})

describe('grid', () => {
  it('genera il numero giusto di colpi per strumento', () => {
    const grid = generateGrid(groove, 0)
    const count = (i: Instrument): number => grid.filter((h) => h.instrument === i).length
    expect(count('kick')).toBe(4)
    expect(count('hihat')).toBe(8)
    expect(count('snare')).toBe(16)
  })

  it('distanzia i colpi secondo la suddivisione', () => {
    const kicks = generateGrid(groove, 1000).filter((h) => h.instrument === 'kick')
    expect(kicks.map((h) => h.timeMs)).toEqual([1000, 1500, 2000, 2500])
    expect(intervalMs(120, 'sixteenth')).toBe(125)
    expect(intervalMs(120, 'eighthTriplet')).toBeCloseTo(166.667, 2)
  })

  it('limita la finestra a metà intervallo e al massimo 100 ms', () => {
    const grid = generateGrid(groove, 0)
    expect(grid.find((h) => h.instrument === 'snare')!.windowMs).toBe(62.5)
    expect(grid.find((h) => h.instrument === 'kick')!.windowMs).toBe(100)
  })

  it('salta gli strumenti spenti e calcola il count-in', () => {
    const grid = generateGrid({ ...groove, parts: { kick: 'quarter', snare: 'off' } }, 0)
    expect(grid.every((h) => h.instrument === 'kick')).toBe(true)
    expect(scoredStartMs(groove, 0)).toBe(2000)
  })
})

describe('matcher', () => {
  const kickOnly: Exercise = { ...groove, parts: { kick: 'quarter' } }

  it('segnala anticipo (negativo) e ritardo (positivo)', () => {
    const m = new Matcher(generateGrid(kickOnly, 0))
    const early = m.onHit(hit('kick', -12))
    const late = m.onHit(hit('kick', 530))
    expect(early).toMatchObject({ type: 'hit', offsetMs: -12, rating: 'good' })
    expect(late).toMatchObject({ type: 'hit', offsetMs: 30, rating: 'ok' })
  })

  it('sottrae la latenza calibrata', () => {
    const m = new Matcher(generateGrid(kickOnly, 0), { latencyOffsetMs: 20 })
    expect(m.onHit(hit('kick', 20))).toMatchObject({ type: 'hit', offsetMs: 0, rating: 'perfect' })
  })

  it('considera extra i colpi fuori finestra, doppi o di altri strumenti', () => {
    const m = new Matcher(generateGrid(kickOnly, 0))
    expect(m.onHit(hit('kick', 250)).type).toBe('extra')
    expect(m.onHit(hit('kick', 2)).type).toBe('hit')
    expect(m.onHit(hit('kick', 5)).type).toBe('extra')
    expect(m.onHit(hit('snare', 500)).type).toBe('extra')
  })

  it('segnala i mancati solo dopo la scadenza della finestra', () => {
    const m = new Matcher(generateGrid(kickOnly, 0))
    expect(m.flush(50)).toHaveLength(0)
    expect(m.flush(101)).toHaveLength(1)
    m.onHit(hit('kick', 500))
    const rest = m.finish()
    expect(rest.map((e) => e.type === 'miss' && e.expected.timeMs)).toEqual([1000, 1500])
  })
})

describe('scorer', () => {
  it('calcola precisione, scarto medio e costanza', () => {
    const m = new Matcher(generateGrid({ ...groove, parts: { kick: 'quarter' } }, 0))
    const events: MatchEvent[] = [
      m.onHit(hit('kick', -10)), // perfect, 100
      m.onHit(hit('kick', 490)), // perfect, 100
      m.onHit(hit('kick', 1030)), // ok, 40
      m.onHit(hit('kick', 1250)), // extra
      ...m.finish() // 1 mancato
    ]
    const { total, byInstrument } = summarize(events)
    expect(total).toMatchObject({ expected: 4, hits: 3, misses: 1, extras: 1 })
    expect(total.accuracy).toBeCloseTo((240 / 400) * 100)
    expect(total.meanOffsetMs).toBeCloseTo((-10 - 10 + 30) / 3)
    expect(total.stdDevMs).toBeGreaterThan(0)
    expect(byInstrument.kick).toEqual(total)
  })

  it('valuta i colpi con le soglie', () => {
    expect(rate(-10)).toBe('perfect')
    expect(rate(25)).toBe('good')
    expect(rate(-50)).toBe('ok')
    expect(rate(51)).toBe('off')
  })
})
