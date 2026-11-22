import { useEffect, useState } from 'react'

interface MidiLogEntry {
  key: number
  input: string
  kind: 'note' | 'cc'
  channel: number
  number: number
  value: number
  timeStamp: number
}

const MAX_ENTRIES = 15

interface Seen {
  kind: 'note' | 'cc'
  number: number
  count: number
  lastValue: number
}

/** Fase 1: mostra in tempo reale i messaggi MIDI in arrivo da tutti gli ingressi. */
export function MidiMonitor(): React.JSX.Element {
  const [inputs, setInputs] = useState<string[]>([])
  const [log, setLog] = useState<MidiLogEntry[]>([])
  const [seen, setSeen] = useState<Record<string, Seen>>({})
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let access: MIDIAccess | null = null
    let cancelled = false
    let counter = 0

    const onMessage = (event: MIDIMessageEvent): void => {
      const data = event.data
      if (!data || data.length < 3) return
      const type = data[0] & 0xf0
      const isNoteOn = type === 0x90 && data[2] > 0
      const isCc = type === 0xb0
      if (!isNoteOn && !isCc) return

      const entry: MidiLogEntry = {
        key: counter++,
        input: (event.target as MIDIInput).name ?? '?',
        kind: isNoteOn ? 'note' : 'cc',
        channel: (data[0] & 0x0f) + 1,
        number: data[1],
        value: data[2],
        timeStamp: event.timeStamp
      }
      setLog((prev) => [entry, ...prev].slice(0, MAX_ENTRIES))
      const id = `${entry.kind}-${entry.number}`
      setSeen((prev) => ({
        ...prev,
        [id]: {
          kind: entry.kind,
          number: entry.number,
          count: (prev[id]?.count ?? 0) + 1,
          lastValue: entry.value
        }
      }))
    }

    const bindInputs = (): void => {
      if (!access) return
      const names: string[] = []
      access.inputs.forEach((input) => {
        input.onmidimessage = onMessage
        names.push(input.name ?? input.id)
      })
      setInputs(names)
    }

    navigator
      .requestMIDIAccess()
      .then((a) => {
        if (cancelled) return
        access = a
        access.onstatechange = bindInputs
        bindInputs()
      })
      .catch((e: unknown) => setError(String(e)))

    return () => {
      cancelled = true
      access?.inputs.forEach((input) => (input.onmidimessage = null))
      if (access) access.onstatechange = null
    }
  }, [])

  return (
    <section className="panel">
      <h2>Monitor MIDI</h2>
      {error && <p className="error">Accesso MIDI non riuscito: {error}</p>}
      <p className="muted">
        Ingressi: {inputs.length ? inputs.join(', ') : 'nessun dispositivo MIDI collegato'}
      </p>
      <button
        onClick={() => {
          setLog([])
          setSeen({})
        }}
      >
        Svuota
      </button>
      <h3>Note e CC visti (uno per riga)</h3>
      <table>
        <thead>
          <tr>
            <th>Tipo</th>
            <th>Nota / CC</th>
            <th>Colpi</th>
            <th>Ultima velocity / valore</th>
          </tr>
        </thead>
        <tbody>
          {Object.values(seen)
            .sort((a, b) => a.kind.localeCompare(b.kind) || a.number - b.number)
            .map((r) => (
              <tr key={`${r.kind}-${r.number}`}>
                <td>{r.kind === 'note' ? 'Note On' : 'CC'}</td>
                <td>{r.number}</td>
                <td>{r.count}</td>
                <td>{r.lastValue}</td>
              </tr>
            ))}
        </tbody>
      </table>
      <h3>Ultimi {MAX_ENTRIES} messaggi</h3>
      <table>
        <thead>
          <tr>
            <th>Tipo</th>
            <th>Nota / CC</th>
            <th>Velocity / valore</th>
            <th>Canale</th>
            <th>Timestamp (ms)</th>
            <th>Ingresso</th>
          </tr>
        </thead>
        <tbody>
          {log.map((e) => (
            <tr key={e.key}>
              <td>{e.kind === 'note' ? 'Note On' : 'CC'}</td>
              <td>{e.number}</td>
              <td>{e.value}</td>
              <td>{e.channel}</td>
              <td>{e.timeStamp.toFixed(1)}</td>
              <td>{e.input}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!log.length && <p className="muted">Colpisci un pad per vederlo comparire qui.</p>}
    </section>
  )
}
