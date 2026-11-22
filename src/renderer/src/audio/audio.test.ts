import { describe, expect, it } from 'vitest'
import { BeatScheduler, type Beat } from './beatScheduler'
import { audioToPerfMs, perfMsToAudio } from './clock'

type Opts = ConstructorParameters<typeof BeatScheduler>[0]

function setup(over: Partial<Opts> = {}): {
  s: BeatScheduler
  beats: Beat[]
  advance: (sec: number) => number
} {
  let now = 10
  const beats: Beat[] = []
  const s = new BeatScheduler({
    bpm: 120,
    beatsPerBar: 4,
    countInBars: 1,
    now: () => now,
    schedule: (b) => beats.push(b),
    ...over
  })
  return { s, beats, advance: (sec: number) => (now += sec) }
}

describe('BeatScheduler', () => {
  it('non programma nulla prima dello start', () => {
    const { s, beats } = setup()
    s.tick()
    expect(beats).toHaveLength(0)
  })

  it('programma i movimenti a distanza 60/bpm, solo entro il lookahead', () => {
    const { s, beats, advance } = setup()
    s.start() // primo movimento a 10.1
    s.tick() // orizzonte 10.1: nessuno (10.1 non è < 10.1)
    expect(beats).toHaveLength(0)
    advance(0.05)
    s.tick()
    expect(beats.map((b) => b.time)).toEqual([10.1])
    advance(0.5)
    s.tick()
    expect(beats.map((b) => b.time)).toEqual([10.1, 10.6])
  })

  it('non duplica i movimenti con tick ripetuti', () => {
    const { s, beats, advance } = setup()
    s.start()
    advance(1)
    s.tick()
    s.tick()
    s.tick()
    expect(new Set(beats.map((b) => b.index)).size).toBe(beats.length)
  })

  it('numera battute, accenti e count-in', () => {
    const { s, beats, advance } = setup()
    s.start()
    advance(5)
    s.tick()
    expect(beats.slice(0, 6).map((b) => [b.bar, b.beatInBar, b.isCountIn])).toEqual([
      [0, 0, true],
      [0, 1, true],
      [0, 2, true],
      [0, 3, true],
      [1, 0, false],
      [1, 1, false]
    ])
  })

  it('il nuovo bpm vale dai movimenti non ancora programmati', () => {
    const { s, beats, advance } = setup({ countInBars: 0 })
    s.start()
    advance(0.05)
    s.tick() // programma 10.1
    s.setBpm(60)
    advance(2)
    s.tick()
    const gaps = beats.slice(1).map((b, i) => b.time - beats[i].time)
    // il primo intervallo è già calcolato a 120 bpm, i successivi a 60
    expect(gaps[0]).toBeCloseTo(0.5)
    expect(gaps[1]).toBeCloseTo(1)
  })

  it('non accumula deriva a 240 bpm su 1000 movimenti', () => {
    const { s, beats, advance } = setup({ bpm: 240, countInBars: 0 })
    s.start()
    for (let i = 0; i < 12000; i++) {
      advance(0.025)
      s.tick()
    }
    expect(beats.length).toBeGreaterThan(1000)
    const last = beats[999]
    expect(last.time).toBeCloseTo(10.1 + 999 * 0.25, 9)
  })

  it('stop interrompe la programmazione', () => {
    const { s, beats, advance } = setup()
    s.start()
    s.stop()
    advance(5)
    s.tick()
    expect(beats).toHaveLength(0)
  })

  it('rifiuta bpm non validi', () => {
    const { s } = setup()
    expect(() => s.setBpm(0)).toThrow(RangeError)
  })
})

describe('clock', () => {
  const anchor = { contextTime: 5, performanceTime: 1000 }
  it('converte audio → performance.now()', () => {
    expect(audioToPerfMs(5.5, anchor)).toBeCloseTo(1500)
  })
  it('è invertibile', () => {
    expect(perfMsToAudio(audioToPerfMs(7.25, anchor), anchor)).toBeCloseTo(7.25)
  })
})
