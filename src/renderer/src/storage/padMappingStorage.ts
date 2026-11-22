import { DEFAULT_MAPPING, cloneMapping, parseMapping, type PadMapping } from '../midi/padMapping'

const KEY = 'itp.padMapping'

export function loadMapping(storage: Pick<Storage, 'getItem'> = localStorage): PadMapping {
  return parseMapping(storage.getItem(KEY)) ?? cloneMapping(DEFAULT_MAPPING)
}

export function saveMapping(
  mapping: PadMapping,
  storage: Pick<Storage, 'setItem'> = localStorage
): void {
  storage.setItem(KEY, JSON.stringify(mapping))
}
