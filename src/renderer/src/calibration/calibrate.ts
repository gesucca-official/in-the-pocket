export interface CalibrationResult {
  /** Mediana di (colpo − click): latenza da sottrarre agli scarti, in ms. */
  latencyMs: number
  /** Deviazione standard degli scarti usati: più è bassa, più la misura è affidabile. */
  spreadMs: number
  /** Colpi effettivamente usati per la misura. */
  used: number
}

export interface CalibrationOptions {
  /** Click iniziali da non contare (l'utente sta ancora entrando nel tempo). */
  discardFirst?: number
  /** Minimo di colpi validi per fidarsi della misura. */
  minHits?: number
}

function median(values: number[]): number {
  const s = [...values].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}

/**
 * Stima la latenza dall'esercizio di calibrazione: ogni click ha al massimo un colpo,
 * quello più vicino entro mezzo movimento; si scartano i primi click e si prende la mediana.
 * Restituisce null se i colpi validi sono troppo pochi.
 */
export function computeLatency(
  clickTimesMs: number[],
  hitTimesMs: number[],
  options: CalibrationOptions = {}
): CalibrationResult | null {
  const discardFirst = options.discardFirst ?? 4
  const minHits = options.minHits ?? 6
  if (clickTimesMs.length < 2) return null
  const halfBeat = (clickTimesMs[1] - clickTimesMs[0]) / 2

  // colpo più vicino a ciascun click (un colpo può servire un solo click: il più vicino)
  const best = new Map<number, { hit: number; distance: number }>()
  for (const hit of hitTimesMs) {
    let nearest = 0
    for (let i = 1; i < clickTimesMs.length; i++) {
      if (Math.abs(hit - clickTimesMs[i]) < Math.abs(hit - clickTimesMs[nearest])) nearest = i
    }
    const distance = Math.abs(hit - clickTimesMs[nearest])
    if (distance > halfBeat) continue
    const current = best.get(nearest)
    if (!current || distance < current.distance) best.set(nearest, { hit, distance })
  }

  const offsets: number[] = []
  for (const [i, { hit }] of best) {
    if (i >= discardFirst) offsets.push(hit - clickTimesMs[i])
  }
  if (offsets.length < minHits) return null

  const mean = offsets.reduce((s, o) => s + o, 0) / offsets.length
  const variance = offsets.reduce((s, o) => s + (o - mean) ** 2, 0) / offsets.length
  return { latencyMs: median(offsets), spreadMs: Math.sqrt(variance), used: offsets.length }
}
