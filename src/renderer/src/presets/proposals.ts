import type { Exercise, Instrument, Pattern, Subdivision } from '../engine/types'
import { bar16 } from './beats'

export interface ExerciseProposal {
  id: string
  name: string
  /** A cosa serve e su cosa concentrarsi. */
  description: string
  exercise: Exercise
}

const exercise = (
  bpm: number,
  parts: Partial<Record<Instrument, Subdivision>>,
  patterns?: Partial<Record<Instrument, Pattern>>,
  bars = 32
): Exercise => ({
  bpm,
  bars,
  countInBars: 1,
  beatsPerBar: 4,
  parts,
  ...(patterns ? { patterns } : {})
})

/** Esercizi già pronti, dal più semplice al più impegnativo. */
export const EXERCISE_PROPOSALS: ExerciseProposal[] = [
  {
    id: 'cassa-4ti',
    name: 'Cassa in 4ti',
    description:
      'Il più semplice: un colpo di cassa su ogni movimento. Punta ad arrivare esattamente sul click.',
    exercise: exercise(70, { kick: 'quarter' })
  },
  {
    id: 'charleston-8vi',
    name: 'Charleston in 8vi',
    description:
      'Otto colpi regolari per battuta con una mano sola. Base di quasi ogni ritmo rock.',
    exercise: exercise(80, { hihat: 'eighth' })
  },
  {
    id: 'rullante-8vi',
    name: 'Rullante in 8vi',
    description: 'Come il charleston ma sul rullante: controlla di non anticipare o trascinare.',
    exercise: exercise(80, { snare: 'eighth' })
  },
  {
    id: 'cassa-charleston',
    name: 'Cassa e charleston',
    description:
      'Cassa sui quarti e charleston in 8vi: mano e piede insieme, il primo passo verso un ritmo vero.',
    exercise: exercise(90, { kick: 'quarter', hihat: 'eighth' })
  },
  {
    id: 'piatto-sull-uno',
    name: 'Crash sull’uno',
    description:
      'Cassa sui quarti e un colpo di crash a inizio battuta: abitua a segnare l’inizio di ogni giro.',
    exercise: exercise(80, { kick: 'quarter' }, { crash: bar16(0) })
  },
  {
    id: 'giro-tom',
    name: 'Giro dei tom',
    description:
      'Un colpo a movimento: tom 1, tom 2, tom 3 e rullante. Spostare le mani senza perdere il tempo.',
    exercise: exercise(
      80,
      {},
      {
        tom1: bar16(0),
        tom2: bar16(4),
        tom3: bar16(8),
        snare: bar16(12)
      }
    )
  },
  {
    id: 'indipendenza',
    name: 'Cassa in 8vi, rullante su 2 e 4',
    description:
      'La cassa va dritta in 8vi mentre il rullante batte solo sul controtempo: allena l’indipendenza.',
    exercise: exercise(80, { kick: 'eighth' }, { snare: bar16(4, 12) })
  },
  {
    id: 'rullante-terzine',
    name: 'Terzine sul rullante',
    description:
      'Tre colpi per movimento: serve sentire la suddivisione in tre, diversa dalle 8vi.',
    exercise: exercise(70, { snare: 'eighthTriplet' })
  },
  {
    id: 'charleston-16-lenti',
    name: 'Charleston in 16esimi lenti',
    description: 'Sedici colpi per battuta a tempo lento: ogni piccolo scarto si vede bene.',
    exercise: exercise(60, { hihat: 'sixteenth' })
  },
  {
    id: 'rullante-16',
    name: 'Rullante in 16esimi',
    description:
      'Il più impegnativo: quattro colpi per movimento sul rullante. Tieni le mani rilassate.',
    exercise: exercise(70, { snare: 'sixteenth' })
  },
  {
    id: 'resistenza',
    name: 'Resistenza: charleston in 8vi veloci',
    description:
      'Charleston in 8vi a 140 BPM per 64 battute (circa 2 minuti): vedi se la costanza regge fino in fondo.',
    exercise: exercise(140, { hihat: 'eighth' }, undefined, 64)
  }
]
