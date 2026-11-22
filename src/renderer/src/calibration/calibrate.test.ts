import { describe, expect, it } from 'vitest'
import { computeLatency } from './calibrate'

const clicks = Array.from({ length: 16 }, (_, i) => 1000 + i * 600)

describe('computeLatency', () => {
  it('trova la latenza costante', () => {
    const hits = clicks.map((c) => c + 40)
    const r = computeLatency(clicks, hits)!
    expect(r.latencyMs).toBeCloseTo(40)
    expect(r.spreadMs).toBeCloseTo(0)
    expect(r.used).toBe(12) // 16 − 4 scartati
  })

  it('scarta i primi 4 click, anche se molto sbagliati', () => {
    const hits = clicks.map((c, i) => c + (i < 4 ? 200 : 30))
    expect(computeLatency(clicks, hits)!.latencyMs).toBeCloseTo(30)
  })

  it('la mediana ignora un colpo anomalo', () => {
    const hits = clicks.map((c, i) => c + (i === 9 ? 250 : 35))
    expect(computeLatency(clicks, hits)!.latencyMs).toBeCloseTo(35)
  })

  it('ignora i colpi extra lontani dai click', () => {
    const hits = [...clicks.map((c) => c + 25), clicks[6] + 300]
    const r = computeLatency(clicks, hits)!
    expect(r.latencyMs).toBeCloseTo(25)
    expect(r.used).toBe(12)
  })

  it('con due colpi vicini allo stesso click tiene il più vicino', () => {
    const hits = [...clicks.map((c) => c + 20), clicks[8] + 120]
    expect(computeLatency(clicks, hits)!.latencyMs).toBeCloseTo(20)
  })

  it('accetta scarti negativi (colpi in anticipo)', () => {
    const hits = clicks.map((c) => c - 15)
    expect(computeLatency(clicks, hits)!.latencyMs).toBeCloseTo(-15)
  })

  it('restituisce null se i colpi validi sono pochi', () => {
    expect(
      computeLatency(
        clicks,
        clicks.slice(0, 8).map((c) => c + 40)
      )
    ).toBeNull()
    expect(computeLatency(clicks, [])).toBeNull()
  })

  it('misura la dispersione', () => {
    const hits = clicks.map((c, i) => c + (i % 2 ? 20 : 60))
    expect(computeLatency(clicks, hits)!.spreadMs).toBeCloseTo(20)
  })
})
