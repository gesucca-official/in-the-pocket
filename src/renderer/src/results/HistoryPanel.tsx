import { useState } from 'react'
import { clearHistory, deleteRecord, loadHistory } from '../storage/historyStorage'
import { ResultsView } from './ResultsView'
import type { SessionRecord } from './record'

const W = 1000
const H = 160
const PAD = { left: 44, right: 16, top: 14, bottom: 22 }

/** Precisione delle ultime prove, dalla più vecchia alla più recente. */
function TrendChart({ records }: { records: SessionRecord[] }): React.JSX.Element {
  const list = [...records].slice(0, 30).reverse()
  const plotW = W - PAD.left - PAD.right
  const plotH = H - PAD.top - PAD.bottom
  const x = (i: number): number =>
    PAD.left + (list.length === 1 ? plotW / 2 : (i / (list.length - 1)) * plotW)
  const y = (acc: number): number => PAD.top + (1 - acc / 100) * plotH
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Precisione nel tempo" className="chart">
      {[0, 50, 100].map((v) => (
        <g key={v}>
          <line
            x1={PAD.left}
            x2={W - PAD.right}
            y1={y(v)}
            y2={y(v)}
            stroke="#3a3b44"
            strokeDasharray="3 4"
          />
          <text x={PAD.left - 8} y={y(v) + 4} textAnchor="end" className="chart-label">
            {v}%
          </text>
        </g>
      ))}
      <polyline
        points={list.map((r, i) => `${x(i)},${y(r.summary.total.accuracy)}`).join(' ')}
        fill="none"
        stroke="#f2a541"
        strokeWidth={2}
      />
      {list.map((r, i) => (
        <circle key={r.id} cx={x(i)} cy={y(r.summary.total.accuracy)} r={4} fill="#f2a541" />
      ))}
    </svg>
  )
}

/** Storico delle prove: andamento della precisione e dettaglio di ogni prova. */
export function HistoryPanel(): React.JSX.Element {
  const [records, setRecords] = useState<SessionRecord[]>(() => loadHistory())
  const [openId, setOpenId] = useState<string | null>(null)
  const open = records.find((r) => r.id === openId)

  if (open) {
    return (
      <section className="panel">
        <h2>Storico</h2>
        <p>
          <button onClick={() => setOpenId(null)}>← Torna all’elenco</button>{' '}
          <button
            onClick={() => {
              setRecords(deleteRecord(open.id))
              setOpenId(null)
            }}
          >
            Elimina questa prova
          </button>
        </p>
        <ResultsView record={open} />
      </section>
    )
  }

  return (
    <section className="panel">
      <h2>Storico</h2>
      {records.length === 0 ? (
        <p className="muted">Nessuna prova ancora: finisci un esercizio e comparirà qui.</p>
      ) : (
        <>
          <p className="muted">Precisione delle ultime {Math.min(records.length, 30)} prove</p>
          <TrendChart records={records} />
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Esercizio</th>
                <th>BPM</th>
                <th>Battute</th>
                <th>Precisione</th>
                <th>Scarto medio</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id} className="clickable" onClick={() => setOpenId(r.id)}>
                  <td>
                    {new Date(r.dateIso).toLocaleString('it-IT', {
                      dateStyle: 'short',
                      timeStyle: 'short'
                    })}
                  </td>
                  <td>{r.label}</td>
                  <td>{r.exercise.bpm}</td>
                  <td>{r.exercise.bars}</td>
                  <td>{r.summary.total.accuracy.toFixed(0)}%</td>
                  <td>
                    {r.summary.total.meanOffsetMs > 0 ? '+' : ''}
                    {r.summary.total.meanOffsetMs.toFixed(1)} ms
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p>
            <button
              onClick={() => {
                if (window.confirm('Cancellare tutto lo storico? Non si può annullare.')) {
                  clearHistory()
                  setRecords([])
                }
              }}
            >
              Svuota lo storico
            </button>
          </p>
        </>
      )}
    </section>
  )
}
