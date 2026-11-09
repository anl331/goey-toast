import { getGooeySound, getGooeySoundVolume } from './context'
import type { GooeyToastType, GooeySoundOption } from './types'

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
// Decoded buffers per URL; a failed load is cached as null so it isn't refetched.
const _buffers = new Map<string, Promise<AudioBuffer | null>>()

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
  _buffers.clear()
  _bytes.clear()
}

// Raw file bytes per URL. Fetching needs no AudioContext, so files can be warmed
// before any user gesture; decoding happens lazily once a context exists.
const _bytes = new Map<string, Promise<ArrayBuffer | null>>()

function fetchBytes(url: string): Promise<ArrayBuffer | null> {
  let p = _bytes.get(url)
  if (!p) {
    p = fetch(url)
      .then((r) => (r.ok ? r.arrayBuffer() : null))
      .catch(() => null)
    _bytes.set(url, p)
  }
  return p
}

function loadBuffer(ctx: AudioContext, url: string): Promise<AudioBuffer | null> {
  let p = _buffers.get(url)
  if (!p) {
    p = fetchBytes(url)
      .then((data) => (data ? ctx.decodeAudioData(data) : null))
      .catch(() => null)
    _buffers.set(url, p)
  }
  return p
}

/**
 * Fetch sound files ahead of time (and decode them if the AudioContext already exists)
 * so the first play is instant. Never creates an AudioContext. Never throws.
 */
export function preloadGooeySounds(urls: string[]) {
  try {
    urls.forEach((u) => void (_ctx ? loadBuffer(_ctx, u) : fetchBytes(u)))
  } catch { /* best-effort */ }
}

/** @internal Warm every URL referenced by a `sound` setting. */
export function warmGooeySound(setting: GooeySoundOption | undefined) {
  if (typeof setting === 'string') preloadGooeySounds([setting])
  else if (setting && typeof setting === 'object') preloadGooeySounds(Object.values(setting).filter(Boolean) as string[])
}

function playTone(ctx: AudioContext, type: GooeyToastType, volume: number) {
  const peak = Math.max(volume * 0.25, 0.0001)
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
}

function playBuffer(ctx: AudioContext, buffer: AudioBuffer, volume: number) {
  const src = ctx.createBufferSource()
  const gain = ctx.createGain()
  src.buffer = buffer
  gain.gain.value = volume
  src.connect(gain)
  gain.connect(ctx.destination)
  src.start()
}

/**
 * Play the notification sound for a toast type. `override` is the per-toast
 * `sound` option; when undefined the global `GooeyToaster sound` setting applies.
 * A URL (or per-type URL map) plays that file; if it can't be loaded or decoded
 * the built-in tone plays instead. Never throws. Skipped while the document is
 * hidden and throttled to one play per 80ms.
 */
export function playGooeySound(type: GooeyToastType, override?: GooeySoundOption) {
  try {
    const setting = override ?? getGooeySound()
    if (!setting) return
    if (typeof document !== 'undefined' && document.hidden) return
    const now = Date.now()
    if (now - _lastPlay < MIN_GAP_MS) return
    const ctx = getContext()
    if (!ctx) return
    _lastPlay = now

    if (ctx.state === 'suspended') ctx.resume().catch(() => {})

    const volume = getGooeySoundVolume()
    const url = typeof setting === 'string' ? setting : typeof setting === 'object' ? (setting[type] ?? setting.default) : undefined
    if (!url) return playTone(ctx, type, volume)

    loadBuffer(ctx, url).then((buffer) => {
      try {
        if (buffer) playBuffer(ctx, buffer, volume)
        else playTone(ctx, type, volume)
      } catch { /* best-effort */ }
    })
  } catch {
    /* audio is best-effort; never break toasts */
  }
}
