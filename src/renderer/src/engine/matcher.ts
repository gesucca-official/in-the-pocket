import { rate } from './rules'
import type { ExpectedHit, Instrument, MatchEvent, PlayedHit } from './types'

export interface MatcherOptions {
  /** Latenza misurata con la calibrazione: viene sottratta da ogni colpo. */
  latencyOffsetMs?: number
}

/**
 * Abbina i colpi reali a quelli attesi, in tempo reale.
 * - `onHit` per ogni colpo in arrivo → 'hit' o 'extra'
 * - `flush(nowMs)` periodicamente → 'miss' per i colpi attesi ormai scaduti
 * - `finish()` a fine esercizio → tutti i 'miss' rimasti
 */
export class Matcher {
  private readonly pending = new Map<Instrument, ExpectedHit[]>()
  private readonly latencyOffsetMs: number

  constructor(grid: ExpectedHit[], options: MatcherOptions = {}) {
    this.latencyOffsetMs = options.latencyOffsetMs ?? 0
    for (const hit of grid) {
      const list = this.pending.get(hit.instrument) ?? []
      list.push(hit)
      this.pending.set(hit.instrument, list)
    }
  }

  onHit(played: PlayedHit): MatchEvent {
    const list = this.pending.get(played.instrument)
    const t = played.timeMs - this.latencyOffsetMs

    let bestIndex = -1
    let bestDistance = Infinity
    if (list) {
      for (let i = 0; i < list.length; i++) {
        const distance = Math.abs(t - list[i].timeMs)
        if (distance <= list[i].windowMs && distance < bestDistance) {
          bestIndex = i
          bestDistance = distance
        }
        if (list[i].timeMs - list[i].windowMs > t) break
      }
    }

    if (!list || bestIndex < 0) return { type: 'extra', played }

    const [expected] = list.splice(bestIndex, 1)
    const offsetMs = t - expected.timeMs
    return { type: 'hit', expected, played, offsetMs, rating: rate(offsetMs) }
  }

  flush(nowMs: number): MatchEvent[] {
    const t = nowMs - this.latencyOffsetMs
    const expired: ExpectedHit[] = []
    for (const list of this.pending.values()) {
      while (list.length > 0 && list[0].timeMs + list[0].windowMs < t) {
        expired.push(list.shift()!)
      }
    }
    return expired
      .sort((a, b) => a.timeMs - b.timeMs)
      .map((expected) => ({ type: 'miss', expected }))
  }

  finish(): MatchEvent[] {
    return this.flush(Infinity)
  }
}
