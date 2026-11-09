import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, act } from '@testing-library/react'

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
    svg: ({ children, ...props }: any) => <svg {...props}>{children}</svg>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
  animate: () => ({ stop: () => {} }),
}))

vi.mock('sonner', () => ({
  toast: { custom: vi.fn(), dismiss: vi.fn() },
  Toaster: () => <div />,
}))

import { GooeyToaster } from '../components/GooeyToaster'
import { gooeyToast, _resetQueue } from '../gooey-toast'
import { setGooeySound } from '../context'
import { playGooeySound, _resetSound } from '../sound'

const created: number[] = [] // frequencies of created oscillators
let ctxCount = 0
let state = 'running'
const resume = vi.fn(() => Promise.resolve())

class MockAudioContext {
  currentTime = 0
  destination = {}
  get state() { return state }
  resume = resume
  constructor() { ctxCount++ }
  createOscillator() {
    const o = { type: '', frequency: { value: 0 }, connect: vi.fn(), start: vi.fn(), stop: vi.fn() }
    return new Proxy(o, {
      set(t: any, k, v) {
        t[k] = v
        return true
      },
      get(t: any, k) {
        if (k === 'start') return (...a: any[]) => { created.push(t.frequency.value); t.start(...a) }
        return t[k]
      },
    })
  }
  createGain() {
    const p = { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() }
    return { gain: p, connect: vi.fn() }
  }
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(1_000_000)
  created.length = 0
  ctxCount = 0
  state = 'running'
  resume.mockClear()
  ;(window as any).AudioContext = MockAudioContext
  _resetQueue()
  _resetSound()
  setGooeySound(false)
})

afterEach(() => {
  vi.useRealTimers()
  delete (window as any).AudioContext
})

const tick = (ms = 100) => vi.setSystemTime(Date.now() + ms)

describe('toast sounds', () => {
  it('is off by default', () => {
    gooeyToast.success('hi')
    expect(created).toHaveLength(0)
    expect(ctxCount).toBe(0)
  })

  it('plays when enabled globally via GooeyToaster', () => {
    render(<GooeyToaster sound />)
    gooeyToast.success('hi')
    expect(created).toEqual([659.25, 880])
    gooeyToast.dismiss()
  })

  it('plays a distinct tone per type', () => {
    setGooeySound(true)
    const seen = new Set<string>()
    for (const t of ['success', 'error', 'warning', 'info', 'default'] as const) {
      created.length = 0
      tick()
      playGooeySound(t)
      expect(created.length).toBeGreaterThan(0)
      seen.add(created.join(','))
    }
    expect(seen.size).toBe(5)
  })

  it('per-toast sound: true enables when global is off', () => {
    gooeyToast.info('hi', { sound: true })
    expect(created).toHaveLength(1)
  })

  it('per-toast sound: false silences when global is on', () => {
    setGooeySound(true)
    gooeyToast.success('hi', { sound: false })
    expect(created).toHaveLength(0)
  })

  it('promise plays only the resolved type, not loading', async () => {
    setGooeySound(true)
    let resolve!: (v: string) => void
    const p = new Promise<string>((r) => { resolve = r })
    // PromiseToastWrapper is rendered by sonner (mocked); render the factory output manually
    const { toast } = await import('sonner')
    gooeyToast.promise(p, { loading: 'L', success: 'S', error: 'E' })
    expect(created).toHaveLength(0)
    const factory = (toast.custom as any).mock.calls.at(-1)[0]
    render(factory())
    expect(created).toHaveLength(0)
    await act(async () => { resolve('ok'); await p })
    expect(created).toEqual([659.25, 880])
  })

  it('promise error plays error tone and honors sound: false', async () => {
    setGooeySound(true)
    const { toast } = await import('sonner')
    const p = Promise.reject(new Error('x'))
    gooeyToast.promise(p, { loading: 'L', success: 'S', error: 'E' })
    render((toast.custom as any).mock.calls.at(-1)[0]())
    await act(async () => { await p.catch(() => {}) })
    expect(created).toEqual([311.13, 233.08])

    created.length = 0
    tick()
    const p2 = Promise.resolve(1)
    gooeyToast.promise(p2, { loading: 'L', success: 'S', error: 'E', sound: false })
    render((toast.custom as any).mock.calls.at(-1)[0]())
    await act(async () => { await p2 })
    expect(created).toHaveLength(0)
  })

  it('plays on in-place update to a new type', async () => {
    setGooeySound(true)
    const { toast } = await import('sonner')
    const id = gooeyToast.info('hi')
    render((toast.custom as any).mock.calls.at(-1)[0]())
    created.length = 0
    tick()
    act(() => { gooeyToast.update(id, { type: 'success' }) })
    expect(created).toEqual([659.25, 880])
  })

  it('throttles rapid plays', () => {
    setGooeySound(true)
    for (let i = 0; i < 10; i++) playGooeySound('info')
    expect(created).toHaveLength(1)
    tick(81)
    playGooeySound('info')
    expect(created).toHaveLength(2)
  })

  it('reuses one lazily-created AudioContext', () => {
    setGooeySound(true)
    expect(ctxCount).toBe(0)
    playGooeySound('info')
    tick()
    playGooeySound('info')
    expect(ctxCount).toBe(1)
  })

  it('resumes a suspended context and swallows rejection', async () => {
    setGooeySound(true)
    state = 'suspended'
    resume.mockImplementationOnce(() => Promise.reject(new Error('blocked')))
    expect(() => playGooeySound('success')).not.toThrow()
    expect(resume).toHaveBeenCalled()
    await Promise.resolve()
  })

  it('does not throw when AudioContext is missing', () => {
    delete (window as any).AudioContext
    setGooeySound(true)
    expect(() => playGooeySound('success')).not.toThrow()
    expect(() => gooeyToast.error('x')).not.toThrow()
  })

  it('does not throw when AudioContext constructor throws', () => {
    ;(window as any).AudioContext = function () { throw new Error('nope') }
    setGooeySound(true)
    expect(() => playGooeySound('success')).not.toThrow()
  })
})
