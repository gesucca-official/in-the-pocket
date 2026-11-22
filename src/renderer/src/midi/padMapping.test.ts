import { describe, expect, it } from 'vitest'
import {
  DEFAULT_MAPPING,
  assignNote,
  cloneMapping,
  noteToInstrument,
  parseMapping,
  removeNote
} from './padMapping'
import { loadMapping, saveMapping } from '../storage/padMappingStorage'

describe('padMapping', () => {
  it('traduce le note del modulo negli strumenti', () => {
    expect(noteToInstrument(DEFAULT_MAPPING, 36)).toBe('kick')
    expect(noteToInstrument(DEFAULT_MAPPING, 37)).toBe('snare')
    expect(noteToInstrument(DEFAULT_MAPPING, 44)).toBe('hihat')
    expect(noteToInstrument(DEFAULT_MAPPING, 59)).toBe('ride')
    expect(noteToInstrument(DEFAULT_MAPPING, 100)).toBeNull()
  })

  it('assegna una nota in più allo strumento senza mutare l’originale', () => {
    const next = assignNote(DEFAULT_MAPPING, 'tom1', 50)
    expect(next.tom1).toEqual([48, 50])
    expect(DEFAULT_MAPPING.tom1).toEqual([48])
  })

  it('sposta la nota se era di un altro strumento', () => {
    const next = assignNote(DEFAULT_MAPPING, 'kick', 38)
    expect(next.kick).toEqual([36, 38])
    expect(next.snare).toEqual([37])
  })

  it('rimuove una nota', () => {
    expect(removeNote(DEFAULT_MAPPING, 'ride', 53).ride).toEqual([51, 59])
  })

  it('scarta mappature salvate non valide', () => {
    expect(parseMapping(null)).toBeNull()
    expect(parseMapping('non json')).toBeNull()
    expect(parseMapping(JSON.stringify({ kick: [36] }))).toBeNull()
    const dup = cloneMapping(DEFAULT_MAPPING)
    dup.snare.push(36)
    expect(parseMapping(JSON.stringify(dup))).toBeNull()
    const bad = cloneMapping(DEFAULT_MAPPING)
    bad.kick = [200]
    expect(parseMapping(JSON.stringify(bad))).toBeNull()
  })

  it('salva e ricarica; senza nulla di salvato usa i default', () => {
    const store = new Map<string, string>()
    const fake = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v)
    }
    expect(loadMapping(fake)).toEqual(DEFAULT_MAPPING)
    saveMapping(assignNote(DEFAULT_MAPPING, 'tom1', 50), fake)
    expect(loadMapping(fake).tom1).toEqual([48, 50])
  })
})
