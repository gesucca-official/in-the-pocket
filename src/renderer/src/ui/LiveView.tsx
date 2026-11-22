import { useEffect, useMemo, useRef } from 'react'
import { beatMs } from '../engine/grid'
import { RATING_THRESHOLDS_MS } from '../engine/rules'
import type { ExerciseSession } from '../engine/session'
import type { Instrument, MatchEvent, Rating } from '../engine/types'
import { INSTRUMENT_LABELS } from '../midi/padMapping'

const SPAN_MS = 4000 // finestra visibile
const NOW_X = 0.35 // posizione del "adesso" (frazione della larghezza)
const LANE_H = 46
const LABEL_W = 80
const METER_H = 84
const RECENT = 8

const COLORS: Record<Rating | 'miss' | 'extra', string> = {
  perfect: '#4cc38a',
  good: '#9bd34a',
  ok: '#f2c94c',
  off: '#f2994a',
  miss: '#ef6461',
  extra: '#8d8c86'
}

function ratingOf(e: MatchEvent): Rating | 'miss' | 'extra' {
  return e.type === 'hit' ? e.rating : e.type
}

interface Props {
  session: ExerciseSession
  onOver: () => void
}

/** Vista dal vivo: una corsia per strumento con colpi attesi e reali, e indicatore anticipo/ritardo. */
export function LiveView({ session, onOver }: Props): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const lanes: Instrument[] = useMemo(() => session.activeInstruments, [session])
  const height = lanes.length * LANE_H + METER_H

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    let raf = 0
    let over = false
    let width = 0
    let px = 0
    let nowX = 0

    // La larghezza si rimisura a ogni frame: la finestra può cambiare dimensione (o non averne
    // ancora, se era nascosta al montaggio) e il canvas deve seguirla.
    const resize = (): boolean => {
      const w = canvas.clientWidth
      if (w === 0) return false
      if (w !== width) {
        const dpr = window.devicePixelRatio || 1
        width = w
        canvas.width = w * dpr
        canvas.height = height * dpr
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        const lanesW = w - LABEL_W
        px = lanesW / SPAN_MS
        nowX = LABEL_W + lanesW * NOW_X
      }
      return true
    }

    const draw = (): void => {
      const now = performance.now()
      session.flush(now)
      if (!over && session.isOver(now)) {
        over = true
        onOver()
        return
      }
      if (!resize()) {
        raf = requestAnimationFrame(draw)
        return
      }
      const xOf = (t: number): number => nowX + (t - now) * px
      const t0 = now - NOW_X * SPAN_MS
      const t1 = now + (1 - NOW_X) * SPAN_MS

      ctx.clearRect(0, 0, width, height)

      // linee dei movimenti (anche del count-in); più marcate a inizio battuta
      const { bpm, beatsPerBar } = session.exercise
      if (session.started) {
        const beat = beatMs(bpm)
        const first = Math.ceil((t0 - session.startMs) / beat)
        for (let k = first; session.startMs + k * beat <= t1; k++) {
          const x = xOf(session.startMs + k * beat)
          ctx.strokeStyle = k % beatsPerBar === 0 ? '#4a4b55' : '#2c2d34'
          ctx.lineWidth = k % beatsPerBar === 0 ? 2 : 1
          ctx.beginPath()
          ctx.moveTo(x, 0)
          ctx.lineTo(x, lanes.length * LANE_H)
          ctx.stroke()
        }
      }

      // corsie
      lanes.forEach((inst, i) => {
        const y = i * LANE_H + LANE_H / 2
        ctx.fillStyle = '#8d8c86'
        ctx.font = '13px sans-serif'
        ctx.textBaseline = 'middle'
        ctx.fillText(INSTRUMENT_LABELS[inst], 8, y)
        ctx.strokeStyle = '#2c2d34'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(LABEL_W, (i + 1) * LANE_H)
        ctx.lineTo(width, (i + 1) * LANE_H)
        ctx.stroke()
      })

      const laneY = (inst: Instrument): number => lanes.indexOf(inst) * LANE_H + LANE_H / 2

      // colpi attesi (cerchi vuoti)
      ctx.lineWidth = 2
      ctx.strokeStyle = '#ecebe6'
      for (const h of session.grid) {
        if (h.timeMs < t0 || h.timeMs > t1) continue
        ctx.beginPath()
        ctx.arc(xOf(h.timeMs), laneY(h.instrument), 9, 0, Math.PI * 2)
        ctx.stroke()
      }

      // esiti: colpi reali colorati per precisione, mancati ed extra
      for (const e of session.events) {
        const color = COLORS[ratingOf(e)]
        const t = e.type === 'miss' ? e.expected.timeMs : e.played.timeMs - session.latencyOffsetMs
        if (t < t0 || t > t1) continue
        const inst = e.type === 'miss' ? e.expected.instrument : e.played.instrument
        const x = xOf(t)
        const y = laneY(inst)
        ctx.fillStyle = color
        ctx.strokeStyle = color
        if (e.type === 'miss') {
          ctx.lineWidth = 3
          ctx.beginPath()
          ctx.arc(x, y, 9, 0, Math.PI * 2)
          ctx.stroke()
        } else if (e.type === 'extra') {
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.moveTo(x - 6, y - 6)
          ctx.lineTo(x + 6, y + 6)
          ctx.moveTo(x + 6, y - 6)
          ctx.lineTo(x - 6, y + 6)
          ctx.stroke()
        } else {
          ctx.beginPath()
          ctx.arc(x, y, 6, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // linea dell'adesso
      ctx.strokeStyle = '#f2a541'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(nowX, 0)
      ctx.lineTo(nowX, lanes.length * LANE_H)
      ctx.stroke()

      drawMeter(ctx, session.events, width, lanes.length * LANE_H)

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [session, lanes, height, onOver])

  return <canvas ref={canvasRef} style={{ width: '100%', height }} />
}

/** Indicatore anticipo ← → ritardo, con l'ultimo scarto e la media degli ultimi colpi. */
function drawMeter(
  ctx: CanvasRenderingContext2D,
  events: MatchEvent[],
  width: number,
  top: number
): void {
  const hits = events.filter((e) => e.type === 'hit')
  const last = hits.at(-1)
  const recent = hits.slice(-RECENT)
  const mean = recent.length ? recent.reduce((s, e) => s + e.offsetMs, 0) / recent.length : 0

  const range = 60 // ms mostrati per lato
  const cx = width / 2
  const half = width * 0.35
  const y = top + 34
  const xOf = (ms: number): number => cx + (Math.max(-range, Math.min(range, ms)) / range) * half

  ctx.fillStyle = '#2c2d34'
  ctx.fillRect(cx - half, y - 6, half * 2, 12)
  for (const th of Object.values(RATING_THRESHOLDS_MS)) {
    ctx.fillStyle = '#3a3b44'
    ctx.fillRect(xOf(-th), y - 6, xOf(th) - xOf(-th), 12)
  }
  ctx.fillStyle = '#4cc38a'
  ctx.fillRect(
    xOf(-RATING_THRESHOLDS_MS.perfect),
    y - 6,
    xOf(RATING_THRESHOLDS_MS.perfect) - xOf(-RATING_THRESHOLDS_MS.perfect),
    12
  )

  ctx.fillStyle = '#8d8c86'
  ctx.font = '12px sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('← anticipo', cx - half, y + 26)
  ctx.textAlign = 'right'
  ctx.fillText('ritardo →', cx + half, y + 26)
  ctx.textAlign = 'center'
  ctx.fillText('0', cx, y + 26)

  if (recent.length) {
    ctx.fillStyle = '#ecebe6'
    ctx.fillRect(xOf(mean) - 2, y - 12, 4, 24) // media recente
  }
  if (last) {
    ctx.fillStyle = COLORS[last.rating]
    ctx.beginPath()
    ctx.arc(xOf(last.offsetMs), y, 9, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#ecebe6'
    ctx.font = '16px sans-serif'
    const sign = last.offsetMs > 0 ? '+' : ''
    const dir = Math.abs(last.offsetMs) < 1 ? '' : last.offsetMs < 0 ? ' anticipo' : ' ritardo'
    ctx.fillText(`${sign}${last.offsetMs.toFixed(0)} ms${dir}`, cx, y - 22)
  }
  ctx.textAlign = 'left'
}
