const KEY = 'itp.latencyOffsetMs'

/** Latenza calibrata in ms; 0 se non è mai stata misurata. */
export function loadLatency(storage: Pick<Storage, 'getItem'> = localStorage): number {
  const value = Number(storage.getItem(KEY))
  return Number.isFinite(value) ? value : 0
}

export function hasCalibration(storage: Pick<Storage, 'getItem'> = localStorage): boolean {
  return storage.getItem(KEY) !== null
}

export function saveLatency(ms: number, storage: Pick<Storage, 'setItem'> = localStorage): void {
  storage.setItem(KEY, String(ms))
}

export function clearLatency(storage: Pick<Storage, 'removeItem'> = localStorage): void {
  storage.removeItem(KEY)
}
