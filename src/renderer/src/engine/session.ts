import { activeInstruments, beatMs, generateGrid, scoredStartMs } from './grid'
import { Matcher } from './matcher'
import { MAX_WINDOW_MS } from './rules'
import type { Exercise, ExpectedHit, Instrument, MatchEvent } from './types'

/**
 * Una prova dell'esercizio, senza MIDI né audio: riceve il primo click del count-in
 * e poi i colpi (nota MIDI + tempo), e produce gli eventi dell'abbinamento.
 */
export class ExerciseSession {
  readonly events: MatchEvent[] = []
  grid: ExpectedHit[] = []
  startMs = 0
  endMs = 0
  private matcher: Matcher | null = null

  constructor(
    readonly exercise: Exercise,
    private readonly resolve: (note: number) => Instrument | null,
    readonly latencyOffsetMs = 0
  ) {}

  get started(): boolean {
    return this.matcher !== null
  }

  /** Strumenti con una suddivisione attiva, cioè quelli valutati. */
  get activeInstruments(): Instrument[] {
    return activeInstruments(this.exercise)
  }

  /** `firstClickMs`: istante (performance.now) del primo click del count-in. */
  begin(firstClickMs: number): void {
    const ex = this.exercise
    this.startMs = scoredStartMs(ex, firstClickMs)
    this.endMs = this.startMs + ex.bars * ex.beatsPerBar * beatMs(ex.bpm)
    this.grid = generateGrid(ex, this.startMs)
    this.matcher = new Matcher(this.grid, { latencyOffsetMs: this.latencyOffsetMs })
  }

  /**
   * Ignora le note non mappate, gli strumenti fuori dall'esercizio e i colpi
   * fuori dal periodo valutato (count-in compreso).
   */
  onNote(note: number, velocity: number, timeMs: number): MatchEvent | null {
    if (!this.matcher) return null
    const instrument = this.resolve(note)
    if (!instrument || !this.activeInstruments.includes(instrument)) return null
    if (timeMs < this.startMs - MAX_WINDOW_MS || timeMs > this.endMs + MAX_WINDOW_MS) return null
    const event = this.matcher.onHit({ instrument, timeMs, velocity })
    this.events.push(event)
    return event
  }

  /** Segna come mancati i colpi attesi ormai scaduti. */
  flush(nowMs: number): MatchEvent[] {
    const missed = this.matcher?.flush(nowMs) ?? []
    this.events.push(...missed)
    return missed
  }

  isOver(nowMs: number): boolean {
    return this.started && nowMs > this.endMs + MAX_WINDOW_MS + this.latencyOffsetMs
  }

  finish(): MatchEvent[] {
    const missed = this.matcher?.finish() ?? []
    this.events.push(...missed)
    return missed
  }
}
