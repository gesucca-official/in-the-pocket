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

export function anchorFromContext(ctx: AudioContext): ClockAnchor {
  const ts = ctx.getOutputTimestamp()
  return {
    contextTime: ts.contextTime ?? ctx.currentTime,
    performanceTime: ts.performanceTime ?? performance.now()
  }
}
