import { useState } from 'react'
import type { Exercise } from '../engine/types'
import { BEAT_PRESETS, exerciseFromBeat } from '../presets/beats'
import { EXERCISE_PROPOSALS } from '../presets/proposals'
import { deletePreset, loadPresets, savePreset, type UserPreset } from '../storage/presetStorage'

interface Props {
  exercise: Exercise
  onChange: (exercise: Exercise) => void
}

/** Esercizi proposti, ritmi da studiare (groove classici) e preset personali. */
export function PresetBar({ exercise, onChange }: Props): React.JSX.Element {
  const [proposalId, setProposalId] = useState('')
  const [beatId, setBeatId] = useState('')
  const [presets, setPresets] = useState<UserPreset[]>(() => loadPresets())
  const [presetId, setPresetId] = useState('')
  const [name, setName] = useState('')

  const proposal = EXERCISE_PROPOSALS.find((p) => p.id === proposalId)
  const beat = BEAT_PRESETS.find((b) => b.id === beatId)
  const preset = presets.find((p) => p.id === presetId)

  return (
    <div className="presets">
      <div className="row">
        <label>
          Esercizi proposti
          <select
            value={proposalId}
            onChange={(e) => {
              setProposalId(e.target.value)
              setBeatId('')
              const p = EXERCISE_PROPOSALS.find((x) => x.id === e.target.value)
              if (p) onChange(structuredClone(p.exercise))
            }}
          >
            <option value="">— scegli un esercizio —</option>
            {EXERCISE_PROPOSALS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.exercise.bpm} BPM)
              </option>
            ))}
          </select>
        </label>
      </div>
      {proposal && <p className="muted">{proposal.description}</p>}

      <div className="row">
        <label>
          Ritmi da studiare
          <select
            value={beatId}
            onChange={(e) => {
              setBeatId(e.target.value)
              setProposalId('')
              const b = BEAT_PRESETS.find((x) => x.id === e.target.value)
              if (b) onChange(exerciseFromBeat(b, exercise))
            }}
          >
            <option value="">— scegli un ritmo —</option>
            {BEAT_PRESETS.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.bpm} BPM)
              </option>
            ))}
          </select>
        </label>
      </div>
      {beat && <p className="muted">{beat.description}</p>}

      <div className="row">
        <label>
          I miei preset
          <select value={presetId} onChange={(e) => setPresetId(e.target.value)}>
            <option value="">{presets.length ? '— scegli —' : 'nessuno salvato'}</option>
            {presets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <button
          disabled={!preset}
          onClick={() => {
            if (!preset) return
            setBeatId('')
            setProposalId('')
            onChange(structuredClone(preset.exercise))
          }}
        >
          Carica
        </button>
        <button
          disabled={!preset}
          onClick={() => {
            if (!preset) return
            setPresets(deletePreset(preset.id))
            setPresetId('')
          }}
        >
          Elimina
        </button>
        <input
          type="text"
          placeholder="Nome del preset"
          value={name}
          maxLength={40}
          onChange={(e) => setName(e.target.value)}
        />
        <button
          disabled={!name.trim()}
          onClick={() => {
            const list = savePreset(name, exercise)
            setPresets(list)
            setPresetId(list.find((p) => p.name === name.trim())?.id ?? '')
            setName('')
          }}
        >
          Salva esercizio
        </button>
      </div>
    </div>
  )
}
