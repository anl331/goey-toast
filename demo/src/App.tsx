import { useState, useEffect, useRef } from 'react'
import { GoeyToaster, goeyToast } from 'goey-toast'
import type { GoeyToastOptions, GoeyToasterProps } from 'goey-toast'
import { Analytics } from '@vercel/analytics/react'
import 'goey-toast/styles.css'
import './App.css'

type ToastType = 'default' | 'success' | 'error' | 'warning' | 'info'
type Page = 'home' | 'changelog'

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function failAfter(ms: number) {
  return new Promise((_, reject) => setTimeout(() => reject(new Error('Failed')), ms))
}

function GithubIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  )
}

function NpmIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M1.763 0C.786 0 0 .786 0 1.763v20.474C0 23.214.786 24 1.763 24h20.474c.977 0 1.763-.786 1.763-1.763V1.763C24 .786 23.214 0 22.237 0zM5.13 5.323l13.837.019-.009 13.836h-3.464l.01-10.382h-3.456L12.04 19.17H5.113z" />
    </svg>
  )
}

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function ArrowLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  )
}

function useCopy() {
  const [copied, setCopied] = useState(false)
  const copy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return { copied, copy }
}

const DEMO_DEFAULTS = {
  spring: true,
  timing: {
    displayDuration: 3000,
  },
} satisfies GoeyToastOptions

const TOAST_TYPES: ToastType[] = ['default', 'success', 'error', 'warning', 'info']
const POSITIONS: GoeyToasterProps['position'][] = ['top-left', 'top-center', 'top-right', 'center', 'bottom-left', 'bottom-center', 'bottom-right']

