import { render, act, cleanup } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GooeyToast } from '../components/GooeyToast'
import { GooeyToaster } from '../components/GooeyToaster'
import { setGooeyTheme, getGooeyTheme } from '../context'

type Listener = (e: { matches: boolean }) => void

function mockSystemTheme(initialDark: boolean) {
  let dark = initialDark
  const listeners = new Set<Listener>()
  vi.stubGlobal('matchMedia', vi.fn((query: string) => ({
    get matches() { return query.includes('prefers-color-scheme: dark') ? dark : false },
    media: query,
    addEventListener: (_: string, cb: Listener) => { if (query.includes('prefers-color-scheme')) listeners.add(cb) },
    removeEventListener: (_: string, cb: Listener) => listeners.delete(cb),
  })))
  return {
    set(next: boolean) {
      dark = next
      listeners.forEach(cb => cb({ matches: next }))
    },
    listenerCount: () => listeners.size,
  }
}

const wrapperOf = (container: HTMLElement) => container.querySelector('[data-theme]') as HTMLElement

describe('theme', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
    vi.unstubAllGlobals()
    setGooeyTheme('light')
  })

  it('resolves "system" to dark via matchMedia', () => {
    mockSystemTheme(true)
    setGooeyTheme('system')
    expect(getGooeyTheme()).toBe('dark')
    const { container } = render(<GooeyToast title="Hi" type="info" phase="info" />)
    expect(wrapperOf(container).getAttribute('data-theme')).toBe('dark')
  })

  it('resolves "system" to light when the OS is light', () => {
    mockSystemTheme(false)
    setGooeyTheme('system')
    const { container } = render(<GooeyToast title="Hi" type="info" phase="info" />)
    expect(wrapperOf(container).getAttribute('data-theme')).toBe('light')
  })

  it('updates a mounted toast live when the setting changes', () => {
    const { container } = render(<GooeyToast title="Hi" type="info" phase="info" />)
    expect(wrapperOf(container).getAttribute('data-theme')).toBe('light')
    act(() => setGooeyTheme('dark'))
    expect(wrapperOf(container).getAttribute('data-theme')).toBe('dark')
    act(() => setGooeyTheme('light'))
    expect(wrapperOf(container).getAttribute('data-theme')).toBe('light')
  })

  it('follows OS changes while theme is "system" and stops listening afterwards', () => {
    const mq = mockSystemTheme(false)
    setGooeyTheme('system')
    const { container } = render(<GooeyToast title="Hi" type="info" phase="info" />)
    expect(wrapperOf(container).getAttribute('data-theme')).toBe('light')
    act(() => mq.set(true))
    expect(wrapperOf(container).getAttribute('data-theme')).toBe('dark')
    act(() => setGooeyTheme('light'))
    expect(mq.listenerCount()).toBe(0)
  })

  it('GooeyToaster theme prop switches a mounted toast', () => {
    const toast = render(<GooeyToast title="Hi" type="info" phase="info" />)
    const toaster = render(<GooeyToaster theme="light" />)
    expect(wrapperOf(toast.container).getAttribute('data-theme')).toBe('light')
    toaster.rerender(<GooeyToaster theme="dark" />)
    expect(wrapperOf(toast.container).getAttribute('data-theme')).toBe('dark')
  })

  it('fillColor / borderColor props still apply (as public CSS vars on the wrapper)', () => {
    const { container } = render(
      <GooeyToast title="Hi" type="info" phase="info" fillColor="#ff0000" borderColor="#00ff00" borderWidth={3} />
    )
    const w = wrapperOf(container)
    expect(w.style.getPropertyValue('--gooey-fill')).toBe('#ff0000')
    expect(w.style.getPropertyValue('--gooey-border')).toBe('#00ff00')
    expect(w.style.getPropertyValue('--gooey-border-width')).toBe('3px')
  })

  it('does not set public vars when no color props are given', () => {
    const { container } = render(<GooeyToast title="Hi" type="info" phase="info" />)
    expect(wrapperOf(container).style.getPropertyValue('--gooey-fill')).toBe('')
  })
})
