import { useEffect, useRef } from 'react'

export interface NoteOn {
  note: number
  velocity: number
  channel: number
  /** Istante del colpo, sull'orologio performance.now(). */
  timeMs: number
}

/** Chiama `handler` a ogni nota suonata, cioè Note On con velocity > 0, di qualsiasi ingresso MIDI. */
export function useMidiNoteOn(handler: (hit: NoteOn) => void): void {
  const handlerRef = useRef(handler)
  useEffect(() => {
    handlerRef.current = handler
  })

  useEffect(() => {
    let access: MIDIAccess | null = null
    let cancelled = false

    const onMessage = (event: MIDIMessageEvent): void => {
      const data = event.data
      if (!data || data.length < 3) return
      if ((data[0] & 0xf0) !== 0x90 || data[2] === 0) return
      handlerRef.current({
        note: data[1],
        velocity: data[2],
        channel: (data[0] & 0x0f) + 1,
        timeMs: event.timeStamp
      })
    }
    const bind = (): void => access?.inputs.forEach((i) => (i.onmidimessage = onMessage))

    navigator
      .requestMIDIAccess()
      .then((a) => {
        if (cancelled) return
        access = a
        access.onstatechange = bind
        bind()
      })
      .catch(() => undefined)

    return () => {
      cancelled = true
      access?.inputs.forEach((i) => (i.onmidimessage = null))
      if (access) access.onstatechange = null
    }
  }, [])
}
