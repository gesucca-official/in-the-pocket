import type { Stats, Summary } from '../engine/scorer'
import { summarize } from '../engine/scorer'
import type { ExerciseSession } from '../engine/session'
import type { Exercise, Instrument } from '../engine/types'
import { describeExercise } from '../presets/describe'

/** Un colpo atteso: `offsetMs` è lo scarto (negativo = anticipo), null se mancato. */
export interface StoredEvent {
  instrument: Instrument
  /** Tempo atteso in ms dall'inizio della parte valutata. */
  timeMs: number
  offsetMs: number | null
}

/** Una prova conclusa, con quanto serve per rivederne i risultati e il grafico. */
export interface SessionRecord {
  id: string
  dateIso: string
  label: string
  exercise: Exercise
  latencyMs: number
  summary: Summary
  events: StoredEvent[]
}

const round1 = (n: number): number => Math.round(n * 10) / 10

/** Chiamare dopo `session.finish()`. */
export function buildRecord(session: ExerciseSession, id: string, now: Date): SessionRecord {
  const events: StoredEvent[] = []
  for (const e of session.events) {
    if (e.type === 'hit') {
      events.push({
        instrument: e.expected.instrument,
        timeMs: Math.round(e.expected.timeMs - session.startMs),
        offsetMs: round1(e.offsetMs)
      })
    } else if (e.type === 'miss') {
      events.push({
        instrument: e.expected.instrument,
        timeMs: Math.round(e.expected.timeMs - session.startMs),
        offsetMs: null
      })
    }
  }
  events.sort((a, b) => a.timeMs - b.timeMs)

  return {
    id,
    dateIso: now.toISOString(),
    label: describeExercise(session.exercise),
    exercise: structuredClone(session.exercise),
    latencyMs: session.latencyOffsetMs,
    summary: summarize(session.events),
    events
  }
}

export type { Stats }
