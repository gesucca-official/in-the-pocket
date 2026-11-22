import type { Instrument } from '../engine/types'

/** Un colore per strumento, riconoscibile nei grafici. */
export const INSTRUMENT_COLORS: Record<Instrument, string> = {
  kick: '#f2a541',
  snare: '#4cc38a',
  hihat: '#5ab0f0',
  tom1: '#c58af9',
  tom2: '#e879a9',
  tom3: '#f2c94c',
  crash: '#ef6461',
  ride: '#9bd34a'
}
