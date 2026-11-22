import { useState } from 'react'
import { activeInstruments } from '../engine/grid'
import type { Exercise, Subdivision } from '../engine/types'
import { INSTRUMENTS, INSTRUMENT_LABELS } from '../midi/padMapping'
import { DEFAULT_EXERCISE } from '../storage/exerciseStorage'
import { SUBDIVISION_LABELS } from '../presets/describe'
import { PresetBar } from './PresetBar'

const BAR_OPTIONS = [8, 16, 32, 64, 128]

interface Props {
  exercise: Exercise
  onChange: (exercise: Exercise) => void
  onStart: () => void
}

/** Impostazione dell'esercizio: tempo, battute e una suddivisione per strumento. */
export function ExerciseConfig({ exercise, onChange, onStart }: Props): React.JSX.Element {
  const setPart = (inst: (typeof INSTRUMENTS)[number], sub: Subdivision | 'pattern'): void => {
    if (sub === 'pattern') return
    const patterns = { ...exercise.patterns }
    delete patterns[inst]
    onChange({ ...exercise, patterns, parts: { ...exercise.parts, [inst]: sub } })
  }
  // cambiando la chiave, PresetBar riparte con le scelte azzerate
  const [resetCount, setResetCount] = useState(0)
  const reset = (): void => {
    onChange(structuredClone(DEFAULT_EXERCISE))
    setResetCount((n) => n + 1)
  }
  const hasParts = activeInstruments(exercise).length > 0

  return (
    <>
      <div className="startbar">
        <button className="primary" disabled={!hasParts} onClick={onStart}>
          Parti
        </button>
        <button onClick={reset}>Ripristina valori iniziali</button>
        {!hasParts && <span className="muted">Scegli almeno uno strumento.</span>}
      </div>
      <PresetBar key={resetCount} exercise={exercise} onChange={onChange} />
      <div className="row">
        <label>
          BPM
          <input
            type="number"
            min={30}
            max={300}
            value={exercise.bpm}
            onChange={(e) =>
              onChange({
                ...exercise,
                bpm: Math.min(300, Math.max(30, Number(e.target.value) || 30))
              })
            }
          />
        </label>
        <label>
          Battute
          <select
            value={exercise.bars}
            onChange={(e) => onChange({ ...exercise, bars: Number(e.target.value) })}
          >
            {[...new Set([...BAR_OPTIONS, exercise.bars])]
              .sort((a, b) => a - b)
              .map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
          </select>
        </label>
        <label>
          Introduzione
          <select
            value={exercise.countInBars}
            onChange={(e) => onChange({ ...exercise, countInBars: Number(e.target.value) })}
          >
            <option value={0}>nessuno</option>
            <option value={1}>1 battuta</option>
            <option value={2}>2 battute</option>
          </select>
        </label>
      </div>
      <table>
        <thead>
          <tr>
            <th>Strumento</th>
            <th>Suddivisione</th>
          </tr>
        </thead>
        <tbody>
          {INSTRUMENTS.map((inst) => (
            <tr key={inst}>
              <td>{INSTRUMENT_LABELS[inst]}</td>
              <td>
                <select
                  value={exercise.patterns?.[inst] ? 'pattern' : (exercise.parts[inst] ?? 'off')}
                  onChange={(e) => setPart(inst, e.target.value as Subdivision | 'pattern')}
                >
                  {exercise.patterns?.[inst] && <option value="pattern">dal groove</option>}
                  {(Object.keys(SUBDIVISION_LABELS) as Subdivision[]).map((s) => (
                    <option key={s} value={s}>
                      {SUBDIVISION_LABELS[s]}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}
