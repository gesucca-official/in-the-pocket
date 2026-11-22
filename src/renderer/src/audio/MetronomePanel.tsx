import { useEffect, useRef, useState } from 'react'
import { Metronome } from './Metronome'
import type { Beat } from './beatScheduler'

const BEATS_PER_BAR = 4

/** Fase 3: prova del metronomo (BPM, count-in, indicatore dei movimenti). */
export function MetronomePanel(): React.JSX.Element {
  const [bpm, setBpm] = useState(120)
  const [countInBars, setCountInBars] = useState(1)
  const [running, setRunning] = useState(false)
  const [current, setCurrent] = useState<Beat | null>(null)
  const metronome = useRef<Metronome | null>(null)
  const timeouts = useRef<number[]>([])
  const bpmRef = useRef(bpm)

  const clearTimeouts = (): void => {
    timeouts.current.forEach((t) => window.clearTimeout(t))
    timeouts.current = []
  }

  useEffect(() => {
    return () => {
      clearTimeouts()
      metronome.current?.dispose()
      metronome.current = null
    }
  }, [])

  const start = async (): Promise<void> => {
    metronome.current?.dispose()
    metronome.current = new Metronome({
      bpm: bpmRef.current,
      beatsPerBar: BEATS_PER_BAR,
      countInBars,
      onBeat: (beat, perfMs) => {
        // L'indicatore si accende quando il click suona, non quando viene programmato.
        const id = window.setTimeout(
          () => {
            setCurrent(beat)
            timeouts.current = timeouts.current.filter((t) => t !== id)
          },
          Math.max(0, perfMs - performance.now())
        )
        timeouts.current.push(id)
      }
    })
    await metronome.current.start()
    setRunning(true)
  }

  const stop = (): void => {
    metronome.current?.stop()
    clearTimeouts()
    setCurrent(null)
    setRunning(false)
  }

  const changeBpm = (value: number): void => {
    const clamped = Math.min(300, Math.max(30, value || 30))
    bpmRef.current = clamped
    setBpm(clamped)
    metronome.current?.setBpm(clamped)
  }

  return (
    <section className="panel">
      <h2>Metronomo</h2>
      <div className="row">
        <label>
          BPM
          <input
            type="number"
            min={30}
            max={300}
            value={bpm}
            onChange={(e) => changeBpm(Number(e.target.value))}
          />
        </label>
        <input
          type="range"
          min={30}
          max={300}
          value={bpm}
          onChange={(e) => changeBpm(Number(e.target.value))}
        />
        <label>
          Introduzione (battute)
          <select
            value={countInBars}
            disabled={running}
            onChange={(e) => setCountInBars(Number(e.target.value))}
          >
            <option value={0}>nessuno</option>
            <option value={1}>1</option>
            <option value={2}>2</option>
          </select>
        </label>
        <button onClick={running ? stop : () => void start()}>{running ? 'Ferma' : 'Avvia'}</button>
      </div>
      <div className="beats">
        {Array.from({ length: BEATS_PER_BAR }, (_, i) => (
          <span
            key={i}
            className={[
              'beat',
              current?.beatInBar === i ? 'on' : '',
              current?.beatInBar === i && i === 0 ? 'accent' : '',
              current?.isCountIn ? 'countin' : ''
            ].join(' ')}
          />
        ))}
      </div>
      <p className="muted">
        {current
          ? `${current.isCountIn ? 'Introduzione' : 'Battuta'} ${current.bar + 1 - (current.isCountIn ? 0 : countInBars)} · movimento ${current.beatInBar + 1}`
          : 'Fermo'}
      </p>
    </section>
  )
}
