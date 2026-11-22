import { useCallback, useEffect, useRef, useState } from 'react'
import { Metronome } from '../audio/Metronome'
import { ExerciseSession } from '../engine/session'
import type { Exercise } from '../engine/types'
import { noteToInstrument } from '../midi/padMapping'
import { useMidiNoteOn } from '../midi/useMidiNoteOn'
import { hasCalibration, loadLatency } from '../storage/calibrationStorage'
import { loadMapping } from '../storage/padMappingStorage'
import { loadExercise, saveExercise } from '../storage/exerciseStorage'
import { buildRecord, type SessionRecord } from '../results/record'
import { ResultsView } from '../results/ResultsView'
import { addRecord } from '../storage/historyStorage'
import { ExerciseConfig } from './ExerciseConfig'
import { LiveView } from './LiveView'

type Phase = 'config' | 'starting' | 'running' | 'done'

/** Fase 4: imposta l'esercizio, suona con il click e guarda in tempo reale dove cadono i colpi. */
export function ExercisePanel(): React.JSX.Element {
  const [exercise, setExercise] = useState<Exercise>(() => loadExercise())
  const [phase, setPhase] = useState<Phase>('config')
  const [session, setSession] = useState<ExerciseSession | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [record, setRecord] = useState<SessionRecord | null>(null)
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
    setPhase('starting')
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
      setPhase('config')
    }
  }

  const over = useCallback((): void => {
    metronome.current?.stop()
    const finished = sessionRef.current
    if (finished) {
      finished.finish()
      const r = buildRecord(finished, crypto.randomUUID(), new Date())
      addRecord(r)
      setRecord(r)
    }
    setPhase('done')
  }, [])

  const abort = (): void => {
    metronome.current?.stop()
    setPhase('config')
  }

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
      {phase === 'starting' && <p className="muted">Avvio…</p>}
      {phase === 'running' && session && (
        <>
          <LiveView session={session} onOver={over} />
          <p>
            <button onClick={abort}>Interrompi</button>
          </p>
        </>
      )}
      {phase === 'done' && record && (
        <>
          <p>
            <button className="primary" onClick={() => void start()}>
              Riprova
            </button>{' '}
            <button onClick={() => setPhase('config')}>Nuovo esercizio</button>
          </p>
          <ResultsView record={record} />
        </>
      )}
    </section>
  )
}
