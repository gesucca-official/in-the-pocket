import type { Exercise, Instrument, Pattern } from '../engine/types'

export interface BeatPreset {
  id: string
  name: string
  /** Cosa si suona e cosa allena questo ritmo. */
  description: string
  bpm: number
  patterns: Partial<Record<Instrument, Pattern>>
}

/** Pattern di una battuta su griglia di 16esimi (passi 0-15; i movimenti cadono su 0, 4, 8, 12). */
export const bar16 = (...hits: number[]): Pattern => ({ stepsPerBeat: 4, bars: 1, hits })
export const EIGHTHS = [0, 2, 4, 6, 8, 10, 12, 14]
export const SIXTEENTHS = Array.from({ length: 16 }, (_, i) => i)

const range = (n: number): number[] => Array.from({ length: n }, (_, i) => i)

/**
 * Ritmi classici da studiare. Sono versioni semplificate dei ritmi di base:
 * "stile di" indica il groove tipico di un gruppo o di un genere, non la trascrizione di un brano.
 */
export const BEAT_PRESETS: BeatPreset[] = [
  {
    id: 'rock-base',
    name: 'Rock classico',
    description:
      'Cassa su 1 e 3, rullante su 2 e 4, charleston in 8vi. Il ritmo di base di gran parte del rock (stile AC/DC): il punto di partenza.',
    bpm: 100,
    patterns: { kick: bar16(0, 8), snare: bar16(4, 12), hihat: bar16(...EIGHTHS) }
  },
  {
    id: 'rock-cassa-3',
    name: 'Rock con cassa doppia su 3',
    description:
      'Come il rock classico, ma con una cassa in più sul "e" del 3. Allena l’indipendenza tra cassa e charleston.',
    bpm: 100,
    patterns: { kick: bar16(0, 8, 10), snare: bar16(4, 12), hihat: bar16(...EIGHTHS) }
  },
  {
    id: 'rock-2-battute',
    name: 'Rock con variazione su 2 battute',
    description:
      'Il rock classico, ma ogni due battute la cassa cambia: la seconda battuta ha una cassa in più sul "e" del 3. Obbliga a ricordare dove sei.',
    bpm: 100,
    patterns: {
      kick: { stepsPerBeat: 4, bars: 2, hits: [0, 8, 16, 24, 26] },
      snare: { stepsPerBeat: 4, bars: 2, hits: [4, 12, 20, 28] },
      hihat: { stepsPerBeat: 4, bars: 2, hits: range(16).map((i) => i * 2) }
    }
  },
  {
    id: 'punk-veloce',
    name: 'Punk veloce (stile Ramones)',
    description:
      'Lo stesso ritmo del rock classico a tempo serrato: servono resistenza e un charleston in 8vi regolare.',
    bpm: 170,
    patterns: { kick: bar16(0, 8), snare: bar16(4, 12), hihat: bar16(...EIGHTHS) }
  },
  {
    id: 'hard-rock-8',
    name: 'Hard rock con cassa in 8vi',
    description:
      'Cassa e charleston entrambi in 8vi, rullante su 2 e 4. Tiene occupati piede e mano: la cassa deve restare precisa a tempo sostenuto.',
    bpm: 120,
    patterns: { kick: bar16(...EIGHTHS), snare: bar16(4, 12), hihat: bar16(...EIGHTHS) }
  },
  {
    id: 'rock-ride',
    name: 'Rock con ride in 8vi',
    description:
      'Come il rock classico ma sul ride al posto del charleston: cambia la posizione della mano e il suono, il tempo resta lo stesso.',
    bpm: 110,
    patterns: { kick: bar16(0, 8), snare: bar16(4, 12), ride: bar16(...EIGHTHS) }
  },
  {
    id: 'rock-16',
    name: 'Rock con charleston in 16esimi',
    description:
      'Cassa 1 e 3, rullante 2 e 4, charleston in 16esimi continui. Serve una mano destra veloce e regolare.',
    bpm: 85,
    patterns: { kick: bar16(0, 8), snare: bar16(4, 12), hihat: bar16(...SIXTEENTHS) }
  },
  {
    id: 'another-brick',
    name: 'Another Brick in the Wall (Part 2) – Pink Floyd',
    description:
      'Cassa su tutti i quarti, rullante su 2 e 4, charleston in 8vi: il ritmo "disco" di Nick Mason, costante e pulito.',
    bpm: 104,
    patterns: { kick: bar16(0, 4, 8, 12), snare: bar16(4, 12), hihat: bar16(...EIGHTHS) }
  },
  {
    id: 'four-on-the-floor',
    name: 'Disco / quattro in quarto',
    description:
      'Cassa su ogni quarto, rullante (o clap) su 2 e 4, charleston sui levare. Il charleston "in levare" è la parte difficile.',
    bpm: 120,
    patterns: { kick: bar16(0, 4, 8, 12), snare: bar16(4, 12), hihat: bar16(2, 6, 10, 14) }
  },
  {
    id: 'half-time',
    name: 'Tempo dimezzato (half-time)',
    description:
      'Il rullante cade solo sul 3: il tempo sembra dimezzato. Esercizio per tenere il groove con meno appigli.',
    bpm: 80,
    patterns: { kick: bar16(0, 10), snare: bar16(8), hihat: bar16(...EIGHTHS) }
  },
  {
    id: 'ballata-ride',
    name: 'Ballata con ride in 4ti',
    description:
      'Tempo lento: ride sui quarti, cassa su 1 e 3, rullante su 2 e 4. Tanto spazio tra i colpi, quindi ogni errore si sente.',
    bpm: 62,
    patterns: { kick: bar16(0, 8), snare: bar16(4, 12), ride: bar16(0, 4, 8, 12) }
  },
  {
    id: 'reggae',
    name: 'Reggae (one drop)',
    description:
      'Cassa e rullante insieme solo sul 3, charleston in 8vi. Il primo e il secondo tempo restano vuoti: tenere il tempo senza appoggi.',
    bpm: 75,
    patterns: { kick: bar16(8), snare: bar16(8), hihat: bar16(...EIGHTHS) }
  },
  {
    id: 'shuffle',
    name: 'Shuffle (terzinato)',
    description:
      'Ogni movimento diviso in tre: charleston sul primo e sul terzo colpo della terzina, cassa su 1 e 3, rullante su 2 e 4. Stile rock’n’roll e blues.',
    bpm: 100,
    patterns: {
      kick: { stepsPerBeat: 3, bars: 1, hits: [0, 6] },
      snare: { stepsPerBeat: 3, bars: 1, hits: [3, 9] },
      hihat: { stepsPerBeat: 3, bars: 1, hits: [0, 2, 3, 5, 6, 8, 9, 11] }
    }
  },
  {
    id: 'blues-lento',
    name: 'Blues lento (12/8)',
    description:
      'Tre colpi di charleston per ogni movimento, cassa su 1 e 3, rullante su 2 e 4. Tempo lento e molto "pieno": allena la costanza.',
    bpm: 60,
    patterns: {
      kick: { stepsPerBeat: 3, bars: 1, hits: [0, 6] },
      snare: { stepsPerBeat: 3, bars: 1, hits: [3, 9] },
      hihat: { stepsPerBeat: 3, bars: 1, hits: range(12) }
    }
  },
  {
    id: 'funk-16',
    name: 'Funk in 16esimi',
    description:
      'Charleston in 16esimi continui con cassa sincopata e rullante su 2 e 4. Precisione sulle suddivisioni veloci.',
    bpm: 90,
    patterns: { kick: bar16(0, 6, 10), snare: bar16(4, 12), hihat: bar16(...SIXTEENTHS) }
  },
  {
    id: 'swing',
    name: 'Swing (jazz)',
    description:
      'Ride con il classico disegno "ding, ding-da, ding-da" in terzine, charleston col piede su 2 e 4, cassa leggera sui quarti.',
    bpm: 120,
    patterns: {
      ride: { stepsPerBeat: 3, bars: 1, hits: [0, 3, 5, 6, 9, 11] },
      hihat: { stepsPerBeat: 3, bars: 1, hits: [3, 9] },
      kick: { stepsPerBeat: 3, bars: 1, hits: [0, 3, 6, 9] }
    }
  }
]

/** Applica un ritmo all'esercizio corrente, mantenendo battute e introduzione scelte dall'utente. */
export function exerciseFromBeat(beat: BeatPreset, current: Exercise): Exercise {
  return {
    ...current,
    bpm: beat.bpm,
    parts: {},
    patterns: structuredClone(beat.patterns)
  }
}
