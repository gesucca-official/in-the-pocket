import { useEffect, useRef, useState } from 'react'
import { Metronome } from '../audio/Metronome'
import {
  clearLatency,
  hasCalibration,
  loadLatency,
  saveLatency
} from '../storage/calibrationStorage'
import { useMidiNoteOn } from '../midi/useMidiNoteOn'
import { computeLatency, type CalibrationResult } from './calibrate'

const BPM = 90
const CLICKS = 16

type Phase = 'idle' | 'running' | 'result' | 'failed'

/** Fase 5: 16 click in 4ti, colpisci un pad qualsiasi a tempo; la mediana degli scarti è la latenza. */
export function CalibrationPanel(): React.JSX.Element {
  const [phase, setPhase] = useState<Phase>('idle')
  const [count, setCount] = useState(0)
  const [result, setResult] = useState<CalibrationResult | null>(null)
  const [saved, setSaved] = useState<number | null>(() => (hasCalibration() ? loadLatency() : null))
  const [error, setError] = useState<string | null>(null)
  const metronome = useRef<Metronome | null>(null)
  const clicks = useRef<number[]>([])
  const hits = useRef<number[]>([])
  const timers = useRef<number[]>([])

  const clearTimers = (): void => {
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = []
  }

  useEffect(
    () => () => {
      clearTimers()
      metronome.current?.dispose()
    },
    []
  )

  // un colpo conta solo mentre la calibrazione è in corso, su qualsiasi pad
  useMidiNoteOn(({ timeMs }) => {
    if (phase === 'running') hits.current.push(timeMs)
  })

  const start = async (): Promise<void> => {
    clearTimers()
    clicks.current = []
    hits.current = []
    setCount(0)
    setResult(null)
    setError(null)
    metronome.current?.dispose()
    metronome.current = new Metronome({
      bpm: BPM,
      beatsPerBar: 4,
      countInBars: 0,
      totalBeats: CLICKS,
      onBeat: (beat, perfMs) => {
        clicks.current.push(perfMs)
        const showAt = window.setTimeout(
          () => setCount(beat.index + 1),
          Math.max(0, perfMs - performance.now())
        )
        timers.current.push(showAt)
        if (beat.index === CLICKS - 1) {
          // si chiude mezzo secondo dopo l'ultimo click, per dare tempo all'ultimo colpo
          const end = window.setTimeout(finish, Math.max(0, perfMs - performance.now()) + 500)
          timers.current.push(end)
        }
      }
    })
    try {
      await metronome.current.start()
      setPhase('running')
    } catch (e) {
      metronome.current.dispose()
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  const finish = (): void => {
    metronome.current?.stop()
    const r = computeLatency(clicks.current, hits.current)
    setResult(r)
    setPhase(r ? 'result' : 'failed')
  }

  const abort = (): void => {
    clearTimers()
    metronome.current?.stop()
    setPhase('idle')
  }

  const save = (): void => {
    if (!result) return
    saveLatency(result.latencyMs)
    setSaved(result.latencyMs)
    setPhase('idle')
  }

  const reset = (): void => {
    clearLatency()
    setSaved(null)
  }

  return (
    <section className="panel">
      <h2>Calibrazione</h2>
      <p className="muted">
        {saved === null
          ? 'Non calibrata: gli scarti includono la latenza dell’uscita audio.'
          : `Latenza salvata: ${saved.toFixed(1)} ms (viene sottratta da tutti gli scarti).`}
      </p>
      {error && <p className="error">Impossibile avviare l&apos;audio: {error}</p>}

      {phase === 'idle' && (
        <>
          <p className="muted">
            Partono {CLICKS} click a {BPM} BPM: colpisci un pad qualsiasi a tempo, sempre lo stesso,
            come se suonassi sul click. I primi 4 non contano. Rifalla quando cambi cuffie o casse.
          </p>
          <p>
            <button className="primary" onClick={() => void start()}>
              Calibra
            </button>{' '}
            {saved !== null && <button onClick={reset}>Azzera</button>}
          </p>
        </>
      )}

      {phase === 'running' && (
        <>
          <p>
            Click {count} / {CLICKS} — colpisci a tempo
          </p>
          <progress max={CLICKS} value={count} />
          <p>
            <button onClick={abort}>Annulla</button>
          </p>
        </>
      )}

      {phase === 'result' && result && (
        <>
          <p>
            Latenza misurata: <strong>{result.latencyMs.toFixed(1)} ms</strong> (su {result.used}{' '}
            colpi, dispersione {result.spreadMs.toFixed(1)} ms)
          </p>
          {result.spreadMs > 25 && (
            <p className="error">
              Colpi poco costanti: la misura è incerta, conviene ripetere suonando più regolare.
            </p>
          )}
          <p>
            <button className="primary" onClick={save}>
              Salva e usa
            </button>{' '}
            <button onClick={() => void start()}>Ripeti</button>{' '}
            <button onClick={() => setPhase('idle')}>Scarta</button>
          </p>
        </>
      )}

      {phase === 'failed' && (
        <>
          <p className="error">
            Colpi validi troppo pochi: colpisci a tempo con i click, uno per click, almeno 6 dopo i
            primi 4.
          </p>
          <p>
            <button className="primary" onClick={() => void start()}>
              Riprova
            </button>{' '}
            <button onClick={() => setPhase('idle')}>Chiudi</button>
          </p>
        </>
      )}
    </section>
  )
}
