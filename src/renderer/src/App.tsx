import { MidiMonitor } from './midi/MidiMonitor'

function App(): React.JSX.Element {
  return (
    <main>
      <header>
        <h1>In The Pocket</h1>
        <p className="muted">Allenati a suonare a tempo</p>
      </header>
      <MidiMonitor />
    </main>
  )
}

export default App
