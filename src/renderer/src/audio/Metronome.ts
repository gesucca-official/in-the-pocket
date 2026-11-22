import { BeatScheduler, type Beat } from './beatScheduler'
import { anchorFromContext, audioToPerfMs } from './clock'

export interface MetronomeOptions {
  bpm: number
  beatsPerBar: number
  countInBars: number
  /** Se presente, il click si ferma dopo questo numero di movimenti (count-in incluso). */
  totalBeats?: number
  /** Chiamata quando un movimento viene programmato; `perfMs` è l'istante di ascolto in performance.now(). */
  onBeat?: (beat: Beat, perfMs: number) => void
}

const TICK_MS = 25
const LOOKAHEAD_S = 0.1

/** Metronomo Web Audio: click programmati sull'orologio audio, non su timer JS. */
export class Metronome {
  private ctx: AudioContext | null = null
  private scheduler: BeatScheduler | null = null
  private timer: ReturnType<typeof setInterval> | null = null
  private bpm: number

  constructor(private readonly opts: MetronomeOptions) {
    this.bpm = opts.bpm
  }

  get running(): boolean {
    return this.timer !== null
  }

  async start(): Promise<void> {
    if (this.running) return
    this.ctx ??= new AudioContext({ latencyHint: 'interactive' })
    const ctx = this.ctx
    if (ctx.state === 'suspended') {
      // Se l'audio non si sblocca, meglio un errore chiaro che un'attesa infinita.
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error('AudioContext bloccato (stato: ' + ctx.state + ')')),
          2000
        )
      )
      await Promise.race([ctx.resume(), timeout])
    }

    this.scheduler = new BeatScheduler({
      bpm: this.bpm,
      beatsPerBar: this.opts.beatsPerBar,
      countInBars: this.opts.countInBars,
      totalBeats: this.opts.totalBeats,
      lookahead: LOOKAHEAD_S,
      now: () => ctx.currentTime,
      schedule: (beat) => {
        this.click(ctx, beat)
        this.opts.onBeat?.(beat, audioToPerfMs(beat.time, anchorFromContext(ctx)))
      }
    })
    this.scheduler.start()
    this.scheduler.tick()
    this.timer = setInterval(() => this.scheduler?.tick(), TICK_MS)
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer)
    this.timer = null
    this.scheduler?.stop()
  }

  setBpm(bpm: number): void {
    this.bpm = bpm
    this.scheduler?.setBpm(bpm)
  }

  dispose(): void {
    this.stop()
    void this.ctx?.close()
    this.ctx = null
  }

  private click(ctx: AudioContext, beat: Beat): void {
    const accent = beat.beatInBar === 0
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.frequency.value = accent ? 1600 : 1000
    const t = beat.time
    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(accent ? 0.9 : 0.6, t + 0.002)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05)
    osc.connect(gain).connect(ctx.destination)
    osc.start(t)
    osc.stop(t + 0.06)
  }
}
