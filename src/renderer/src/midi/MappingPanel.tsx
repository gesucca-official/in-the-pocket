import { useState } from 'react'
import type { Instrument } from '../engine/types'
import { saveMapping, loadMapping } from '../storage/padMappingStorage'
import {
  DEFAULT_MAPPING,
  INSTRUMENTS,
  INSTRUMENT_LABELS,
  assignNote,
  cloneMapping,
  noteToInstrument,
  removeNote,
  type PadMapping
} from './padMapping'
import { useMidiNoteOn } from './useMidiNoteOn'

/** Fase 2: mappatura dei pad. "Impara" e poi colpisci il pad: la nota viene assegnata allo strumento. */
export function MappingPanel(): React.JSX.Element {
  const [mapping, setMapping] = useState<PadMapping>(() => loadMapping())
  const [learning, setLearning] = useState<Instrument | null>(null)
  const [last, setLast] = useState<{ note: number; velocity: number } | null>(null)

  const update = (next: PadMapping): void => {
    setMapping(next)
    saveMapping(next)
  }

  useMidiNoteOn(({ note, velocity }) => {
    setLast({ note, velocity })
    if (learning) {
      update(assignNote(mapping, learning, note))
      setLearning(null)
    }
  })

  const lastInstrument = last ? noteToInstrument(mapping, last.note) : null

  return (
    <section className="panel">
      <h2>Mappatura dei pad</h2>
      <p className="muted">
        {learning
          ? `Colpisci il pad per ${INSTRUMENT_LABELS[learning]}…`
          : last
            ? `Ultimo colpo: nota ${last.note} (velocity ${last.velocity}) → ${lastInstrument ? INSTRUMENT_LABELS[lastInstrument] : 'non assegnata'}`
            : 'Colpisci un pad per vedere a quale strumento corrisponde.'}
      </p>
      <table>
        <thead>
          <tr>
            <th>Strumento</th>
            <th>Note MIDI</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {INSTRUMENTS.map((inst) => (
            <tr key={inst} className={last && lastInstrument === inst ? 'hit' : undefined}>
              <td>{INSTRUMENT_LABELS[inst]}</td>
              <td>
                {mapping[inst].length === 0 && <span className="muted">nessuna</span>}
                {mapping[inst].map((n) => (
                  <span key={n} className="chip">
                    {n}
                    <button
                      className="chip-x"
                      title={`Rimuovi la nota ${n}`}
                      onClick={() => update(removeNote(mapping, inst, n))}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </td>
              <td>
                <button onClick={() => setLearning(learning === inst ? null : inst)}>
                  {learning === inst ? 'Annulla' : 'Aggiungi nota'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>
        <button onClick={() => update(cloneMapping(DEFAULT_MAPPING))}>Ripristina MPS-750X</button>
      </p>
    </section>
  )
}
