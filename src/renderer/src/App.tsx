import { useState } from 'react'
import { CalibrationPanel } from './calibration/CalibrationPanel'
import { MetronomePanel } from './audio/MetronomePanel'
import { MappingPanel } from './midi/MappingPanel'
import { MidiMonitor } from './midi/MidiMonitor'
import { ExercisePanel } from './ui/ExercisePanel'

type Tab = 'play' | 'tools'

function App(): React.JSX.Element {
  const [tab, setTab] = useState<Tab>('play')
  return (
    <main>
      <header>
        <h1>In The Pocket</h1>
        <p className="muted">Allenati a suonare a tempo</p>
        <nav className="tabs">
          <button className={tab === 'play' ? 'active' : ''} onClick={() => setTab('play')}>
            Esercizio
          </button>
          <button className={tab === 'tools' ? 'active' : ''} onClick={() => setTab('tools')}>
            Strumenti
          </button>
        </nav>
      </header>
      {tab === 'play' ? (
        <ExercisePanel />
      ) : (
        <>
          <CalibrationPanel />
          <MappingPanel />
          <MetronomePanel />
          <MidiMonitor />
        </>
      )}
    </main>
  )
}

export default App
