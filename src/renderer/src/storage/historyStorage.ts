import type { SessionRecord } from '../results/record'

const KEY = 'itp.history'
/** Oltre questo numero si scartano le prove più vecchie. */
export const MAX_RECORDS = 50

type Reader = Pick<Storage, 'getItem'>
type ReadWriter = Pick<Storage, 'getItem' | 'setItem'>

function isRecord(x: unknown): x is SessionRecord {
  const r = x as SessionRecord
  return (
    !!r &&
    typeof r.id === 'string' &&
    typeof r.dateIso === 'string' &&
    typeof r.label === 'string' &&
    !!r.exercise &&
    !!r.summary?.total &&
    Array.isArray(r.events)
  )
}

/** Dalla più recente alla più vecchia. */
export function loadHistory(storage: Reader = localStorage): SessionRecord[] {
  try {
    const parsed: unknown = JSON.parse(storage.getItem(KEY) ?? '[]')
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isRecord).sort((a, b) => b.dateIso.localeCompare(a.dateIso))
  } catch {
    return []
  }
}

/**
 * Aggiunge una prova. Se lo spazio non basta scarta le più vecchie e riprova;
 * restituisce l'elenco effettivamente salvato.
 */
export function addRecord(
  record: SessionRecord,
  storage: ReadWriter = localStorage
): SessionRecord[] {
  let list = [record, ...loadHistory(storage)].slice(0, MAX_RECORDS)
  for (;;) {
    try {
      storage.setItem(KEY, JSON.stringify(list))
      return list
    } catch {
      if (list.length <= 1) return list // non c'è modo di salvarla
      list = list.slice(0, Math.ceil(list.length / 2))
    }
  }
}

export function deleteRecord(id: string, storage: ReadWriter = localStorage): SessionRecord[] {
  const list = loadHistory(storage).filter((r) => r.id !== id)
  storage.setItem(KEY, JSON.stringify(list))
  return list
}

export function clearHistory(storage: Pick<Storage, 'removeItem'> = localStorage): void {
  storage.removeItem(KEY)
}
