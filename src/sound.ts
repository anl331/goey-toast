import { getGooeySound, getGooeySoundVolume } from './context'
import type { GooeyToastType } from './types'

// [frequency Hz, start offset s, duration s]
type Note = [number, number, number]

const NOTES: Record<GooeyToastType, Note[]> = {
  success: [[659.25, 0, 0.11], [880, 0.09, 0.16]], // E5 -> A5, rising chime
  error: [[311.13, 0, 0.11], [233.08, 0.1, 0.17]], // Eb4 -> Bb3, low descending
  warning: [[523.25, 0, 0.09], [523.25, 0.13, 0.09]], // C5 x2
  info: [[587.33, 0, 0.14]], // D5
  default: [[440, 0, 0.12]], // A4
}

const MIN_GAP_MS = 80
const ATTACK = 0.008

let _ctx: AudioContext | null = null
let _lastPlay = -Infinity

function getContext(): AudioContext | null {
  if (_ctx) return _ctx
  if (typeof window === 'undefined') return null
  const Ctor: typeof AudioContext | undefined =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  _ctx = new Ctor()
  return _ctx
}

/** @internal Reset shared state — tests only. */
export function _resetSound() {
  _ctx = null
  _lastPlay = -Infinity
}

/**
 * Play the notification tone for a toast type. `override` is the per-toast
 * `sound` option; when undefined the global `GooeyToaster sound` setting applies.
 * Never throws. Skipped while the document is hidden and throttled to one play per 80ms.
 */
export function playGooeySound(type: GooeyToastType, override?: boolean) {
  try {
    if (!(override ?? getGooeySound())) return
    if (typeof document !== 'undefined' && document.hidden) return
    const now = Date.now()
    if (now - _lastPlay < MIN_GAP_MS) return
    const ctx = getContext()
    if (!ctx) return
    _lastPlay = now

    if (ctx.state === 'suspended') ctx.resume().catch(() => {})

    const peak = Math.max(getGooeySoundVolume() * 0.25, 0.0001)
    const t0 = ctx.currentTime
    for (const [freq, offset, dur] of NOTES[type]) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      const start = t0 + offset
      const end = start + dur
      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.linearRampToValueAtTime(peak, start + ATTACK)
      gain.gain.exponentialRampToValueAtTime(0.0001, end)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(start)
      osc.stop(end + 0.02)
    }
  } catch {
    /* audio is best-effort; never break toasts */
  }
}
