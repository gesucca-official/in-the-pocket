import { useCallback, useEffect, useRef, useState } from 'react'
import { Metronome } from '../audio/Metronome'
import { ExerciseSession } from '../engine/session'
import { summarize, type Stats } from '../engine/scorer'
import type { Exercise } from '../engine/types'
import { INSTRUMENT_LABELS, noteToInstrument } from '../midi/padMapping'
import { useMidiNoteOn } from '../midi/useMidiNoteOn'
import { hasCalibration, loadLatency } from '../storage/calibrationStorage'
import { loadMapping } from '../storage/padMappingStorage'
import { loadExercise, saveExercise } from '../storage/exerciseStorage'
import { ExerciseConfig } from './ExerciseConfig'
import { LiveView } from './LiveView'

type Phase = 'config' | 'running' | 'done'

function StatsRow({ label, s }: { label: string; s: Stats }): React.JSX.Element {
  const sign = s.meanOffsetMs > 0 ? '+' : ''
  return (
    <tr>
      <td>{label}</td>
      <td>{s.accuracy.toFixed(0)}%</td>
      <td>
        {s.hits}/{s.expected}
      </td>
      <td>{s.misses}</td>
      <td>{s.extras}</td>
      <td>
        {sign}
        {s.meanOffsetMs.toFixed(1)} ms
      </td>
      <td>{s.stdDevMs.toFixed(1)} ms</td>
    </tr>
  )
}

/** Fase 4: imposta l'esercizio, suona con il click e guarda in tempo reale dove cadono i colpi. */
export function ExercisePanel(): React.JSX.Element {
  const [exercise, setExercise] = useState<Exercise>(() => loadExercise())
  const [phase, setPhase] = useState<Phase>('config')
  const [session, setSession] = useState<ExerciseSession | null>(null)
  const [error, setError] = useState<string | null>(null)
  const metronome = useRef<Metronome | null>(null)
  const sessionRef = useRef<ExerciseSession | null>(null)

  useEffect(() => () => metronome.current?.dispose(), [])

  const change = (next: Exercise): void => {
    setExercise(next)
    saveExercise(next)
  }

  useMidiNoteOn(({ note, velocity, timeMs }) => {
    if (phase === 'running') session?.onNote(note, velocity, timeMs)
  })

  const start = async (): Promise<void> => {
    const mapping = loadMapping()
    const s = new ExerciseSession(exercise, (n) => noteToInstrument(mapping, n), loadLatency())
    metronome.current?.dispose()
    metronome.current = new Metronome({
      bpm: exercise.bpm,
      beatsPerBar: exercise.beatsPerBar,
      countInBars: exercise.countInBars,
      totalBeats: (exercise.countInBars + exercise.bars) * exercise.beatsPerBar,
      onBeat: (beat, perfMs) => {
        if (beat.index === 0) s.begin(perfMs)
      }
    })
    sessionRef.current = s
    setSession(s)
    setError(null)
    try {
      await metronome.current.start()
      setPhase('running')
    } catch (e) {
      metronome.current.dispose()
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  const over = useCallback((): void => {
    metronome.current?.stop()
    sessionRef.current?.finish()
    setPhase('done')
  }, [])

  const abort = (): void => {
    metronome.current?.stop()
    setPhase('config')
  }

  const summary = phase === 'done' && session ? summarize(session.events) : null

  return (
    <section className="panel">
      <h2>Esercizio</h2>
      {error && <p className="error">Impossibile avviare l&apos;audio: {error}</p>}
      {phase === 'config' && (
        <p className="muted">
          {hasCalibration()
            ? `Latenza calibrata: ${loadLatency().toFixed(1)} ms`
            : 'Non calibrata: vai in Strumenti → Calibrazione per misurare la latenza.'}
        </p>
      )}
      {phase === 'config' && (
        <ExerciseConfig exercise={exercise} onChange={change} onStart={() => void start()} />
      )}
      {phase === 'running' && session && (
        <>
          <LiveView session={session} onOver={over} />
          <p>
            <button onClick={abort}>Interrompi</button>
          </p>
        </>
      )}
      {summary && (
        <>
          <table>
            <thead>
              <tr>
                <th />
                <th>Precisione</th>
                <th>Colpiti</th>
                <th>Mancati</th>
                <th>Extra</th>
                <th>Scarto medio</th>
                <th>Costanza (dev. st.)</th>
              </tr>
            </thead>
            <tbody>
              <StatsRow label="Totale" s={summary.total} />
              {session?.activeInstruments.map((inst) => {
                const s = summary.byInstrument[inst]
                return s && <StatsRow key={inst} label={INSTRUMENT_LABELS[inst]} s={s} />
              })}
            </tbody>
          </table>
          <p>
            <button className="primary" onClick={() => setPhase('config')}>
              Nuovo esercizio
            </button>
          </p>
        </>
      )}
    </section>
  )
}
