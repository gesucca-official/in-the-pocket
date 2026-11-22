export type Instrument = 'kick' | 'snare' | 'hihat' | 'tom1' | 'tom2' | 'tom3' | 'crash' | 'ride'

export type Subdivision = 'off' | 'quarter' | 'eighth' | 'eighthTriplet' | 'sixteenth'

/** Groove personalizzato di uno strumento: dove cadono i colpi su una griglia di passi. */
export interface Pattern {
  /** Passi per movimento della griglia (2 = 8vi, 3 = terzine, 4 = 16esimi). */
  stepsPerBeat: number
  /** Lunghezza del pattern in battute, poi si ripete. */
  bars: number
  /** Posizioni dei colpi in passi dall'inizio del pattern (0 = primo movimento). */
  hits: number[]
}

export interface Exercise {
  bpm: number
  /** Battute valutate (il count-in è escluso). */
  bars: number
  countInBars: number
  beatsPerBar: number
  parts: Partial<Record<Instrument, Subdivision>>
  /** Per uno strumento, il pattern ha la precedenza sulla suddivisione uniforme. */
  patterns?: Partial<Record<Instrument, Pattern>>
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
