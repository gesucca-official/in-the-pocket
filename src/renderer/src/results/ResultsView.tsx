import type { Stats } from '../engine/scorer'
import type { Instrument } from '../engine/types'
import { INSTRUMENTS, INSTRUMENT_LABELS } from '../midi/padMapping'
import { driftMs, driftText, tendencyText } from './analysis'
import { OffsetChart } from './OffsetChart'
import type { SessionRecord, StoredEvent } from './record'

function StatsRow({ label, s }: { label: string; s: Stats }): React.JSX.Element {
  const sign = s.meanOffsetMs > 0 ? '+' : ''
  return (
    <tr>
      <td>{label}</td>
      <td>{s.accuracy.toFixed(0)}%</td>
      <td>
        {s.hits}/{s.expected}
      </td>
      <td>{s.misses}</td>
      <td>{s.extras}</td>
      <td>
        {sign}
        {s.meanOffsetMs.toFixed(1)} ms
      </td>
      <td>{s.stdDevMs.toFixed(1)} ms</td>
    </tr>
  )
}

const forInstrument = (events: StoredEvent[], inst: Instrument): StoredEvent[] =>
  events.filter((e) => e.instrument === inst)

/** Risultati di una prova: punteggio, lettura per strumento, tabella e grafico dello scarto. */
export function ResultsView({ record }: { record: SessionRecord }): React.JSX.Element {
  const { summary, events, exercise } = record
  const total = summary.total
  const instruments = INSTRUMENTS.filter((i) => summary.byInstrument[i])
  const date = new Date(record.dateIso).toLocaleString('it-IT', {
    dateStyle: 'medium',
    timeStyle: 'short'
  })

  return (
    <div className="results">
      <div className="score">
        <div className="score-value">{total.accuracy.toFixed(0)}%</div>
        <div>
          <strong>{record.label}</strong>
          <div className="muted">
            {exercise.bpm} BPM · {exercise.bars} battute · {date}
            {record.latencyMs ? ` · latenza ${record.latencyMs.toFixed(0)} ms` : ' · non calibrata'}
          </div>
          <div className="muted">
            {total.hits} colpiti su {total.expected} · {total.misses} mancati · {total.extras} in
            più
          </div>
        </div>
      </div>

      <ul className="insights">
        <li>
          <strong>In totale:</strong> {tendencyText(total)}
        </li>
        {driftText(driftMs(events)) && <li>{driftText(driftMs(events))}</li>}
        {instruments.length > 1 &&
          instruments.map((inst) => {
            const s = summary.byInstrument[inst] as Stats
            return (
              <li key={inst}>
                <strong>{INSTRUMENT_LABELS[inst]}:</strong> {tendencyText(s)}
                {driftText(driftMs(forInstrument(events, inst))) &&
                  ` ${driftText(driftMs(forInstrument(events, inst)))}`}
              </li>
            )
          })}
      </ul>

      <OffsetChart record={record} />

      <table>
        <thead>
          <tr>
            <th />
            <th>Precisione</th>
            <th>Colpiti</th>
            <th>Mancati</th>
            <th>Colpi in più</th>
            <th>Scarto medio</th>
            <th>Costanza (deviazione)</th>
          </tr>
        </thead>
        <tbody>
          <StatsRow label="Totale" s={total} />
          {instruments.map((inst) => (
            <StatsRow
              key={inst}
              label={INSTRUMENT_LABELS[inst]}
              s={summary.byInstrument[inst] as Stats}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}
