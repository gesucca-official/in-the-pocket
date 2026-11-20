export type Instrument = 'kick' | 'snare' | 'hihat' | 'tom1' | 'tom2' | 'tom3' | 'crash' | 'ride'

export type Subdivision = 'off' | 'quarter' | 'eighth' | 'eighthTriplet' | 'sixteenth'

export interface Exercise {
  bpm: number
  /** Battute valutate (il count-in è escluso). */
  bars: number
  countInBars: number
  beatsPerBar: number
  parts: Partial<Record<Instrument, Subdivision>>
}

/** Colpo atteso dalla griglia. Tempi in ms sull'orologio performance.now(). */
export interface ExpectedHit {
  id: number
  instrument: Instrument
  timeMs: number
  /** Metà distanza massima consentita per abbinare un colpo reale. */
  windowMs: number
}

/** Colpo reale arrivato dal modulo, già tradotto in strumento. */
export interface PlayedHit {
  instrument: Instrument
  timeMs: number
  velocity: number
}

export type Rating = 'perfect' | 'good' | 'ok' | 'off'

export type MatchEvent =
  | { type: 'hit'; expected: ExpectedHit; played: PlayedHit; offsetMs: number; rating: Rating }
  | { type: 'extra'; played: PlayedHit }
  | { type: 'miss'; expected: ExpectedHit }
