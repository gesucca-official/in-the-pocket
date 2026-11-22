import type { Exercise, Instrument, Pattern } from '../engine/types'

export interface BeatPreset {
  id: string
  name: string
  /** Cosa si suona e a cosa serve esercitarsi con questo beat. */
  description: string
  bpm: number
  patterns: Partial<Record<Instrument, Pattern>>
}

/** Pattern di una battuta su griglia di 16esimi (passi 0-15; i movimenti cadono su 0, 4, 8, 12). */
const bar16 = (...hits: number[]): Pattern => ({ stepsPerBeat: 4, bars: 1, hits })
const EIGHTHS = [0, 2, 4, 6, 8, 10, 12, 14]
const SIXTEENTHS = Array.from({ length: 16 }, (_, i) => i)

/**
 * Groove classici da praticare. Sono versioni semplificate dei ritmi di base:
 * "stile di" indica il groove tipico di un gruppo o di un genere, non la trascrizione di un brano.
 */
export const BEAT_PRESETS: BeatPreset[] = [
  {
    id: 'rock-base',
    name: 'Rock classico',
    description:
      'Cassa su 1 e 3, rullante su 2 e 4, charleston in 8vi. Il beat di base di gran parte del rock (stile AC/DC): il punto di partenza.',
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
    id: 'punk-veloce',
    name: 'Punk veloce (stile Ramones)',
    description:
      'Lo stesso beat del rock classico a tempo serrato: serve resistenza e un charleston in 8vi regolare.',
    bpm: 170,
    patterns: { kick: bar16(0, 8), snare: bar16(4, 12), hihat: bar16(...EIGHTHS) }
  },
  {
    id: 'another-brick',
    name: 'Another Brick in the Wall (Part 2) – Pink Floyd',
    description:
      'Cassa su tutti i quarti, rullante su 2 e 4, charleston in 8vi: il beat "disco" di Nick Mason, ritmo costante e pulito.',
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
    name: 'Half-time',
    description:
      'Il rullante cade solo sul 3: il tempo sembra dimezzato. Esercizio per tenere il groove con meno appigli.',
    bpm: 80,
    patterns: { kick: bar16(0, 10), snare: bar16(8), hihat: bar16(...EIGHTHS) }
  },
  {
    id: 'shuffle',
    name: 'Shuffle (stile rock’n’roll e blues)',
    description:
      'Ogni movimento diviso in tre: charleston sul primo e sul terzo colpo della terzina, cassa su 1 e 3, rullante su 2 e 4.',
    bpm: 100,
    patterns: {
      kick: { stepsPerBeat: 3, bars: 1, hits: [0, 6] },
      snare: { stepsPerBeat: 3, bars: 1, hits: [3, 9] },
      hihat: { stepsPerBeat: 3, bars: 1, hits: [0, 2, 3, 5, 6, 8, 9, 11] }
    }
  },
  {
    id: 'funk-16',
    name: 'Funk in 16esimi',
    description:
      'Charleston in 16esimi continui con cassa sincopata e rullante su 2 e 4. Precisione sulle suddivisioni veloci.',
    bpm: 90,
    patterns: { kick: bar16(0, 6, 10), snare: bar16(4, 12), hihat: bar16(...SIXTEENTHS) }
  }
]

/** Applica un beat all'esercizio corrente, mantenendo battute e count-in scelti dall'utente. */
export function exerciseFromBeat(beat: BeatPreset, current: Exercise): Exercise {
  return {
    ...current,
    bpm: beat.bpm,
    parts: {},
    patterns: structuredClone(beat.patterns)
  }
}
