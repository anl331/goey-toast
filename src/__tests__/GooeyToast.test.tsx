import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GooeyToast } from '../components/GooeyToast'
import { setGooeyTheme, setGooeyDir, setGooeyPosition } from '../context'

// Helper to mock matchMedia for reduced motion tests
function mockReducedMotion(enabled: boolean) {
  vi.stubGlobal('matchMedia', vi.fn((query: string) => ({
    matches: enabled,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })))
}

describe('GooeyToast', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    setGooeyTheme('light')
  })

  it('renders title text', () => {
    render(<GooeyToast title="Loading..." type="success" phase="loading" />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders in compact pill shape during loading phase', () => {
    const { container } = render(
      <GooeyToast title="Loading..." type="success" phase="loading" />
    )
    const contentEl = container.querySelector('[class*="content"]') as HTMLElement
    expect(contentEl.className).toContain('Compact')
    expect(contentEl.className).not.toContain('Expanded')
  })

  it('renders in compact pill shape for result without description', () => {
    const { container } = render(
      <GooeyToast title="Done!" type="success" phase="success" />
    )
    const contentEl = container.querySelector('[class*="content"]') as HTMLElement
    expect(contentEl.className).toContain('Compact')
  })

  it('renders in expanded shape when description is provided', () => {
    const { container } = render(
      <GooeyToast
        title="Done!"
        description="Your file was saved."
        type="success"
        phase="success"
      />
    )
    // Advance past the showBody delay
    act(() => { vi.advanceTimersByTime(400) })
    const contentEl = container.querySelector('[class*="content"]') as HTMLElement
    expect(contentEl.className).toContain('Expanded')
    expect(screen.getByText('Your file was saved.')).toBeInTheDocument()
  })

  it('renders action button when action is provided', () => {
    const onClick = vi.fn()
    render(
      <GooeyToast
        title="Error"
        description="Something went wrong."
        type="error"
        phase="error"
        action={{ label: 'Retry', onClick }}
      />
    )
    act(() => { vi.advanceTimersByTime(400) })
    const button = screen.getByRole('button', { name: 'Retry' })
    expect(button).toBeInTheDocument()
  })

  it('calls action onClick when button is clicked', () => {
    const onClick = vi.fn()
    render(
      <GooeyToast
        title="Error"
        description="Something went wrong."
        type="error"
        phase="error"
        action={{ label: 'Retry', onClick }}
      />
    )
    act(() => { vi.advanceTimersByTime(400) })
    const button = screen.getByRole('button', { name: 'Retry' })
    fireEvent.click(button)
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('does not render description when not provided', () => {
    render(<GooeyToast title="Done!" type="success" phase="success" />)
    const desc = document.querySelector('[class*="description"]')
    expect(desc).toBeNull()
  })

  it('does not render action button when action is not provided', () => {
    render(<GooeyToast title="Done!" type="success" phase="success" />)
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('allows disabling timestamp with showTimestamp=false', () => {
    render(<GooeyToast title="Done!" type="success" phase="success" showTimestamp={false} />)
    const timestamp = document.querySelector('[class*="timestamp"]')
    expect(timestamp).toBeNull()
  })

  it('renders timestamp by default', () => {
    render(<GooeyToast title="Done!" type="success" phase="success" />)
    const timestamp = document.querySelector('[class*="timestamp"]')
    expect(timestamp).toBeInTheDocument()
  })

  it('renders custom icon when provided', () => {
    render(
      <GooeyToast
        title="Custom"
        type="info"
        phase="info"
        icon={<span data-testid="custom-icon">*</span>}
      />
    )
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument()
  })

  it('renders ReactNode description', () => {
    render(
      <GooeyToast
        title="Done!"
        description={<span data-testid="custom-desc">Rich content</span>}
        type="success"
        phase="success"
      />
    )
    act(() => { vi.advanceTimersByTime(400) })
    expect(screen.getByTestId('custom-desc')).toBeInTheDocument()
    expect(screen.getByText('Rich content')).toBeInTheDocument()
  })

  it('applies classNames to wrapper element', () => {
    const { container } = render(
      <GooeyToast
        title="Styled"
        type="info"
        phase="info"
        classNames={{ wrapper: 'my-custom-wrapper' }}
      />
    )
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.className).toContain('my-custom-wrapper')
  })

  it('applies classNames to content, header, title, and icon elements', () => {
    const { container } = render(
      <GooeyToast
        title="Styled"
        type="info"
        phase="info"
        classNames={{
          content: 'custom-content',
          header: 'custom-header',
          title: 'custom-title',
          icon: 'custom-icon',
        }}
      />
    )
    expect(container.querySelector('[class*="content"]')!.className).toContain('custom-content')
    expect(container.querySelector('[class*="header"]')!.className).toContain('custom-header')
    const titleEl = container.querySelector('span[class*="title"]')!
    expect(titleEl.className).toContain('custom-title')
    expect(container.querySelector('[class*="iconWrapper"]')!.className).toContain('custom-icon')
  })

  it('applies classNames to description element', () => {
    const { container } = render(
      <GooeyToast
        title="Styled"
        description="Some text"
        type="info"
        phase="info"
        classNames={{ description: 'custom-desc' }}
      />
    )
    act(() => { vi.advanceTimersByTime(400) })
    expect(container.querySelector('[class*="description"]')!.className).toContain('custom-desc')
  })

  it('applies classNames to action wrapper and button', () => {
    const onClick = vi.fn()
    const { container } = render(
      <GooeyToast
        title="Styled"
        description="Some text"
        type="error"
        phase="error"
        action={{ label: 'Retry', onClick }}
        classNames={{ actionWrapper: 'custom-aw', actionButton: 'custom-ab' }}
      />
    )
    act(() => { vi.advanceTimersByTime(400) })
    expect(container.querySelector('[class*="actionWrapper"]')!.className).toContain('custom-aw')
    const button = screen.getByRole('button', { name: 'Retry' })
    expect(button.className).toContain('custom-ab')
  })

  it('uses custom fillColor via the --gooey-fill var on the wrapper', () => {
    const { container } = render(
      <GooeyToast
        title="Dark"
        type="info"
        phase="info"
        fillColor="#1a1a2e"
      />
    )
    const w = container.querySelector('[data-theme]') as HTMLElement
    expect(w.style.getPropertyValue('--gooey-fill')).toBe('#1a1a2e')
  })

  it('leaves --gooey-fill unset when no fillColor (CSS supplies the themed default)', () => {
    const { container } = render(
      <GooeyToast
        title="Default"
        type="info"
        phase="info"
      />
    )
    const w = container.querySelector('[data-theme]') as HTMLElement
    expect(w.style.getPropertyValue('--gooey-fill')).toBe('')
  })

  describe('ARIA accessibility', () => {
    it('sets role="status" and aria-live="polite" for success toasts', () => {
      const { container } = render(
        <GooeyToast title="Done!" type="success" phase="success" />
      )
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper.getAttribute('role')).toBe('status')
      expect(wrapper.getAttribute('aria-live')).toBe('polite')
      expect(wrapper.getAttribute('aria-atomic')).toBe('true')
    })

    it('sets role="status" and aria-live="polite" for info toasts', () => {
      const { container } = render(
        <GooeyToast title="Info" type="info" phase="info" />
      )
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper.getAttribute('role')).toBe('status')
      expect(wrapper.getAttribute('aria-live')).toBe('polite')
    })

    it('sets role="status" and aria-live="polite" for default toasts', () => {
      const { container } = render(
        <GooeyToast title="Hello" type="default" phase="default" />
      )
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper.getAttribute('role')).toBe('status')
      expect(wrapper.getAttribute('aria-live')).toBe('polite')
    })

    it('sets role="alert" and aria-live="assertive" for error toasts', () => {
      const { container } = render(
        <GooeyToast title="Error!" type="error" phase="error" />
      )
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper.getAttribute('role')).toBe('alert')
      expect(wrapper.getAttribute('aria-live')).toBe('assertive')
      expect(wrapper.getAttribute('aria-atomic')).toBe('true')
    })

    it('sets role="alert" and aria-live="assertive" for warning toasts', () => {
      const { container } = render(
        <GooeyToast title="Warning!" type="warning" phase="warning" />
      )
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper.getAttribute('role')).toBe('alert')
      expect(wrapper.getAttribute('aria-live')).toBe('assertive')
    })

    it('hides SVG blob from screen readers with aria-hidden', () => {
      const { container } = render(
        <GooeyToast title="Done!" type="success" phase="success" />
      )
      const svg = container.querySelector('svg')
      expect(svg?.getAttribute('aria-hidden')).toBe('true')
    })
  })

  describe('prefers-reduced-motion', () => {
    it('expands immediately with no delay when reduced motion is preferred', () => {
      mockReducedMotion(true)
      const { container } = render(
        <GooeyToast
          title="Done!"
          description="Your file was saved."
          type="success"
          phase="success"
        />
      )
      // With reduced motion, expand delay is 0 so showBody should be true immediately
      act(() => { vi.advanceTimersByTime(1) })
      const contentEl = container.querySelector('[class*="content"]') as HTMLElement
      expect(contentEl.className).toContain('Expanded')
      expect(screen.getByText('Your file was saved.')).toBeInTheDocument()
    })

    it('still renders title and description correctly with reduced motion', () => {
      mockReducedMotion(true)
      render(
        <GooeyToast
          title="Info"
          description="Details here."
          type="info"
          phase="info"
        />
      )
      act(() => { vi.advanceTimersByTime(1) })
      expect(screen.getByText('Info')).toBeInTheDocument()
      expect(screen.getByText('Details here.')).toBeInTheDocument()
    })

    it('still renders action button with reduced motion', () => {
      mockReducedMotion(true)
      const onClick = vi.fn()
      render(
        <GooeyToast
          title="Error"
          description="Something went wrong."
          type="error"
          phase="error"
          action={{ label: 'Retry', onClick }}
        />
      )
      act(() => { vi.advanceTimersByTime(1) })
      const button = screen.getByRole('button', { name: 'Retry' })
      expect(button).toBeInTheDocument()
      fireEvent.click(button)
      expect(onClick).toHaveBeenCalledOnce()
    })

    it('renders compact pill without motion when no description', () => {
      mockReducedMotion(true)
      const { container } = render(
        <GooeyToast title="Done!" type="success" phase="success" />
      )
      const contentEl = container.querySelector('[class*="content"]') as HTMLElement
      expect(contentEl.className).toContain('Compact')
    })
  })

  describe('dark mode', () => {
    it('sets data-theme=dark (CSS applies dark fill) when theme is dark', () => {
      setGooeyTheme('dark')
      const { container } = render(
        <GooeyToast title="Dark" type="info" phase="info" />
      )
      const w = container.querySelector('[data-theme]') as HTMLElement
      expect(w.getAttribute('data-theme')).toBe('dark')
    })

    it('sets data-theme=light when theme is light', () => {
      setGooeyTheme('light')
      const { container } = render(
        <GooeyToast title="Light" type="info" phase="info" />
      )
      const w = container.querySelector('[data-theme]') as HTMLElement
      expect(w.getAttribute('data-theme')).toBe('light')
    })

    it('respects explicit fillColor even in dark mode', () => {
      setGooeyTheme('dark')
      const { container } = render(
        <GooeyToast title="Custom" type="info" phase="info" fillColor="#ff0000" />
      )
      const w = container.querySelector('[data-theme]') as HTMLElement
      expect(w.style.getPropertyValue('--gooey-fill')).toBe('#ff0000')
    })
  })

  describe('RTL layout support', () => {
    afterEach(() => {
      setGooeyDir('ltr')
      setGooeyPosition('bottom-right')
    })

    it('flips right-position to left-side visual in RTL mode', () => {
      setGooeyPosition('bottom-right')
      setGooeyDir('rtl')
      const { container } = render(
        <GooeyToast title="RTL Right" type="info" phase="info" />
      )
      const wrapper = container.firstChild as HTMLElement
      // In RTL with bottom-right position, the toast should NOT have marginLeft:auto/scaleX(-1)
      // because it visually behaves as a left-side toast
      expect(wrapper.style.marginLeft).not.toBe('auto')
      expect(wrapper.style.transform).not.toContain('scaleX(-1)')
    })

    it('flips left-position to right-side visual in RTL mode', () => {
      setGooeyPosition('bottom-left')
      setGooeyDir('rtl')
      const { container } = render(
        <GooeyToast title="RTL Left" type="info" phase="info" />
      )
      const wrapper = container.firstChild as HTMLElement
      // In RTL with bottom-left position, the toast should have right-side styles
      expect(wrapper.style.marginLeft).toBe('auto')
      expect(wrapper.style.transform).toContain('scaleX(-1)')
    })

    it('keeps center position unchanged in RTL mode', () => {
      setGooeyPosition('bottom-center')
      setGooeyDir('rtl')
      const { container } = render(
        <GooeyToast title="RTL Center" type="info" phase="info" />
      )
      const wrapper = container.firstChild as HTMLElement
      // Center position should remain centered in RTL
      expect(wrapper.style.margin).toBe('0px auto')
    })

    it('does not flip positions in LTR mode', () => {
      setGooeyPosition('bottom-right')
      setGooeyDir('ltr')
      const { container } = render(
        <GooeyToast title="LTR Right" type="info" phase="info" />
      )
      const wrapper = container.firstChild as HTMLElement
      // In LTR with bottom-right position, the toast should have right-side styles
      expect(wrapper.style.marginLeft).toBe('auto')
      expect(wrapper.style.transform).toContain('scaleX(-1)')
    })
  })
})
