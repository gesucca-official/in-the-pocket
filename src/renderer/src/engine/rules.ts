import type { Rating } from './types'

/** Soglie (in ms, valore assoluto dello scarto) per la valutazione di un colpo. */
export const RATING_THRESHOLDS_MS = {
  perfect: 10,
  good: 25,
  ok: 50
} as const

export const RATING_POINTS: Record<Rating | 'miss', number> = {
  perfect: 100,
  good: 70,
  ok: 40,
  off: 10,
  miss: 0
}

/** Tetto alla finestra di abbinamento, anche per suddivisioni lente. */
export const MAX_WINDOW_MS = 100

export function rate(offsetMs: number): Rating {
  const abs = Math.abs(offsetMs)
  if (abs <= RATING_THRESHOLDS_MS.perfect) return 'perfect'
  if (abs <= RATING_THRESHOLDS_MS.good) return 'good'
  if (abs <= RATING_THRESHOLDS_MS.ok) return 'ok'
  return 'off'
}
