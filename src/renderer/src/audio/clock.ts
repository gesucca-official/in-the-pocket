/** Punto di riferimento che lega l'orologio audio a performance.now() (vedi AudioContext.getOutputTimestamp). */
export interface ClockAnchor {
  /** Tempo AudioContext in secondi. */
  contextTime: number
  /** Valore di performance.now() in ms nello stesso istante. */
  performanceTime: number
}

/** Tempo AudioContext (s) → performance.now() (ms). */
export function audioToPerfMs(ctxTime: number, anchor: ClockAnchor): number {
  return anchor.performanceTime + (ctxTime - anchor.contextTime) * 1000
}

/** performance.now() (ms) → tempo AudioContext (s). */
export function perfMsToAudio(perfMs: number, anchor: ClockAnchor): number {
  return anchor.contextTime + (perfMs - anchor.performanceTime) / 1000
}

/** Parte di AudioContext che serve a ricavare il riferimento (comoda da simulare nei test). */
export interface ClockSource {
  currentTime: number
  getOutputTimestamp(): { contextTime?: number; performanceTime?: number }
}

/**
 * Riferimento tra orologio audio e performance.now().
 * Appena creato, un AudioContext restituisce {0, 0} da getOutputTimestamp(): in quel caso
 * ripiega su currentTime e performance.now() letti insieme (errore al più la latenza di uscita,
 * che la calibrazione compenserà).
 */
export function anchorFromContext(
  ctx: ClockSource,
  now: () => number = () => performance.now()
): ClockAnchor {
  const ts = ctx.getOutputTimestamp()
  if (ts.performanceTime && ts.performanceTime > 0 && ts.contextTime !== undefined) {
    return { contextTime: ts.contextTime, performanceTime: ts.performanceTime }
  }
  return { contextTime: ctx.currentTime, performanceTime: now() }
}
