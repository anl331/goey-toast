import { useEffect, useLayoutEffect, useRef } from 'react'
import { Toaster } from 'sonner'
import type { GooeyToasterProps } from '../types'
import { animationPresets } from '../presets'
import { setGooeyPosition, setGooeyDir, setGooeySpring, setGooeyBounce, setGooeyVisibleToasts, setContainerHovered, setGooeySwipeToDismiss, setGooeyCloseOnEscape, setGooeyTheme, setGooeyMaxQueue, setGooeyQueueOverflow, setGooeyShowProgress, setGooeyCloseButton, setGooeyShowTimestamp } from '../context'
import { gooeyToast, _getMostRecentActiveId } from '../gooey-toast'
import { AriaLiveAnnouncer } from './AriaLiveAnnouncer'

export function GooeyToaster({
  position = 'bottom-right',
  duration,
  gap = 14,
  offset = '24px',
  theme = 'light',
  toastOptions,
  expand,
  closeButton,
  richColors,
  visibleToasts,
  dir,
  preset,
  spring,
  bounce,
  swipeToDismiss = true,
  closeOnEscape = true,
  maxQueue = Infinity,
  queueOverflow = 'drop-oldest',
  showProgress = false,
  showTimestamp = true,
}: GooeyToasterProps) {
  const presetConfig = preset ? animationPresets[preset] : undefined
  const resolvedSpring = spring ?? presetConfig?.spring ?? true
  const resolvedBounce = bounce ?? presetConfig?.bounce

  useEffect(() => {
    setGooeyPosition(position)
  }, [position])

  useEffect(() => {
    setGooeyDir(dir ?? 'ltr')
  }, [dir])

  useEffect(() => {
    setGooeyTheme(theme)
  }, [theme])

  useEffect(() => {
    setGooeySpring(resolvedSpring)
  }, [resolvedSpring])

  useEffect(() => {
    setGooeyBounce(resolvedBounce)
  }, [resolvedBounce])

  useEffect(() => {
    setGooeySwipeToDismiss(swipeToDismiss)
  }, [swipeToDismiss])

  useEffect(() => {
    setGooeyCloseOnEscape(closeOnEscape)
  }, [closeOnEscape])

  useEffect(() => {
    if (!closeOnEscape) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const recentId = _getMostRecentActiveId()
        if (recentId != null) {
          gooeyToast.dismiss(recentId)
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [closeOnEscape])

  useEffect(() => {
    setGooeyVisibleToasts(visibleToasts ?? 3)
  }, [visibleToasts])

  useEffect(() => {
    setGooeyMaxQueue(maxQueue)
  }, [maxQueue])

  useEffect(() => {
    setGooeyQueueOverflow(queueOverflow)
  }, [queueOverflow])

  useEffect(() => {
    setGooeyShowProgress(showProgress)
  }, [showProgress])

  useEffect(() => {
    setGooeyCloseButton(closeButton ?? false)
  }, [closeButton])

  useLayoutEffect(() => {
    setGooeyShowTimestamp(showTimestamp)
  }, [showTimestamp])

  // Detect hover on the Sonner container and broadcast to all GooeyToast instances.
  // Uses Sonner's `data-expanded` attribute (set per-toast <li>) as the hover signal
  // rather than raw mouseenter/mouseleave on the <ol>. This is more reliable because
  // Sonner manages it with onMouseEnter + onMouseMove + onMouseLeave, and it survives
  // <ol> remounts (all toasts dismissed then new ones appear).
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    // Sonner renders a persistent <section>; its <ol data-sonner-toaster> children come and go.
    const section = root.querySelector('section') ?? root
    const findOl = () => section.querySelector<HTMLElement>('[data-sonner-toaster]')
    let expandObs: MutationObserver | null = null
    let currentOl: HTMLElement | null = null

    const syncFromExpanded = (ol: HTMLElement) => {
      const anyExpanded = ol.querySelector('[data-sonner-toast][data-expanded="true"]') !== null
      setContainerHovered(anyExpanded)
    }

    const attach = (ol: HTMLElement) => {
      if (ol === currentOl) return
      expandObs?.disconnect()
      currentOl = ol
      expandObs = new MutationObserver(() => syncFromExpanded(ol))
      expandObs.observe(ol, { attributes: true, attributeFilter: ['data-expanded'], subtree: true })
      syncFromExpanded(ol)
    }

    const el = findOl()
    if (el) attach(el)

    // Re-discover if the <ol> is remounted (e.g. all toasts dismissed then new ones appear).
    // Debounce via rAF to coalesce rapid DOM mutations (e.g. multiple toasts mounting).
    let bodyRafId = 0
    const bodyObs = new MutationObserver(() => {
      if (bodyRafId) return
      bodyRafId = requestAnimationFrame(() => {
        bodyRafId = 0
        const found = findOl()
        if (found) {
          attach(found)
        } else if (currentOl) {
          expandObs?.disconnect()
          currentOl = null
          setContainerHovered(false)
        }
      })
    })
    bodyObs.observe(section, { childList: true })

    return () => {
      if (bodyRafId) cancelAnimationFrame(bodyRafId)
      bodyObs.disconnect()
      expandObs?.disconnect()
      setContainerHovered(false)
    }
  }, [])

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return

    const el = document.createElement('div')
    el.setAttribute('data-gooey-toast-css', '')
    el.style.position = 'absolute'
    el.style.width = '0'
    el.style.height = '0'
    el.style.overflow = 'hidden'
    el.style.pointerEvents = 'none'
    document.body.appendChild(el)

    const value = getComputedStyle(el).getPropertyValue('--gooey-toast')
    document.body.removeChild(el)

    if (!value) {
      console.warn(
        '[gooey-toast] Styles not found. Make sure to import the CSS:\n\n' +
        '  import "goey-toast/styles.css";\n'
      )
    }
  }, [])

  return (
    <>
      <div ref={rootRef} style={{ display: 'contents' }}>
      <Toaster
        position={position}
        duration={duration}
        gap={gap}
        offset={offset}
        theme={theme}
        toastOptions={{ unstyled: true, ...toastOptions }}
        expand={expand}
        closeButton={false}
        richColors={richColors}
        visibleToasts={99}
        dir={dir}
      />
      </div>
      <AriaLiveAnnouncer />
    </>
  )
}