function App() {
  const installCopy = useCopy()
  const codeCopy = useCopy()
  const [page, setPage] = useState<Page>('home')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [heroVisible, setHeroVisible] = useState(true)
  const [heroLanding, setHeroLanding] = useState(false)
  const heroTitleRef = useRef<HTMLHeadingElement>(null)
  const prevHeroVisible = useRef(true)

  // Watch hero title visibility for header transform
  useEffect(() => {
    if (!heroTitleRef.current) return
    const observer = new IntersectionObserver(
      ([entry]) => setHeroVisible(entry.isIntersecting),
      { threshold: 0, rootMargin: `-${56}px 0px 0px 0px` }
    )
    observer.observe(heroTitleRef.current)
    return () => observer.disconnect()
  }, [])

  // Trigger landing animation when hero reappears (scrolling back up)
  useEffect(() => {
    if (heroVisible && !prevHeroVisible.current) {
      setHeroLanding(true)
      const timer = setTimeout(() => setHeroLanding(false), 500)
      return () => clearTimeout(timer)
    }
    prevHeroVisible.current = heroVisible
  }, [heroVisible])

  // Builder state
  const [bPosition, setBPosition] = useState<GoeyToasterProps['position']>('top-left')
  const [bType, setBType] = useState<ToastType>('success')
  const [bTitle, setBTitle] = useState('Changes saved')
  const [bHasDesc, setBHasDesc] = useState(true)
  const [bDesc, setBDesc] = useState('Your changes have been saved and synced successfully.')
  const [bHasAction, setBHasAction] = useState(false)
  const [bActionLabel, setBActionLabel] = useState('Undo')
  const [bFillColor, setBFillColor] = useState('#ffffff')
  const [bHasBorder, setBHasBorder] = useState(false)
  const [bBorderColor, setBBorderColor] = useState('#E0E0E0')
  const [bBorderWidth, setBBorderWidth] = useState(1.5)
  const [bDisplayDuration, setBDisplayDuration] = useState(4000)
  const [bSpring, setBSpring] = useState(true)
  const [bBounce, setBBounce] = useState(0.4)

  // Close mobile menu on page change
  useEffect(() => {
    setMobileMenuOpen(false)
    window.scrollTo(0, 0)
  }, [page])

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false)
    if (page !== 'home') {
      setPage('home')
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
      }, 50)
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const fireBuilderToast = () => {
    const options: GoeyToastOptions = {}
    if (bHasDesc && bDesc) options.description = bDesc
    if (bHasAction && bActionLabel) {
      options.action = { label: bActionLabel, onClick: () => { }, successLabel: 'Done!' }
    }
    if (bFillColor !== '#ffffff') options.fillColor = bFillColor
    if (bHasBorder && bBorderColor) {
      options.borderColor = bBorderColor
      options.borderWidth = bBorderWidth
    }
    if (bDisplayDuration !== 4000) {
      options.timing = { displayDuration: bDisplayDuration }
    }
    if (!bSpring) options.spring = false
    options.bounce = bBounce

    if (bType === 'default') goeyToast(bTitle, options)
    else goeyToast[bType](bTitle, options)
  }

  const generatedCode = (() => {
    const lines: string[] = []
    const hasFill = bFillColor !== '#ffffff'
    const hasBorder = bHasBorder && bBorderColor
    const hasSpringOff = !bSpring
    const hasBounce = bBounce !== 0.4
    const hasOpts = bHasDesc || bHasAction || hasFill || hasBorder || hasSpringOff || hasBounce
    const call = bType === 'default' ? 'goeyToast' : `goeyToast.${bType}`

    lines.push(`<GoeyToaster position="${bPosition}" />`)
    lines.push('')
    if (!hasOpts) {
      lines.push(`${call}('${bTitle}')`)
    } else {
      lines.push(`${call}('${bTitle}', {`)
      if (bHasDesc && bDesc) lines.push(`  description: '${bDesc}',`)
      if (bHasAction && bActionLabel) {
        lines.push(`  action: {`)
        lines.push(`    label: '${bActionLabel}',`)
        lines.push(`    onClick: () => {},`)
        lines.push(`  },`)
      }
      if (hasFill) lines.push(`  fillColor: '${bFillColor}',`)
      if (hasBorder) {
        lines.push(`  borderColor: '${bBorderColor}',`)
        lines.push(`  borderWidth: ${bBorderWidth},`)
      }
      if (hasSpringOff) lines.push(`  spring: false,`)
      if (hasBounce) lines.push(`  bounce: ${bBounce},`)
      if (bDisplayDuration !== 4000) {
        lines.push(`  timing: {`)
        lines.push(`    displayDuration: ${bDisplayDuration},`)
        lines.push(`  },`)
      }
      lines.push(`})`)
    }
    return lines.join('\n')
  })()

  return (
    <>
      <Analytics />
      <GoeyToaster position={bPosition} />

      {/* Header */}
      <header className={`site-header${!heroVisible && page === 'home' ? ' header--hero-hidden' : ''}`}>
        <div className="header-inner">
          <button className="header-logo" onClick={() => { setPage('home'); window.scrollTo(0, 0) }}>
            goey-toast
            <img src="/mascot.png" alt="" className="header-mascot" />
          </button>

          <nav className="header-nav">
            <button className="nav-link" onClick={() => scrollTo('examples')}>Examples</button>
            <button className="nav-link" onClick={() => scrollTo('builder')}>Builder</button>
            <button className="nav-link" onClick={() => scrollTo('docs')}>Docs</button>
            <button className={`nav-link${page === 'changelog' ? ' nav-link--active' : ''}`} onClick={() => setPage('changelog')}>Changelog</button>
          </nav>

          <div className="header-icons">
            <a href="https://github.com/anl331/goey-toast" target="_blank" rel="noopener noreferrer" className="header-icon-link" aria-label="GitHub">
              <GithubIcon size={18} />
            </a>
            <a href="https://www.npmjs.com/package/goey-toast" target="_blank" rel="noopener noreferrer" className="header-icon-link" aria-label="npm">
              <NpmIcon size={18} />
            </a>
          </div>

          <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Menu">
            {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="mobile-menu">
            <button className="mobile-menu-link" onClick={() => scrollTo('examples')}>Examples</button>
            <button className="mobile-menu-link" onClick={() => scrollTo('builder')}>Builder</button>
            <button className="mobile-menu-link" onClick={() => scrollTo('docs')}>Docs</button>
            <button className={`mobile-menu-link${page === 'changelog' ? ' mobile-menu-link--active' : ''}`} onClick={() => { setPage('changelog'); setMobileMenuOpen(false) }}>Changelog</button>
            <div className="mobile-menu-divider" />
            <div className="mobile-menu-icons">
              <a href="https://github.com/anl331/goey-toast" target="_blank" rel="noopener noreferrer" className="header-icon-link">
                <GithubIcon size={18} /> GitHub
              </a>
              <a href="https://www.npmjs.com/package/goey-toast" target="_blank" rel="noopener noreferrer" className="header-icon-link">
                <NpmIcon size={18} /> npm
              </a>
            </div>
          </div>
        )}
      </header>

      {page === 'changelog' ? (
        /* ==========================================
           Changelog Page
           ========================================== */
        <div className="page-changelog">
          <button className="back-link" onClick={() => setPage('home')}>
            <ArrowLeftIcon /> Back to home
          </button>

          <div className="changelog-header">
            <h1>Changelog</h1>
            <p>What's new in goey-toast.</p>
          </div>

          <div className="changelog-entry">
            <div className="changelog-version">
              <span className="changelog-tag">v0.1.0</span>
              <span className="changelog-date">Feb 2026</span>
            </div>
            <div className="changelog-body">
              <h4>Initial Release</h4>
              <ul>
                <li>Organic blob morph animation (pill to blob and back)</li>
                <li>Five toast types: default, success, error, warning, info</li>
                <li>Description body with string or ReactNode support</li>
                <li>Action button with optional success label morph-back</li>
                <li>Promise toasts with loading to success/error transitions</li>
                <li>Configurable display duration and bounce intensity</li>
                <li>6 positions: top-left, top-center, top-right, bottom-left, bottom-center, bottom-right</li>
                <li>Right-side positions auto-mirror the blob horizontally</li>
                <li>Hover pause: hovering an expanded toast pauses the dismiss timer</li>
                <li>Hover re-expand: hovering a collapsed pill re-expands the toast</li>
                <li>Pre-dismiss collapse animation (blob shrinks to pill before exit)</li>
                <li>Custom fill color, border color, and border width</li>
                <li>CSS class overrides via classNames prop</li>
                <li>Built on Sonner and Framer Motion</li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        /* ==========================================
           Home Page
           ========================================== */
        <>
          {/* Hero */}
          <div className="hero">
            <div className="hero-badge">
              <span /> v0.2.0
            </div>
            <h1 ref={heroTitleRef} className={heroLanding ? 'hero-title--landing' : ''}>goey-toast <img src="/mascot.png" alt="mascot" className={`hero-mascot${heroLanding ? ' hero-mascot--landing' : ''}`} /></h1>
            <p className="hero-description">
              Morphing toast notifications for React. Organic blob animations,
              promise tracking, and full customization out of the box.
            </p>
            <div className="hero-install">
              <div className="install-wrapper">
                <code><span className="prompt">$</span> npm install goey-toast</code>
                <button className="copy-btn" onClick={() => installCopy.copy('npm install goey-toast')}>
                  {installCopy.copied ? <CheckIcon /> : <CopyIcon />}
                </button>
              </div>
            </div>
          </div>

          {/* Main two-column area */}
          <div className="two-col" id="examples">

            {/* Quick-fire examples */}
            <div className="examples">
              <div className="examples-header">
                <h2>Examples</h2>
                <span>Click to preview</span>
              </div>

              <div className="section">
                <div className="section-label">Toast Types</div>
                <div className="buttons">
                  <button onClick={() => goeyToast('Notification received', DEMO_DEFAULTS)}>Default</button>
                  <button onClick={() => goeyToast.success('Changes Saved', DEMO_DEFAULTS)}>Success</button>
                  <button onClick={() => goeyToast.error('Something went wrong', DEMO_DEFAULTS)}>Error</button>
                  <button onClick={() => goeyToast.warning('Storage is almost full', DEMO_DEFAULTS)}>Warning</button>
                  <button onClick={() => goeyToast.info('New update available', DEMO_DEFAULTS)}>Info</button>
                </div>
              </div>

              <div className="section">
                <div className="section-label">With Description</div>
                <div className="buttons">
                  <button onClick={() => goeyToast.warning('Your session is about to expire', { ...DEMO_DEFAULTS, description: "You've been inactive for 25 minutes. Please save your work or your session will end automatically." })}>
                    Warning + Description
                  </button>
                  <button onClick={() => goeyToast.error('Connection lost', { ...DEMO_DEFAULTS, description: 'Unable to reach the server. Check your internet connection and try again.' })}>
                    Error + Description
                  </button>
                </div>
              </div>

              <div className="section">
                <div className="section-label">With Action Button</div>
                <div className="buttons">
                  <button onClick={() => goeyToast.error('Payment failed', { ...DEMO_DEFAULTS, description: 'Your card ending in 4242 was declined. Please update your payment method to continue.', action: { label: 'Update Payment', onClick: () => goeyToast.success('Redirecting...', DEMO_DEFAULTS) } })}>
                    Error + Action
                  </button>
                  <button onClick={() => goeyToast.info('Share link ready', { ...DEMO_DEFAULTS, description: 'Your share link has been generated and is ready to copy.', action: { label: 'Copy to Clipboard', onClick: () => navigator.clipboard.writeText('https://example.com/share/abc123'), successLabel: 'Copied!' } })}>
                    Action + Success Pill
                  </button>
                </div>
              </div>

              <div className="section">
                <div className="section-label">Custom Component Body</div>
                <div className="buttons">
                  <button onClick={() => goeyToast.success('Deployment complete', {
                    ...DEMO_DEFAULTS,
                    description: (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 300 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                          <span style={{ color: '#888' }}>Environment</span>
                          <span style={{ fontWeight: 600 }}>Production</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                          <span style={{ color: '#888' }}>Branch</span>
                          <span style={{ fontWeight: 600 }}>main @ 3f8a2c1</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                          <span style={{ color: '#888' }}>Duration</span>
                          <span style={{ fontWeight: 600 }}>2m 14s</span>
                        </div>
                        <div style={{ height: 1, background: '#e5e5e5' }} />
                        <div style={{ fontSize: 11, color: '#888' }}>https://my-app.vercel.app</div>
                      </div>
                    ),
                  })}>
                    ReactNode Description
                  </button>
                </div>
              </div>

              <div className="section">
                <div className="section-label">No Spring (Smooth Easing)</div>
                <div className="buttons">
                  <button onClick={() => goeyToast.success('Changes Saved', { ...DEMO_DEFAULTS, spring: false })}>Success (no spring)</button>
                  <button onClick={() => goeyToast.error('Connection lost', { ...DEMO_DEFAULTS, spring: false, description: 'Unable to reach the server. Check your internet connection and try again.' })}>Error + Desc (no spring)</button>
                  <button onClick={() => goeyToast.info('Share link ready', { ...DEMO_DEFAULTS, spring: false, description: 'Your share link has been generated and is ready to copy.', action: { label: 'Copy to Clipboard', onClick: () => navigator.clipboard.writeText('https://example.com/share/abc123'), successLabel: 'Copied!' } })}>Action (no spring)</button>
                </div>
              </div>

              <div className="section">
                <div className="section-label">Promise (Morph Animation)</div>
                <div className="buttons">
                  <button onClick={() => goeyToast.promise(sleep(2000), { ...DEMO_DEFAULTS, loading: 'Saving...', success: 'Changes Saved', error: 'Something went wrong' })}>
                    Promise + Success (pill)
                  </button>
                  <button onClick={() => goeyToast.promise(failAfter(2000), { ...DEMO_DEFAULTS, loading: 'Saving...', success: 'Changes Saved', error: 'Something went wrong' })}>
                    Promise + Error (pill)
                  </button>
                  <button onClick={() => goeyToast.promise(failAfter(2000), { ...DEMO_DEFAULTS, loading: 'Uploading file...', success: 'Upload complete', error: 'Upload failed', description: { error: "You've used 95% of your available storage. Please upgrade and plan to continue." }, action: { error: { label: 'Action Button', onClick: () => goeyToast.info('Retrying...', DEMO_DEFAULTS) } } })}>
                    Promise + Error (expanded)
                  </button>
                  <button onClick={() => goeyToast.promise(sleep(2000), { ...DEMO_DEFAULTS, loading: 'Processing...', success: 'All done!', error: 'Failed', description: { success: 'Your data has been processed and saved successfully.' } })}>
                    Promise + Success (expanded)
                  </button>
                </div>
              </div>
            </div>

            {/* Interactive Builder */}
            <div className="builder" id="builder">
              <div className="builder-header">
                <h2>Builder</h2>
                <p>Design and test your toast in real time.</p>
              </div>

              <div className="builder-card">
                {/* Position */}
                <div className="builder-row">
                  <div className="builder-label">Position</div>
                  <div className="type-pills">
                    {POSITIONS.map((p) => (
                      <button
                        key={p}
                        className="type-pill"
                        data-type="position"
                        data-active={bPosition === p}
                        onClick={() => setBPosition(p)}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Type */}
                <div className="builder-row">
                  <div className="builder-label">Type</div>
                  <div className="type-pills">
                    {TOAST_TYPES.map((t) => (
                      <button
                        key={t}
                        className="type-pill"
                        data-type={t}
                        data-active={bType === t}
                        onClick={() => setBType(t)}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div className="builder-row">
                  <div className="builder-label">Title</div>
                  <input
                    className="builder-input"
                    value={bTitle}
                    onChange={(e) => setBTitle(e.target.value)}
                    placeholder="Toast title..."
                  />
                </div>

                {/* Description toggle + input */}
                <div className="builder-row">
                  <div className="toggle-row">
                    <span className="toggle-row-label">Description</span>
                    <button className="toggle" data-on={bHasDesc} onClick={() => setBHasDesc(!bHasDesc)}>
                      <div className="toggle-knob" />
                    </button>
                  </div>
                  {bHasDesc && (
                    <textarea
                      className="builder-input"
                      style={{ marginTop: 10 }}
                      value={bDesc}
                      onChange={(e) => setBDesc(e.target.value)}
                      placeholder="Description text..."
                    />
                  )}
                </div>

                {/* Action toggle + input */}
                <div className="builder-row">
                  <div className="toggle-row">
                    <span className="toggle-row-label">Action Button</span>
                    <button className="toggle" data-on={bHasAction} onClick={() => setBHasAction(!bHasAction)}>
                      <div className="toggle-knob" />
                    </button>
                  </div>
                  {bHasAction && (
                    <input
                      className="builder-input"
                      style={{ marginTop: 10 }}
                      value={bActionLabel}
                      onChange={(e) => setBActionLabel(e.target.value)}
                      placeholder="Button label..."
                    />
                  )}
                </div>

                {/* Style */}
                <div className="builder-row">
                  <div className="builder-label">Style</div>
                  <div className="style-controls">
                    <div className="color-row">
                      <span className="color-row-label">Fill Color</span>
                      <div className="color-picker-group">
                        <input
                          type="color"
                          className="color-input"
                          value={bFillColor}
                          onChange={(e) => setBFillColor(e.target.value)}
                        />
                        <input
                          className="builder-input color-hex"
                          value={bFillColor}
                          onChange={(e) => setBFillColor(e.target.value)}
                          placeholder="#ffffff"
                        />
                      </div>
                    </div>
                    <div className="border-section">
                      <div className="toggle-row">
                        <span className="toggle-row-label">Border</span>
                        <button className="toggle" data-on={bHasBorder} onClick={() => setBHasBorder(!bHasBorder)}>
                          <div className="toggle-knob" />
                        </button>
                      </div>
                      {bHasBorder && (
                        <div className="border-controls">
                          <div className="color-row">
                            <span className="color-row-label">Color</span>
                            <div className="color-picker-group">
                              <input
                                type="color"
                                className="color-input"
                                value={bBorderColor}
                                onChange={(e) => setBBorderColor(e.target.value)}
                              />
                              <input
                                className="builder-input color-hex"
                                value={bBorderColor}
                                onChange={(e) => setBBorderColor(e.target.value)}
                                placeholder="#E0E0E0"
                              />
                            </div>
                          </div>
                          <div className="slider-item">
                            <div className="slider-item-header">
                              <span className="slider-item-label">Width</span>
                              <span className="slider-item-value">{bBorderWidth}px</span>
                            </div>
                            <input type="range" className="slider" min={0.5} max={4} step={0.5} value={bBorderWidth} onChange={(e) => setBBorderWidth(Number(e.target.value))} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Timing sliders */}
                <div className="builder-row">
                  <div className="builder-label">Timing</div>
                  <div className="slider-group">
                    <div className="slider-item">
                      <div className="slider-item-header">
                        <span className="slider-item-label">Display Duration</span>
                        <span className="slider-item-value">{(bDisplayDuration / 1000).toFixed(1)}s</span>
                      </div>
                      <input type="range" className="slider" min={1000} max={20000} step={500} value={bDisplayDuration} onChange={(e) => setBDisplayDuration(Number(e.target.value))} />
                    </div>
                  </div>
                </div>

                {/* Spring Effect */}
                <div className="builder-row">
                  <div className="builder-label">Spring Effect</div>
                  <div className="slider-group">
                    <div className="slider-item">
                      <div className="slider-item-header">
                        <span className="slider-item-label">{bSpring ? `Bounce: ${bBounce.toFixed(2)}` : 'Off'}</span>
                        <button className="toggle" data-on={bSpring} onClick={() => setBSpring(!bSpring)} style={{ transform: 'scale(0.85)' }}>
                          <div className="toggle-knob" />
                        </button>
                      </div>
                      {bSpring && (
                        <input type="range" className="slider" min={0.05} max={0.8} step={0.05} value={bBounce} onChange={(e) => setBBounce(Number(e.target.value))} />
                      )}
                    </div>
                  </div>
                </div>

                {/* Fire button */}
                <div className="builder-row">
                  <button className="fire-btn" onClick={fireBuilderToast}>
                    Fire Toast
                  </button>
                </div>

                {/* Generated code */}
                <div className="builder-code">
                  <button className="code-copy-btn" onClick={() => codeCopy.copy(generatedCode)}>
                    {codeCopy.copied ? 'Copied!' : 'Copy'}
                  </button>
                  <pre><code>{generatedCode}</code></pre>
                </div>
              </div>
            </div>

          </div>{/* end two-col */}

          {/* Documentation */}
          <div className="docs" id="docs">
            <div className="docs-header">
              <h2>Documentation</h2>
              <p>Everything you need to add morphing toast notifications to your React app.</p>
            </div>

            <div className="doc-section">
              <div className="doc-section-label">
                <div className="doc-number">01</div>
                <h3>Quick Start</h3>
              </div>
              <div className="doc-section-content">
                <p>
                  Add the <span className="inline-code">GoeyToaster</span> provider and call{' '}
                  <span className="inline-code">goeyToast</span> from anywhere.
                </p>
                <pre><code>{`import { GoeyToaster, goeyToast } from 'goey-toast'

function App() {
  return (
    <>
      <GoeyToaster position="bottom-right" />
      <button onClick={() => goeyToast.success('Saved!')}>
        Save
      </button>
    </>
  )
}`}</code></pre>
                <p>
                  Requires <span className="inline-code">react</span>,{' '}
                  <span className="inline-code">react-dom</span>, and{' '}
                  <span className="inline-code">framer-motion</span> as peer dependencies.
                </p>
              </div>
            </div>

            <div className="doc-section">
              <div className="doc-section-label">
                <div className="doc-number">02</div>
                <h3>shadcn/ui</h3>
              </div>
              <div className="doc-section-content">
                <p>
                  Install as a shadcn component with a single command. This adds a thin wrapper
                  to your <span className="inline-code">components/ui</span> directory and
                  auto-installs dependencies.
                </p>
                <pre><code>{`npx shadcn@latest add https://goey-toast.vercel.app/r/goey-toaster.json`}</code></pre>
                <p>Then use it in your layout:</p>
                <pre><code>{`import { GoeyToaster } from "@/components/ui/goey-toaster"
import { goeyToast } from "@/components/ui/goey-toaster"

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <GoeyToaster />
      </body>
    </html>
  )
}

// Trigger from anywhere
goeyToast.success("Saved!")`}</code></pre>
              </div>
            </div>

            <div className="doc-section">
              <div className="doc-section-label">
                <div className="doc-number">03</div>
                <h3>Toast Types</h3>
              </div>
              <div className="doc-section-content">
                <pre><code>{`goeyToast('Hello')                    // default (neutral)
goeyToast.success('Saved!')           // green
goeyToast.error('Failed')             // red
goeyToast.warning('Careful')          // yellow
goeyToast.info('FYI')                 // blue`}</code></pre>
                <div className="doc-try-buttons">
                  <button onClick={() => goeyToast('Notification received', DEMO_DEFAULTS)}>Default</button>
                  <button onClick={() => goeyToast.success('Changes Saved', DEMO_DEFAULTS)}>Success</button>
                  <button onClick={() => goeyToast.error('Something went wrong', DEMO_DEFAULTS)}>Error</button>
                  <button onClick={() => goeyToast.warning('Storage is almost full', DEMO_DEFAULTS)}>Warning</button>
                  <button onClick={() => goeyToast.info('New update available', DEMO_DEFAULTS)}>Info</button>
                </div>
              </div>
            </div>

            <div className="doc-section">
              <div className="doc-section-label">
                <div className="doc-number">04</div>
                <h3>Description</h3>
              </div>
              <div className="doc-section-content">
                <p>
                  Pass a string or any <span className="inline-code">ReactNode</span> as the
                  description to expand the toast into a blob.
                </p>
                <pre><code>{`goeyToast.error('Payment failed', {
  description: 'Your card was declined.',
})

// Custom component as body
goeyToast.success('Deployed', {
  description: (
    <div>
      <strong>Production</strong>
      <span>main @ 3f8a2c1</span>
    </div>
  ),
})`}</code></pre>
                <div className="doc-try-buttons">
                  <button onClick={() => goeyToast.warning('Your session is about to expire', { ...DEMO_DEFAULTS, description: "You've been inactive for 25 minutes. Please save your work or your session will end automatically." })}>Warning + Description</button>
                  <button onClick={() => goeyToast.error('Connection lost', { ...DEMO_DEFAULTS, description: 'Unable to reach the server. Check your internet connection and try again.' })}>Error + Description</button>
                </div>
              </div>
            </div>

            <div className="doc-section">
              <div className="doc-section-label">
                <div className="doc-number">05</div>
                <h3>Action Button</h3>
              </div>
              <div className="doc-section-content">
                <p>
                  Add <span className="inline-code">successLabel</span> for a pill morph-back
                  animation on click.
                </p>
                <pre><code>{`goeyToast.info('Share link ready', {
  description: 'Your link has been generated.',
  action: {
    label: 'Copy to Clipboard',
    onClick: () => navigator.clipboard.writeText(url),
    successLabel: 'Copied!',   // optional morph-back
  },
})`}</code></pre>
                <div className="doc-try-buttons">
                  <button onClick={() => goeyToast.error('Payment failed', { ...DEMO_DEFAULTS, description: 'Your card ending in 4242 was declined. Please update your payment method to continue.', action: { label: 'Update Payment', onClick: () => goeyToast.success('Redirecting...', DEMO_DEFAULTS) } })}>Error + Action</button>
                  <button onClick={() => goeyToast.info('Share link ready', { ...DEMO_DEFAULTS, description: 'Your share link has been generated and is ready to copy.', action: { label: 'Copy to Clipboard', onClick: () => navigator.clipboard.writeText('https://example.com/share/abc123'), successLabel: 'Copied!' } })}>Action + Success Pill</button>
                </div>
              </div>
            </div>

            <div className="doc-section">
              <div className="doc-section-label">
                <div className="doc-number">06</div>
                <h3>Promise Toasts</h3>
              </div>
              <div className="doc-section-content">
                <p>
                  Automatically transitions from loading to success/error when the promise resolves.
                </p>
                <pre><code>{`goeyToast.promise(saveData(), {
  loading: 'Saving...',
  success: 'Changes saved',
  error: 'Something went wrong',
  description: {
    success: 'All changes have been synced.',
    error: 'Please try again later.',
  },
  action: {
    error: {
      label: 'Retry',
      onClick: () => retry(),
    },
  },
})`}</code></pre>
                <div className="doc-try-buttons">
                  <button onClick={() => goeyToast.promise(sleep(2000), { ...DEMO_DEFAULTS, loading: 'Saving...', success: 'Changes Saved', error: 'Something went wrong' })}>Promise + Success (pill)</button>
                  <button onClick={() => goeyToast.promise(failAfter(2000), { ...DEMO_DEFAULTS, loading: 'Saving...', success: 'Changes Saved', error: 'Something went wrong' })}>Promise + Error (pill)</button>
                  <button onClick={() => goeyToast.promise(sleep(2000), { ...DEMO_DEFAULTS, loading: 'Processing...', success: 'All done!', error: 'Failed', description: { success: 'Your data has been processed and saved successfully.' } })}>Promise + Success (expanded)</button>
                </div>
              </div>
            </div>

            <div className="doc-section">
              <div className="doc-section-label">
                <div className="doc-number">07</div>
                <h3>Timings</h3>
              </div>
              <div className="doc-section-content">
                <p>
                  Control how long toasts stay visible with the{' '}
                  <span className="inline-code">timing</span> option.
                </p>
                <div className="table-scroll">
                  <table className="prop-table">
                    <thead>
                      <tr><th>Property</th><th>Type</th><th>Default</th><th>Description</th></tr>
                    </thead>
                    <tbody>
                      <tr><td>displayDuration</td><td>number</td><td>4000</td><td>Milliseconds toast stays visible</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="doc-section">
              <div className="doc-section-label">
                <div className="doc-number">08</div>
                <h3>Toaster Props</h3>
              </div>
              <div className="doc-section-content">
                <p>
                  6 positions supported. Right-side positions auto-mirror the blob horizontally.
                  Center positions use a symmetric morph where the body grows outward from the pill.
                </p>
                <pre><code>{`<GoeyToaster position="top-center" />`}</code></pre>
                <div className="table-scroll">
                  <table className="prop-table">
                    <thead>
                      <tr><th>Prop</th><th>Type</th><th>Default</th><th>Description</th></tr>
                    </thead>
                    <tbody>
                      <tr><td>position</td><td>string</td><td>'bottom-right'</td><td>6 positions: top-left, top-center, top-right, bottom-left, bottom-center, bottom-right</td></tr>
                      <tr><td>duration</td><td>number</td><td>—</td><td>Default display duration (ms)</td></tr>
                      <tr><td>gap</td><td>number</td><td>14</td><td>Gap between stacked toasts</td></tr>
                      <tr><td>offset</td><td>number | string</td><td>'24px'</td><td>Distance from screen edge</td></tr>
                      <tr><td>theme</td><td>'light' | 'dark'</td><td>'light'</td><td>Color theme</td></tr>
                      <tr><td>spring</td><td>boolean</td><td>true</td><td>Enable spring/bounce animations globally</td></tr>
                      <tr><td>bounce</td><td>number</td><td>0.4</td><td>Spring intensity: 0.05 (subtle) to 0.8 (dramatic)</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="doc-section">
              <div className="doc-section-label">
                <div className="doc-number">09</div>
                <h3>Options</h3>
              </div>
              <div className="doc-section-content">
                <div className="table-scroll">
                  <table className="prop-table">
                    <thead>
                      <tr><th>Option</th><th>Type</th><th>Description</th></tr>
                    </thead>
                    <tbody>
                      <tr><td>description</td><td>ReactNode</td><td>Body content (string or component)</td></tr>
                      <tr><td>action</td><td>GoeyToastAction</td><td>Action button config</td></tr>
                      <tr><td>icon</td><td>ReactNode</td><td>Custom icon override</td></tr>
                      <tr><td>duration</td><td>number</td><td>Display duration in ms</td></tr>
                      <tr><td>id</td><td>string | number</td><td>Unique toast identifier</td></tr>
                      <tr><td>classNames</td><td>GoeyToastClassNames</td><td>CSS class overrides</td></tr>
                      <tr><td>fillColor</td><td>string</td><td>Background color of the blob</td></tr>
                      <tr><td>borderColor</td><td>string</td><td>Border color of the blob</td></tr>
                      <tr><td>borderWidth</td><td>number</td><td>Border width in px (default 1.5)</td></tr>
                      <tr><td>timing</td><td>GoeyToastTimings</td><td>Animation timing overrides</td></tr>
                      <tr><td>spring</td><td>boolean</td><td>Enable spring/bounce animations (default true)</td></tr>
                      <tr><td>bounce</td><td>number</td><td>Spring intensity: 0.05 (subtle) to 0.8 (dramatic), default 0.4</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="doc-section">
              <div className="doc-section-label">
                <div className="doc-number">10</div>
                <h3>Custom Styling</h3>
              </div>
              <div className="doc-section-content">
                <p>
                  Override styles for any part of the toast with{' '}
                  <span className="inline-code">classNames</span>.
                </p>
                <pre><code>{`goeyToast.success('Styled!', {
  fillColor: '#1a1a2e',
  borderColor: '#333',
  borderWidth: 2,
  classNames: {
    wrapper: 'my-wrapper',
    title: 'my-title',
    description: 'my-desc',
    actionButton: 'my-btn',
  },
})`}</code></pre>
                <div className="doc-try-buttons">
                  <button onClick={() => goeyToast.success('Styled!', { ...DEMO_DEFAULTS, fillColor: '#1a1a2e', borderColor: '#333', borderWidth: 2, description: 'Custom fill and border styling.' })}>Try Custom Style</button>
                </div>
                <div className="table-scroll">
                  <table className="prop-table">
                    <thead>
                      <tr><th>Key</th><th>Target</th></tr>
                    </thead>
                    <tbody>
                      <tr><td>wrapper</td><td>Outer container</td></tr>
                      <tr><td>content</td><td>Content area</td></tr>
                      <tr><td>header</td><td>Icon + title row</td></tr>
                      <tr><td>title</td><td>Title text</td></tr>
                      <tr><td>icon</td><td>Icon wrapper</td></tr>
                      <tr><td>description</td><td>Body text</td></tr>
                      <tr><td>actionWrapper</td><td>Button container</td></tr>
                      <tr><td>actionButton</td><td>Action button</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="doc-section">
              <div className="doc-section-label">
                <div className="doc-number">11</div>
                <h3>Spring Animation</h3>
              </div>
              <div className="doc-section-content">
                <p>
                  Disable the spring/bounce effect for a cleaner, more subtle animation style.
                  Set per-toast or globally on the Toaster.
                </p>
                <pre><code>{`// Per-toast
goeyToast.success('Saved', {
  description: 'Your changes have been synced.',
  spring: false,
})

// Global default
<GoeyToaster spring={false} />`}</code></pre>
                <p>
                  When <span className="inline-code">spring</span> is{' '}
                  <span className="inline-code">false</span>, all spring-based animations
                  (landing squish, blob morph, pill resize, header squish) use smooth
                  ease-in-out curves instead. Error shake still works regardless.
                  Per-toast values override the global setting.
                </p>
                <div className="doc-try-buttons">
                  <button onClick={() => goeyToast.success('Smooth save', DEMO_DEFAULTS)}>No Spring (pill)</button>
                  <button onClick={() => goeyToast.warning('Storage warning', { ...DEMO_DEFAULTS, description: 'You are using 95% of your available storage.' })}>No Spring (expanded)</button>
                  <button onClick={() => goeyToast.success('Bouncy save', { ...DEMO_DEFAULTS, spring: true })}>With Spring (compare)</button>
                </div>
              </div>
            </div>

          </div>
        </>
      )}
    </>
  )
}

export default App
