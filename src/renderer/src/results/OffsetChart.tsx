import { beatMs } from '../engine/grid'
import { RATING_THRESHOLDS_MS } from '../engine/rules'
import { INSTRUMENTS, INSTRUMENT_LABELS } from '../midi/padMapping'
import { INSTRUMENT_COLORS } from './colors'
import { rollingMean } from './analysis'
import type { SessionRecord } from './record'

const W = 1000
const H = 280
const PAD = { left: 56, right: 16, top: 20, bottom: 30 }

/** Scala verticale: ±60 ms, oppure ±100 (la finestra massima) se serve. */
function rangeFor(maxAbs: number): number {
  return maxAbs <= 60 ? 60 : 100
}

/** Scarto di ogni colpo nel tempo: sopra lo zero = in ritardo, sotto = in anticipo. */
export function OffsetChart({ record }: { record: SessionRecord }): React.JSX.Element {
  const { exercise, events } = record
  const totalMs = exercise.bars * exercise.beatsPerBar * beatMs(exercise.bpm)
  const hits = events.filter((e) => e.offsetMs !== null)
  const misses = events.filter((e) => e.offsetMs === null)
  const range = rangeFor(Math.max(0, ...hits.map((e) => Math.abs(e.offsetMs as number))))

  const plotW = W - PAD.left - PAD.right
  const plotH = H - PAD.top - PAD.bottom
  const x = (t: number): number => PAD.left + (t / totalMs) * plotW
  const y = (o: number): number => PAD.top + (1 - (o + range) / (2 * range)) * plotH

  const barStep = Math.max(1, Math.ceil(exercise.bars / 16))
  const barTicks = Array.from({ length: Math.ceil(exercise.bars / barStep) }, (_, i) => i * barStep)
  const levels = Object.values(RATING_THRESHOLDS_MS).filter((l) => l <= range)
  const used = INSTRUMENTS.filter((i) => events.some((e) => e.instrument === i))
  const rolling = rollingMean(events)

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Scarto di ogni colpo nel tempo"
        className="chart"
      >
        {/* fasce di precisione: perfetto, buono, ok */}
        {[...levels].reverse().map((l, i) => (
          <rect
            key={l}
            x={PAD.left}
            y={y(l)}
            width={plotW}
            height={y(-l) - y(l)}
            fill={i === levels.length - 1 ? '#4cc38a' : '#ffffff'}
            opacity={i === levels.length - 1 ? 0.12 : 0.04}
          />
        ))}
        {[...levels.flatMap((l) => [l, -l]), 0].map((l) => (
          <g key={l}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={y(l)}
              y2={y(l)}
              stroke={l === 0 ? '#8d8c86' : '#3a3b44'}
              strokeWidth={l === 0 ? 1.5 : 1}
              strokeDasharray={l === 0 ? undefined : '3 4'}
            />
            <text x={PAD.left - 8} y={y(l) + 4} textAnchor="end" className="chart-label">
              {l > 0 ? `+${l}` : l}
            </text>
          </g>
        ))}
        <text x={PAD.left + 6} y={PAD.top + 12} className="chart-label">
          ↑ ritardo
        </text>
        <text x={PAD.left + 6} y={H - PAD.bottom - 6} className="chart-label">
          ↓ anticipo
        </text>

        {barTicks.map((b) => (
          <g key={b}>
            <line
              x1={x(b * exercise.beatsPerBar * beatMs(exercise.bpm))}
              x2={x(b * exercise.beatsPerBar * beatMs(exercise.bpm))}
              y1={PAD.top}
              y2={H - PAD.bottom}
              stroke="#2c2d34"
            />
            <text
              x={x(b * exercise.beatsPerBar * beatMs(exercise.bpm))}
              y={H - 8}
              textAnchor="middle"
              className="chart-label"
            >
              {b + 1}
            </text>
          </g>
        ))}
        <text x={W - PAD.right} y={H - 8} textAnchor="end" className="chart-label">
          battuta
        </text>

        {hits.map((e, i) => (
          <circle
            key={i}
            cx={x(e.timeMs)}
            cy={y(Math.max(-range, Math.min(range, e.offsetMs as number)))}
            r={3.5}
            fill={INSTRUMENT_COLORS[e.instrument]}
            opacity={0.85}
          />
        ))}

        {rolling.length > 1 && (
          <polyline
            points={rolling.map((r) => `${x(r.timeMs)},${y(r.offsetMs)}`).join(' ')}
            fill="none"
            stroke="#ecebe6"
            strokeWidth={2}
          />
        )}

        {/* colpi mancati: tacca rossa sull'asse */}
        {misses.map((e, i) => (
          <line
            key={i}
            x1={x(e.timeMs)}
            x2={x(e.timeMs)}
            y1={H - PAD.bottom - 10}
            y2={H - PAD.bottom}
            stroke="#ef6461"
            strokeWidth={2}
          />
        ))}
      </svg>
      <p className="chart-legend">
        {used.map((i) => (
          <span key={i}>
            <i style={{ background: INSTRUMENT_COLORS[i] }} /> {INSTRUMENT_LABELS[i]}
          </span>
        ))}
        <span>
          <i className="line" /> media degli ultimi 8 colpi
        </span>
        {misses.length > 0 && (
          <span>
            <i style={{ background: '#ef6461' }} /> mancati
          </span>
        )}
      </p>
    </div>
  )
}
