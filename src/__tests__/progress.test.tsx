import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GooeyToast } from '../components/GooeyToast'

describe('progress bar', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('mounts only once the body expands, with duration matching the dismiss window', () => {
    render(
      <GooeyToast
        title="Saved"
        type="success"
        phase="success"
        description="Your file was saved."
        showProgress
        timing={{ displayDuration: 5000 }}
      />
    )
    // Pill phase: no progress bar yet, so the shrink can't start early
    expect(screen.queryByTestId('gooey-progress')).toBeNull()

    act(() => { vi.advanceTimersByTime(400) })

    const bar = screen.getByTestId('gooey-progress').firstElementChild as HTMLElement
    // 5000 display - 330 expand delay - 900 collapse = 3770
    expect(bar.style.getPropertyValue('--gooey-progress-duration')).toBe('3770ms')
  })

  it('shows by default and can be turned off per toast', () => {
    const { unmount } = render(
      <GooeyToast title="Saved" type="success" phase="success" description="Body" />
    )
    act(() => { vi.advanceTimersByTime(400) })
    expect(screen.getByTestId('gooey-progress')).toBeInTheDocument()
    unmount()

    render(<GooeyToast title="Saved" type="success" phase="success" description="Body" showProgress={false} />)
    act(() => { vi.advanceTimersByTime(400) })
    expect(screen.queryByTestId('gooey-progress')).toBeNull()
  })

  it('never renders for a compact toast without a body', () => {
    render(<GooeyToast title="Done" type="success" phase="success" showProgress />)
    act(() => { vi.advanceTimersByTime(1000) })
    expect(screen.queryByTestId('gooey-progress')).toBeNull()
  })
})
