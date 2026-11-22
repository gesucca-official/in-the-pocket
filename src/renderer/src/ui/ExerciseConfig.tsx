import type { Exercise, Subdivision } from '../engine/types'
import { INSTRUMENTS, INSTRUMENT_LABELS } from '../midi/padMapping'

const SUBDIVISION_LABELS: Record<Subdivision, string> = {
  off: 'spento',
  quarter: '4ti',
  eighth: '8vi',
  eighthTriplet: 'terzine di 8vo',
  sixteenth: '16esimi'
}

interface Props {
  exercise: Exercise
  onChange: (exercise: Exercise) => void
  onStart: () => void
}

/** Impostazione dell'esercizio: tempo, battute e una suddivisione per strumento. */
export function ExerciseConfig({ exercise, onChange, onStart }: Props): React.JSX.Element {
  const setPart = (inst: (typeof INSTRUMENTS)[number], sub: Subdivision): void =>
    onChange({ ...exercise, parts: { ...exercise.parts, [inst]: sub } })
  const hasParts = Object.values(exercise.parts).some((s) => s !== 'off')

  return (
    <>
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
            {[4, 8, 16, 32].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <label>
          Count-in
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
                  value={exercise.parts[inst] ?? 'off'}
                  onChange={(e) => setPart(inst, e.target.value as Subdivision)}
                >
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
      <p>
        <button className="primary" disabled={!hasParts} onClick={onStart}>
          Parti
        </button>
        {!hasParts && <span className="muted"> Scegli almeno uno strumento.</span>}
      </p>
    </>
  )
}
