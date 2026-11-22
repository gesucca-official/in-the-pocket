export interface Beat {
  /** Numero progressivo del movimento, da 0 (count-in incluso). */
  index: number
  /** Battuta, da 0. */
  bar: number
  /** Movimento nella battuta, da 0 (0 = accento). */
  beatInBar: number
  isCountIn: boolean
  /** Istante programmato, in secondi sull'orologio audio. */
  time: number
}

export interface BeatSchedulerOptions {
  bpm: number
  beatsPerBar: number
  countInBars: number
  /** Orologio audio corrente, in secondi. */
  now: () => number
  /** Chiamata per ogni movimento da programmare in anticipo. */
  schedule: (beat: Beat) => void
  /** Quanto in anticipo programmare, in secondi. */
  lookahead?: number
  /** Se presente, dopo questo numero di movimenti non programma più nulla. */
  totalBeats?: number
  /** Ritardo del primo movimento rispetto allo start, in secondi. */
  startDelay?: number
}

/**
 * Cuore del metronomo, senza audio né timer: ogni `tick()` programma tutti i movimenti
 * che cadono entro `lookahead` secondi. Chi lo usa lo richiama spesso (~25 ms).
 */
export class BeatScheduler {
  private bpmValue: number
  private nextIndex = 0
  private nextTime = 0
  private running = false
  private readonly lookahead: number

  constructor(private readonly opts: BeatSchedulerOptions) {
    this.bpmValue = opts.bpm
    this.lookahead = opts.lookahead ?? 0.1
  }

  get bpm(): number {
    return this.bpmValue
  }

  /** Il nuovo tempo vale dal movimento successivo a quelli già programmati. */
  setBpm(bpm: number): void {
    if (!(bpm > 0)) throw new RangeError('BPM non valido')
    this.bpmValue = bpm
  }

  start(): void {
    this.running = true
    this.nextIndex = 0
    this.nextTime = this.opts.now() + (this.opts.startDelay ?? 0.1)
  }

  stop(): void {
    this.running = false
  }

  tick(): void {
    if (!this.running) return
    const horizon = this.opts.now() + this.lookahead
    const total = this.opts.totalBeats ?? Infinity
    while (this.nextTime < horizon && this.nextIndex < total) {
      const { beatsPerBar, countInBars } = this.opts
      const index = this.nextIndex
      this.opts.schedule({
        index,
        bar: Math.floor(index / beatsPerBar),
        beatInBar: index % beatsPerBar,
        isCountIn: index < countInBars * beatsPerBar,
        time: this.nextTime
      })
      this.nextIndex++
      this.nextTime += 60 / this.bpmValue
    }
  }
}
