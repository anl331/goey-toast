import { useRef, useState, useEffect, useLayoutEffect as useLayoutEffectOrig, useCallback, useMemo, useSyncExternalStore, type FC, type ReactNode } from 'react'
import { motion, AnimatePresence, animate } from 'framer-motion'
import { toast as sonnerToast } from 'sonner'
import type { GooeyToastAction, GooeyToastClassNames, GooeyToastPhase, GooeyToastTimings, GooeyToastType } from '../types'
import type { AnimationPresetName } from '../presets'
import { animationPresets } from '../presets'
import { getGooeyPosition, getGooeyDir, getGooeySpring, getGooeyBounce, getGooeySwipeToDismiss, subscribeGooeyTheme, getGooeyTheme, getGooeyThemeServerSnapshot, getGooeyShowProgress, getGooeyCloseButton, subscribeContainerHovered, getContainerHovered, getGooeyShowTimestamp } from '../context'
import { DefaultIcon, SuccessIcon, ErrorIcon, WarningIcon, InfoIcon, SpinnerIcon } from '../icons'
import { usePrefersReducedMotion } from '../usePrefersReducedMotion'
import { styles } from './gooey-styles'

// SSR-safe useLayoutEffect: avoids React warning when rendering on the server.
// Falls back to useEffect during SSR (no DOM to measure anyway).
const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffectOrig : useEffect

export interface GooeyToastProps {
  title: string
  description?: ReactNode
  type: GooeyToastType
  action?: GooeyToastAction
  icon?: ReactNode
  phase: GooeyToastPhase
  classNames?: GooeyToastClassNames
  fillColor?: string
  borderColor?: string
  borderWidth?: number
  timing?: GooeyToastTimings
  preset?: AnimationPresetName
  spring?: boolean
  bounce?: number
  showProgress?: boolean
  showTimestamp?: boolean
  toastId?: string | number
}

const phaseIconMap: Record<Exclude<GooeyToastPhase, 'loading'>, FC<{ size?: number; className?: string }>> = {
  default: DefaultIcon,
  success: SuccessIcon,
  error: ErrorIcon,
  warning: WarningIcon,
  info: InfoIcon,
}

const titleColorMap: Record<GooeyToastPhase, string> = {
  loading: styles.titleLoading,
  default: styles.titleDefault,
  success: styles.titleSuccess,
  error: styles.titleError,
  warning: styles.titleWarning,
  info: styles.titleInfo,
}

const actionColorMap: Record<GooeyToastPhase, string> = {
  loading: styles.actionInfo,
  default: styles.actionDefault,
  success: styles.actionSuccess,
  error: styles.actionError,
  warning: styles.actionWarning,
  info: styles.actionInfo,
}

const progressColorMap: Record<GooeyToastPhase, string> = {
  loading: styles.progressInfo,
  default: styles.progressDefault,
  success: styles.progressSuccess,
  error: styles.progressError,
  warning: styles.progressWarning,
  info: styles.progressInfo,
}

const PH = 34 // pill height constant
const DEFAULT_DISPLAY_DURATION = 4000

// Squish spring config — scales mass with morph duration so feel stays consistent
// bounce 0.0 = heavily damped (subtle), 0.8 = very bouncy (dramatic)
const DEFAULT_EXPAND_DUR = 0.6
const DEFAULT_COLLAPSE_DUR = 0.9
function squishSpring(durationSec: number, defaultDur: number, bounce = 0.4) {
  const scale = durationSec / defaultDur
  // Map bounce (0-0.8) to stiffness (200-550) and damping (24-8)
  const stiffness = 200 + bounce * 437.5
  const damping = 24 - bounce * 20
  const mass = 0.7 * scale
  return { type: 'spring' as const, stiffness, damping, mass }
}

/**
 * Singleton MutationObserver registry — one observer per <ol> element shared
 * across all GooeyToast instances mounted under that list. Each toast registers
 * its own callback; the shared observer batches mutations via rAF and invokes
 * every registered callback once per frame.
 */
const observerRegistry = new Map<Element, {
  observer: MutationObserver
  callbacks: Set<() => void>
}>()

function registerSonnerObserver(ol: Element, callback: () => void) {
  let entry = observerRegistry.get(ol)
  if (!entry) {
    const callbacks = new Set<() => void>()
    const observeOptions: MutationObserverInit = {
      attributes: true,
      attributeFilter: ['style', 'data-visible'],
      subtree: true,
      childList: true,
    }
    // Correct offsets synchronously within the MutationObserver microtask
    // (which runs before paint) so Sonner's stale --offset is overwritten in
    // the same frame it was written. This eliminates the 1-frame stale-offset
    // flash that previously forced us to disable CSS transitions. With the
    // stale frame gone, transitions can stay enabled for smooth stack motion.
    //
    // We disconnect while applying our own style writes so they don't
    // re-trigger the observer (avoiding an infinite loop), then reconnect.
    const observer = new MutationObserver(() => {
      observer.disconnect()
      try {
        for (const cb of callbacks) {
          cb()
        }
      } finally {
        observer.observe(ol, observeOptions)
      }
    })
    observer.observe(ol, observeOptions)
    entry = { observer, callbacks }
    observerRegistry.set(ol, entry)
  }
  entry.callbacks.add(callback)
  return () => {
    entry!.callbacks.delete(callback)
    if (entry!.callbacks.size === 0) {
      entry!.observer.disconnect()
      observerRegistry.delete(ol)
    }
  }
}

/**
 * Recalculates CSS variables on all sibling toast <li> elements.
 *
 * Sonner measures height once on mount (~34px pill) and never re-measures
 * toast.custom() content. This function corrects --initial-height and --offset
 * so our morphing toasts stack correctly.
 *
 * Corrections are applied synchronously by the shared observer (before paint),
 * so CSS transitions on [data-expanded="true"] can stay enabled and animate
 * the stack movement smoothly without a stale-offset flash.
 *
 * DOM order: oldest toast at index 0, newest (front) at index n-1.
 * Front toast has --offset: 0; each older toast accumulates the heights of all
 * newer toasts plus the gap between them.
 */
function syncSonnerHeights(
  wrapperEl: HTMLElement | null,
  includeOffsets = false,
) {
  if (!wrapperEl) return
  const li = wrapperEl.closest('[data-sonner-toast]') as HTMLElement | null
  if (!li?.parentElement) return

  const ol = li.parentElement
  const toasts = Array.from(
    ol.querySelectorAll(':scope > [data-sonner-toast]')
  ) as HTMLElement[]

  if (toasts.length === 0) return

  // Measure actual rendered height of each toast's content wrapper.
  // Invisible toasts (beyond Sonner's visibleToasts limit) get height 0
  // so they don't create a gap in the layout or affect offset calculations.
  const heights = toasts.map(t => {
    if (t.getAttribute('data-visible') === 'false') return 0
    const content = t.firstElementChild as HTMLElement | null
    const h = content ? content.getBoundingClientRect().height : 0
    return h > 0 ? h : PH
  })

  // Always update --initial-height (the CSS height transition target).
  for (let i = 0; i < toasts.length; i++) {
    toasts[i].style.setProperty('--initial-height', `${heights[i]}px`)
  }

  if (!includeOffsets) {
    return
  }

  const gapStr = getComputedStyle(ol).getPropertyValue('--gap').trim()
  const gap = parseFloat(gapStr) || 14

  let runningOffset = 0
  for (let i = toasts.length - 1; i >= 0; i--) {
    // Invisible toasts: collapse to base position, don't contribute to offset
    if (toasts[i].getAttribute('data-visible') === 'false') {
      toasts[i].style.setProperty('--offset', '0px')
      continue
    }
    toasts[i].style.setProperty('--offset', `${runningOffset}px`)
    if (i > 0) {
      runningOffset += heights[i] + gap
    }
  }
}

/**
 * Simple last-result cache for pure functions called every animation frame.
 * Avoids recomputing the SVG path string when flush() is called multiple
 * times with identical parameters (e.g. syncSonnerHeights after morph update).
 */
function memoizePath(fn: (pw: number, bw: number, th: number, t: number) => string) {
  let lastArgs: [number, number, number, number] | null = null
  let lastResult = ''
  return (pw: number, bw: number, th: number, t: number): string => {
    if (lastArgs && lastArgs[0] === pw && lastArgs[1] === bw && lastArgs[2] === th && lastArgs[3] === t) {
      return lastResult
    }
    lastResult = fn(pw, bw, th, t)
    lastArgs = [pw, bw, th, t]
    return lastResult
  }
}

/**
 * Parametric morph path: pill lobe stays constant, body grows from underneath.
 * t=0 → pure pill, t=1 → full organic blob.
 */
function morphPathRaw(pw: number, bw: number, th: number, t: number): string {
  const pr = PH / 2
  const pillW = Math.min(pw, bw)

  const bodyH = PH + (th - PH) * t

  // Pure pill when t is zero or body too small for proper rounded corners
  if (t <= 0 || bodyH - PH < 8) {
    return [
      `M 0,${pr}`,
      `A ${pr},${pr} 0 0 1 ${pr},0`,
      `H ${pillW - pr}`,
      `A ${pr},${pr} 0 0 1 ${pillW},${pr}`,
      `A ${pr},${pr} 0 0 1 ${pillW - pr},${PH}`,
      `H ${pr}`,
      `A ${pr},${pr} 0 0 1 0,${pr}`,
      `Z`,
    ].join(' ')
  }

  const curve = 14 * t
  const cr = Math.min(16, (bodyH - PH) * 0.45)
  const bodyW = pillW + (bw - pillW) * t
  const bodyTop = PH - curve
  const qEndX = Math.min(pillW + curve, bodyW - cr)

  return [
    `M 0,${pr}`,
    `A ${pr},${pr} 0 0 1 ${pr},0`,
    `H ${pillW - pr}`,
    `A ${pr},${pr} 0 0 1 ${pillW},${pr}`,
    `L ${pillW},${bodyTop}`,
    `Q ${pillW},${bodyTop + curve} ${qEndX},${bodyTop + curve}`,
    `H ${bodyW - cr}`,
    `A ${cr},${cr} 0 0 1 ${bodyW},${bodyTop + curve + cr}`,
    `L ${bodyW},${bodyH - cr}`,
    `A ${cr},${cr} 0 0 1 ${bodyW - cr},${bodyH}`,
    `H ${cr}`,
    `A ${cr},${cr} 0 0 1 0,${bodyH - cr}`,
    `Z`,
  ].join(' ')
}

/**
 * Centered morph path: pill centered on top, body grows symmetrically below.
 * t=0 → pure pill (centered), t=1 → full blob with pill centered on top.
 */
function morphPathCenterRaw(pw: number, bw: number, th: number, t: number): string {
  const pr = PH / 2
  const pillW = Math.min(pw, bw)

  // Pill is ALWAYS centered at the final body width position
  const pillOffset = (bw - pillW) / 2

  // Pure pill when t is zero or body too small
  if (t <= 0 || PH + (th - PH) * t - PH < 8) {
    return [
      `M ${pillOffset},${pr}`,
      `A ${pr},${pr} 0 0 1 ${pillOffset + pr},0`,
      `H ${pillOffset + pillW - pr}`,
      `A ${pr},${pr} 0 0 1 ${pillOffset + pillW},${pr}`,
      `A ${pr},${pr} 0 0 1 ${pillOffset + pillW - pr},${PH}`,
      `H ${pillOffset + pr}`,
      `A ${pr},${pr} 0 0 1 ${pillOffset},${pr}`,
      `Z`,
    ].join(' ')
  }

  const bodyH = PH + (th - PH) * t
  const curve = 14 * t
  const cr = Math.min(16, (bodyH - PH) * 0.45)
  const bodyTop = PH - curve

  // Body grows symmetrically outward from pill center
  const bodyCenter = bw / 2
  const halfBodyW = (pillW / 2) + ((bw - pillW) / 2) * t  // grows from pillW/2 to bw/2
  const bodyLeft = bodyCenter - halfBodyW
  const bodyRight = bodyCenter + halfBodyW

  // Q curve endpoints: body edges meet pill edges with organic curves
  const qLeftX = Math.max(bodyLeft + cr, pillOffset - curve)
  const qRightX = Math.min(bodyRight - cr, pillOffset + pillW + curve)

  return [
    // Start at left side of pill
    `M ${pillOffset},${pr}`,
    // Pill top-left arc
    `A ${pr},${pr} 0 0 1 ${pillOffset + pr},0`,
    // Top edge of pill
    `H ${pillOffset + pillW - pr}`,
    // Pill top-right arc
    `A ${pr},${pr} 0 0 1 ${pillOffset + pillW},${pr}`,
    // Right side down to body junction
    `L ${pillOffset + pillW},${bodyTop}`,
    // Right organic curve from pill to body
    `Q ${pillOffset + pillW},${bodyTop + curve} ${qRightX},${bodyTop + curve}`,
    // Right side of body
    `H ${bodyRight - cr}`,
    // Body top-right corner
    `A ${cr},${cr} 0 0 1 ${bodyRight},${bodyTop + curve + cr}`,
    // Right edge down
    `L ${bodyRight},${bodyH - cr}`,
    // Body bottom-right corner
    `A ${cr},${cr} 0 0 1 ${bodyRight - cr},${bodyH}`,
    // Bottom edge
    `H ${bodyLeft + cr}`,
    // Body bottom-left corner
    `A ${cr},${cr} 0 0 1 ${bodyLeft},${bodyH - cr}`,
    // Left edge up
    `L ${bodyLeft},${bodyTop + curve + cr}`,
    // Body top-left corner
    `A ${cr},${cr} 0 0 1 ${bodyLeft + cr},${bodyTop + curve}`,
    // Left side of body
    `H ${qLeftX}`,
    // Left organic curve from body to pill
    `Q ${pillOffset},${bodyTop + curve} ${pillOffset},${bodyTop}`,
    // Close back to start
    `Z`,
  ].join(' ')
}

const morphPath = memoizePath(morphPathRaw)
const morphPathCenter = memoizePath(morphPathCenterRaw)

// Smooth easing curve for non-spring animations
const SMOOTH_EASE = [0.4, 0, 0.2, 1] as const

export const GooeyToast: FC<GooeyToastProps> = ({
  title,
  description,
  action,
  icon,
  phase,
  classNames,
  fillColor: fillColorProp,
  borderColor,
  borderWidth,
  timing,
  preset,
  spring: springProp,
  bounce: bounceProp,
  showTimestamp: showTimestampProp,
  showProgress: showProgressProp,
  toastId,
}) => {
  const theme = useSyncExternalStore(subscribeGooeyTheme, getGooeyTheme, getGooeyThemeServerSnapshot)
  const closeButtonSetting = getGooeyCloseButton()
  const showCloseButton = closeButtonSetting !== false
  const hasBorder = !!borderColor
  const position = getGooeyPosition()
  const dir = getGooeyDir()
  const posIsRight = position?.includes('right') ?? false
  const isCenter = position?.includes('center') ?? false
  // In RTL, left-positioned toasts visually behave like right-positioned ones and vice versa
  const isRight = dir === 'rtl' ? (isCenter ? false : !posIsRight) : posIsRight
  const prefersReducedMotion = usePrefersReducedMotion()
  // Explicit props > per-toast preset > global context values > defaults
  const presetConfig = preset ? animationPresets[preset] : undefined
  const useSpring = springProp ?? presetConfig?.spring ?? getGooeySpring()
  const bounceVal = bounceProp ?? presetConfig?.bounce ?? getGooeyBounce() ?? 0.4
  const showProgress = showProgressProp ?? getGooeyShowProgress()
  const showTimestamp = showTimestampProp ?? getGooeyShowTimestamp()

  // Action success override state
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)
  const [dismissing, setDismissing] = useState(false)
  // Counter to remount progress bar on re-expand, restarting the CSS animation
  const [progressKey, setProgressKey] = useState(0)
  const [hovered, setHovered] = useState(false)
  const hoveredRef = useRef(false)
  // Container-level hover (hovering anywhere in the Sonner stack, not just this toast)
  const containerHoveredRef = useRef(getContainerHovered())
  const [containerHovered, setContainerHoveredState] = useState(getContainerHovered())
  const collapsingRef = useRef(false)
  const preDismissRef = useRef(false)
  const collapseEndTime = useRef(0)
  const expandedDimsRef = useRef({ pw: 0, bw: 0, th: 0 })
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Effective values (overridden when action success is active)
  const effectiveTitle = actionSuccess ?? title
  const effectivePhase: GooeyToastPhase = actionSuccess ? 'success' : phase
  const effectiveDescription = actionSuccess ? undefined : description
  const effectiveAction = actionSuccess ? undefined : action

  const isLoading = effectivePhase === 'loading'
  const hasDescription = Boolean(effectiveDescription)
  const hasAction = Boolean(effectiveAction)
  const isExpanded = (hasDescription || hasAction) && !dismissing

  const [showBody, setShowBody] = useState(false)

  // DOM refs
  const wrapperRef = useRef<HTMLDivElement>(null)
  const pathRef = useRef<SVGPathElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  // Animation controllers
  const morphCtrl = useRef<ReturnType<typeof animate> | null>(null)
  const pillResizeCtrl = useRef<ReturnType<typeof animate> | null>(null)
  const headerSquishCtrl = useRef<ReturnType<typeof animate> | null>(null)

  // Animated state (not React state — avoids re-renders during animation)
  const morphTRef = useRef(0)
  const aDims = useRef({ pw: 0, bw: 0, th: 0 }) // animated dims
  const dimsRef = useRef({ pw: 0, bw: 0, th: 0 }) // latest measured dims

  // React state for dims (triggers effects)
  const [dims, setDims] = useState({ pw: 0, bw: 0, th: 0 })
  useEffect(() => { dimsRef.current = dims }, [dims])

  // Subscribe to container-level hover so timers pause when hovering anywhere in the stack
  useEffect(() => {
    return subscribeContainerHovered((h) => {
      containerHoveredRef.current = h
      setContainerHoveredState(h)
    })
  }, [])

  // Push current animated state to SVG DOM + constrain wrapper/content
  // NOTE: We intentionally do NOT set style.height on the wrapper.
  // The content's maxHeight constrains the rendered height, and letting
  // the wrapper derive its height naturally allows Sonner to accurately
  // measure the toast height for stacking/positioning.
  const flush = useCallback(() => {
    const { pw: p, bw: b, th: h } = aDims.current
    if (p <= 0 || b <= 0 || h <= 0) return
    // Clamp t to [0,1] — spring overshoot past 1 or below 0 must not
    // cause flush to toggle between constraint branches (jitter).
    const t = Math.max(0, Math.min(1, morphTRef.current))
    // Read position and dir fresh each call so flush never uses a stale value
    const pos = getGooeyPosition()
    const d = getGooeyDir()
    const centerPos = pos?.includes('center') ?? false
    const posRight = pos?.includes('right') ?? false
    // In RTL, flip left/right visual behavior (center stays the same)
    const rightSide = d === 'rtl' ? (centerPos ? false : !posRight) : posRight
    // Center positions: always use morphPathCenter so pill stays at fixed center offset
    // (switching to morphPath at t=0 causes a frame where content jumps left)
    if (centerPos) {
      const centerBw = Math.max(dimsRef.current.bw, expandedDimsRef.current.bw, p)
      pathRef.current?.setAttribute('d', morphPathCenter(p, centerBw, h, t))
    } else {
      pathRef.current?.setAttribute('d', morphPath(p, b, h, t))
    }

    if (t >= 1) {
      // Fully expanded: clear all constraints
      if (wrapperRef.current) {
        wrapperRef.current.style.width = ''
      }
      if (contentRef.current) {
        contentRef.current.style.width = ''
        contentRef.current.style.overflow = ''
        contentRef.current.style.maxHeight = ''
        contentRef.current.style.clipPath = ''
      }
    } else if (t > 0) {
      // Morphing: lock content at final target width + clip-path (prevents text reflow)
      const targetBw = dimsRef.current.bw
      const targetTh = dimsRef.current.th
      const pillW = Math.min(p, b)
      const currentW = pillW + (b - pillW) * t
      const currentH = PH + (targetTh - PH) * t
      // Center: use stable full width (dimsRef may shrink during collapse)
      const centerFullW = centerPos ? Math.max(dimsRef.current.bw, expandedDimsRef.current.bw, p) : 0
      if (wrapperRef.current) {
        wrapperRef.current.style.width = (centerPos ? centerFullW : currentW) + 'px'
      }
      if (contentRef.current) {
        // Center: content width = wrapper width so textAlign:center keeps header aligned with SVG pill
        contentRef.current.style.width = (centerPos ? centerFullW : targetBw) + 'px'
        contentRef.current.style.overflow = 'hidden'
        contentRef.current.style.maxHeight = currentH + 'px'
        if (centerPos) {
          const clip = (centerFullW - currentW) / 2
          contentRef.current.style.clipPath = `inset(0 ${clip}px 0 ${clip}px)`
        } else {
          const clip = targetBw - currentW
          contentRef.current.style.clipPath = rightSide
            ? `inset(0 0 0 ${clip}px)`
            : `inset(0 ${clip}px 0 0)`
        }
      }
    } else {
      // Compact: constrain to pill dimensions
      const pillW = Math.min(p, b)
      if (wrapperRef.current) {
        // Center: keep body width so pill SVG offset stays consistent (no frame jump)
        const centerBw = centerPos ? Math.max(dimsRef.current.bw, expandedDimsRef.current.bw, p) : pillW
        wrapperRef.current.style.width = centerBw + 'px'
      }
      if (contentRef.current) {
        if (centerPos) {
          // Keep content locked at body width with symmetric clip to match SVG pill position
          const centerBwVal = Math.max(dimsRef.current.bw, expandedDimsRef.current.bw, p)
          contentRef.current.style.width = centerBwVal + 'px'
          const clip = (centerBwVal - pillW) / 2
          contentRef.current.style.clipPath = `inset(0 ${clip}px 0 ${clip}px)`
        } else {
          contentRef.current.style.width = ''
          contentRef.current.style.clipPath = ''
        }
        contentRef.current.style.overflow = 'hidden'
        contentRef.current.style.maxHeight = PH + 'px'
      }
    }
  }, [])

  // Measure content dimensions (clear all constraints first for accurate reading)
  const measure = useCallback(() => {
    if (!headerRef.current || !contentRef.current) return
    const wr = wrapperRef.current
    const savedW = wr?.style.width ?? ''
    const savedOv = contentRef.current.style.overflow
    const savedMH = contentRef.current.style.maxHeight
    const savedCW = contentRef.current.style.width
    if (wr) { wr.style.width = '' }
    contentRef.current.style.overflow = ''
    contentRef.current.style.maxHeight = ''
    contentRef.current.style.width = ''

    const cs = getComputedStyle(contentRef.current)
    const paddingX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight)
    const pw = headerRef.current.offsetWidth + paddingX
    const bw = contentRef.current.offsetWidth
    const th = contentRef.current.offsetHeight

    if (wr) { wr.style.width = savedW }
    contentRef.current.style.overflow = savedOv
    contentRef.current.style.maxHeight = savedMH
    contentRef.current.style.width = savedCW

    dimsRef.current = { pw, bw, th }
    setDims({ pw, bw, th })
  }, [])

  // Measure on prop changes (useLayoutEffect prevents flash of unconstrained content)
  useIsomorphicLayoutEffect(() => {
    measure()
    const t = setTimeout(measure, 100)
    return () => clearTimeout(t)
  }, [effectiveTitle, effectivePhase, isExpanded, showBody, effectiveDescription, effectiveAction, measure])

  useEffect(() => {
    if (!contentRef.current) return
    const ro = new ResizeObserver(measure)
    ro.observe(contentRef.current)
    return () => ro.disconnect()
  }, [measure])

  const { pw, bw, th } = dims
  const hasDims = pw > 0 && bw > 0 && th > 0

  // Squish animation controller (shared between landing + blob squish)
  const blobSquishCtrl = useRef<ReturnType<typeof animate> | null>(null)

  // Landing squish: single smooth boing — spring scales with user timing
  const expandDur = DEFAULT_EXPAND_DUR
  const collapseDur = DEFAULT_COLLAPSE_DUR
  const lastSquishTime = useRef(0)
  const triggerLandingSquish = useCallback((phase: 'expand' | 'collapse' | 'mount' = 'mount') => {
    if (!wrapperRef.current || prefersReducedMotion) return
    // Skip squish entirely when spring is disabled
    if (!useSpring) return
    const now = Date.now()
    if (now - lastSquishTime.current < 300) return
    lastSquishTime.current = now
    blobSquishCtrl.current?.stop()
    const el = wrapperRef.current
    const springConfig = phase === 'collapse'
      ? squishSpring(collapseDur, DEFAULT_COLLAPSE_DUR, bounceVal)
      : squishSpring(expandDur, DEFAULT_EXPAND_DUR, bounceVal)
    // Softer squish on collapse — blob is wider so same % looks more drastic
    // Scale squish intensity with bounce (0.05=subtle, 0.8=dramatic)
    const bScale = bounceVal / 0.4
    const compressY = (phase === 'collapse' ? 0.035 : 0.12) * bScale
    const expandX = (phase === 'collapse' ? 0.018 : 0.06) * bScale
    blobSquishCtrl.current = animate(0, 1, {
      ...springConfig,
      onUpdate: (v) => {
        const intensity = Math.sin(v * Math.PI)
        const sy = 1 - compressY * intensity
        const sx = 1 + expandX * intensity
        const mirror = el.style.transform?.includes('scaleX(-1)') ? 'scaleX(-1) ' : ''
        // Anchor squish at pill (top of blob) so body feels like it expands from pill center
        el.style.transformOrigin = 'center top'
        el.style.transform = mirror + `scaleX(${sx}) scaleY(${sy})`
      },
      onComplete: () => {
        const right = el.style.transform?.includes('scaleX(-1)')
        el.style.transform = right ? 'scaleX(-1)' : ''
        el.style.transformOrigin = ''
      },
    })
  }, [prefersReducedMotion, expandDur, collapseDur, useSpring, bounceVal])

  // Handle dims changes: pill resize animation (compact) or direct update (expanded)
  useIsomorphicLayoutEffect(() => {
    if (!hasDims || collapsingRef.current) return

    const prev = { ...aDims.current }
    const target = { pw, bw, th }

    // First render — set immediately
    if (prev.bw <= 0) {
      aDims.current = target
      flush()
      return
    }

    // During morph animation — just update target dims, morph callback reads them
    if (morphTRef.current > 0 && morphTRef.current < 1) {
      aDims.current = target
      flush()
      return
    }

    // Expanded and settled (morph done) — update immediately
    if (showBody) {
      aDims.current = target
      flush()
      return
    }

    // Compact mode: animate pill resize smoothly
    if (prev.bw === target.bw && prev.pw === target.pw && prev.th === target.th) return

    if (prefersReducedMotion) {
      aDims.current = target
      flush()
      return
    }

    pillResizeCtrl.current?.stop()
    // Fire vertical squish alongside the horizontal resize
    // Skip if recently collapsed or about to expand (promise resolve/reject)
    if (Date.now() - collapseEndTime.current > 500 && !isExpanded) {
      triggerLandingSquish('expand')
    }
    const pillResizeTransition = useSpring
      ? { type: 'spring' as const, duration: 0.5, bounce: bounceVal * 0.875 }
      : { duration: 0.4, ease: SMOOTH_EASE }
    pillResizeCtrl.current = animate(0, 1, {
      ...pillResizeTransition,
      onUpdate: (t) => {
        aDims.current = {
          pw: prev.pw + (target.pw - prev.pw) * t,
          bw: prev.bw + (target.bw - prev.bw) * t,
          th: prev.th + (target.th - prev.th) * t,
        }
        flush()
      },
    })
  }, [pw, bw, th, hasDims, showBody, flush, prefersReducedMotion, triggerLandingSquish, useSpring])

  // Squish on entry: only for simple toasts (no body text) — expanded toasts get squish from showBody
  const squishDelayMs = 45
  const mountSquished = useRef(false)
  useEffect(() => {
    if (hasDims && !mountSquished.current && !isExpanded) {
      mountSquished.current = true
      const t = setTimeout(triggerLandingSquish, squishDelayMs)
      return () => clearTimeout(t)
    }
  }, [hasDims, squishDelayMs, triggerLandingSquish])

  // Squish on expand (showBody false→true) — collapse squish is fired directly in morph code
  // Skip squish on hover re-expand (hovered + was dismissing) to avoid jarring bounce
  const prevShowBody = useRef(false)
  useIsomorphicLayoutEffect(() => {
    if (!prevShowBody.current && showBody && !hoveredRef.current) {
      // Small delay after morph starts for more satisfying "settle then bounce" feel
      const t = setTimeout(() => triggerLandingSquish('expand'), 80)
      return () => clearTimeout(t)
    }
    prevShowBody.current = showBody
  }, [showBody, triggerLandingSquish])

  // Error shake: quick horizontal shake when phase transitions to error (not during dismiss)
  const shakeCtrl = useRef<ReturnType<typeof animate> | null>(null)
  const prevPhase = useRef(phase)
  useEffect(() => {
    if (phase === 'error' && prevPhase.current !== 'error' && !dismissing && wrapperRef.current && !prefersReducedMotion) {
      shakeCtrl.current?.stop()
      const el = wrapperRef.current
      const mirror = el.style.transform?.includes('scaleX(-1)') ? 'scaleX(-1) ' : ''
      shakeCtrl.current = animate(0, 1, {
        duration: 0.4,
        ease: 'easeOut',
        onUpdate: (v) => {
          const decay = 1 - v
          const shake = Math.sin(v * Math.PI * 6) * decay * 3
          el.style.transform = mirror + `translateX(${shake}px)`
        },
        onComplete: () => {
          el.style.transform = mirror.trim() || ''
        },
      })
    }
    prevPhase.current = phase
    return () => { shakeCtrl.current?.stop() }
  }, [phase, dismissing, prefersReducedMotion])

  // Phase 1: expand (delay showBody) or collapse (reverse morph)
  useEffect(() => {
    if (isExpanded) {
      const delay = prefersReducedMotion ? 0 : (330)
      const t1 = setTimeout(() => setShowBody(true), delay)
      return () => clearTimeout(t1)
    }

    morphCtrl.current?.stop()
    pillResizeCtrl.current?.stop()

    // Reverse morph if currently expanded
    if (morphTRef.current > 0) {
      // Compute target compact pill dims from current header content
      const csPad = contentRef.current ? getComputedStyle(contentRef.current) : null
      const padX = csPad ? parseFloat(csPad.paddingLeft) + parseFloat(csPad.paddingRight) : 20
      const targetPw = headerRef.current ? headerRef.current.offsetWidth + padX : aDims.current.pw
      const targetDims = { pw: targetPw, bw: targetPw, th: PH }

      if (prefersReducedMotion) {
        morphTRef.current = 0
        collapsingRef.current = false
        preDismissRef.current = false
        setShowBody(false)
        aDims.current = { ...targetDims }
        flush()
        return
      }

      const savedDims = expandedDimsRef.current.bw > 0
        ? { ...expandedDimsRef.current }
        : { ...aDims.current }

      const isPreDismiss = preDismissRef.current
      const collapseDur = 0.9
      // Use easing when spring is disabled or during pre-dismiss
      const collapseTransition = (isPreDismiss || !useSpring)
        ? { duration: collapseDur, ease: SMOOTH_EASE }
        : { type: 'spring' as const, duration: collapseDur, bounce: bounceVal * 0.875 }

      // Fire squish immediately as collapse begins — don't wait for morph to finish
      triggerLandingSquish('collapse')

      morphCtrl.current = animate(morphTRef.current, 0, {
        ...collapseTransition,
        onUpdate: (t) => {
          morphTRef.current = t
          aDims.current = {
            pw: targetDims.pw + (savedDims.pw - targetDims.pw) * t,
            bw: targetDims.bw + (savedDims.bw - targetDims.bw) * t,
            th: targetDims.th + (savedDims.th - targetDims.th) * t,
          }
          flush()
          syncSonnerHeights(wrapperRef.current, true)
        },
        onComplete: () => {
          morphTRef.current = 0
          collapsingRef.current = false
          preDismissRef.current = false
          collapseEndTime.current = Date.now()
          aDims.current = { ...targetDims }
          flush()
          syncSonnerHeights(wrapperRef.current, true)
          setShowBody(false)
        },
      })
      return () => { morphCtrl.current?.stop() }
    }

    setShowBody(false)
    morphTRef.current = 0
    flush()
  }, [isExpanded, flush, prefersReducedMotion, useSpring, triggerLandingSquish])

  // Pre-dismiss collapse: shrink back to pill before Sonner removes the toast
  // Hover pauses the timer. On unhover, timer restarts with remaining time.
  const remainingRef = useRef<number | null>(null)
  const timerStartRef = useRef(0)
  // Time the expanded body stays open before the pre-dismiss collapse starts.
  // The progress bar runs over exactly this window, starting when the body opens.
  const fullDelay = (timing?.displayDuration ?? DEFAULT_DISPLAY_DURATION)
    - (prefersReducedMotion ? 0 : 330)
    - (prefersReducedMotion ? 10 : 900)
  useEffect(() => {
    if (!showBody || actionSuccess || dismissing) return
    if (fullDelay <= 0) return

    // Don't start timer while hovered (individual or container) — pause and resume on unhover
    if (hoveredRef.current || containerHoveredRef.current) return

    const delay = remainingRef.current ?? fullDelay
    timerStartRef.current = Date.now()

    const timer = setTimeout(() => {
      // Guard: hover refs update synchronously (before React re-renders),
      // so check them to avoid starting collapse when user just hovered.
      if (hoveredRef.current || containerHoveredRef.current) {
        const elapsed = Date.now() - timerStartRef.current
        remainingRef.current = Math.max(0, delay - elapsed)
        return
      }
      remainingRef.current = null
      expandedDimsRef.current = { ...aDims.current }
      collapsingRef.current = true
      preDismissRef.current = true
      setDismissing(true)
    }, delay)
    dismissTimerRef.current = timer

    return () => {
      clearTimeout(timer)
      // Save remaining time when cleaning up (e.g. hover started)
      const elapsed = Date.now() - timerStartRef.current
      const remaining = delay - elapsed
      if (remaining > 0 && (hoveredRef.current || containerHoveredRef.current)) {
        remainingRef.current = remaining
      }
    }
  }, [showBody, actionSuccess, dismissing, prefersReducedMotion, hovered, containerHovered])

  // Re-expand on hover: if collapsed/collapsing and user hovers (individual or container), reverse it
  const canExpand = hasDescription || hasAction
  const reExpandingRef = useRef(false)
  useEffect(() => {
    if ((!hovered && !containerHovered) || !canExpand || !dismissing) return
    // Stop collapse morph, reset state
    morphCtrl.current?.stop()
    collapsingRef.current = false
    preDismissRef.current = false
    remainingRef.current = null
    reExpandingRef.current = true
    setDismissing(false)
    setShowBody(true)
    // Remount the progress bar so the CSS animation restarts from full width
    if (showProgress) setProgressKey(k => k + 1)

    // Directly drive the expand morph from current position
    // Can't rely on Phase 2 because showBody might already be true (mid-collapse hover)
    const currentT = morphTRef.current
    const startDims = { ...aDims.current }
    const morphExpandTransition = useSpring
      ? { type: 'spring' as const, duration: 0.9, bounce: bounceVal }
      : { duration: 0.6, ease: SMOOTH_EASE }

    // Wait one frame for measure to update dimsRef with expanded content
    requestAnimationFrame(() => {
      morphCtrl.current = animate(currentT, 1, {
        ...morphExpandTransition,
        onUpdate: (t) => {
          morphTRef.current = t
          const target = dimsRef.current
          aDims.current = {
            pw: startDims.pw + (target.pw - startDims.pw) * t,
            bw: startDims.bw + (target.bw - startDims.bw) * t,
            th: startDims.th + (target.th - startDims.th) * t,
          }
          flush()
          // Keep offsets in sync as heights grow so toasts don't overlap mid-morph.
          // During initial expand, expandObs handles this, but during re-expand the
          // heights start at mid-collapse values and offsets go stale without this.
          syncSonnerHeights(wrapperRef.current, true)
        },
        onComplete: () => {
          morphTRef.current = 1
          aDims.current = { ...dimsRef.current }
          reExpandingRef.current = false
          flush()
          syncSonnerHeights(wrapperRef.current, true)
        },
      })
    })

    return () => { morphCtrl.current?.stop() }
  }, [hovered, containerHovered, dismissing, canExpand])

  // Dismiss from Sonner after collapse completes.
  // Re-expand calls setDismissing(false) → effect cleanup cancels this timer.
  // But there's a narrow race: user hovers AFTER showBody=false but BEFORE
  // React processes the re-expand state update. Guard with refs (synchronously
  // set on mouseenter) so dismiss is always skipped if cursor is on the stack.
  useEffect(() => {
    if (!toastId || !dismissing || showBody) return
    const t = setTimeout(() => {
      if (!hoveredRef.current && !containerHoveredRef.current) {
        sonnerToast.dismiss(toastId)
      }
    }, 800)
    return () => clearTimeout(t)
  }, [dismissing, showBody, toastId])

  // Dismiss after action success morph-back completes
  useEffect(() => {
    if (!toastId || !actionSuccess || showBody) return
    const t = setTimeout(() => sonnerToast.dismiss(toastId), 1200)
    return () => clearTimeout(t)
  }, [toastId, actionSuccess, showBody])

  // Phase 2: morph from pill → blob
  useEffect(() => {
    // Skip if re-expand is driving the morph
    if (reExpandingRef.current) return
    if (!showBody) {
      morphTRef.current = 0
      morphCtrl.current?.stop()
      flush()
      return
    }

    if (prefersReducedMotion) {
      pillResizeCtrl.current?.stop()
      morphCtrl.current?.stop()
      morphTRef.current = 1
      aDims.current = { ...dimsRef.current }
      flush()
      syncSonnerHeights(wrapperRef.current, true)
      return
    }

    const raf = requestAnimationFrame(() => {
      pillResizeCtrl.current?.stop()
      morphCtrl.current?.stop()
      // Capture current animated dims so we interpolate smoothly from
      // wherever the pill resize left off instead of snapping to target.
      const startDims = { ...aDims.current }
      const morphExpandTransition = useSpring
        ? { type: 'spring' as const, duration: 0.9, bounce: bounceVal }
        : { duration: 0.6, ease: SMOOTH_EASE }
      morphCtrl.current = animate(0, 1, {
        ...morphExpandTransition,
        onUpdate: (t) => {
          morphTRef.current = t
          const target = dimsRef.current
          aDims.current = {
            pw: startDims.pw + (target.pw - startDims.pw) * t,
            bw: startDims.bw + (target.bw - startDims.bw) * t,
            th: startDims.th + (target.th - startDims.th) * t,
          }
          flush()
          syncSonnerHeights(wrapperRef.current, true)
        },
        onComplete: () => {
          morphTRef.current = 1
          aDims.current = { ...dimsRef.current }
          flush()
          syncSonnerHeights(wrapperRef.current, true)
        },
      })
    })

    return () => {
      cancelAnimationFrame(raf)
      morphCtrl.current?.stop()
    }
  }, [showBody, flush, prefersReducedMotion, useSpring])

  // Header elastic squish: spring down when expanding, spring back once on collapse/dismiss
  const headerSquished = useRef(false)
  useEffect(() => {
    if (!headerRef.current || prefersReducedMotion) return
    headerSquishCtrl.current?.stop()
    const el = headerRef.current

    if (showBody && !dismissing && !actionSuccess) {
      // Skip header squish when spring is disabled
      if (!useSpring) return
      // Squish down with elastic spring — scaled to expand timing
      headerSquished.current = true
      headerSquishCtrl.current = animate(0, 1, {
        ...squishSpring(expandDur, DEFAULT_EXPAND_DUR, bounceVal),
        onUpdate: (v) => {
          const scale = 1 - 0.05 * v
          const pushY = v * 1
          el.style.transform = `scale(${scale}) translateY(${pushY}px)`
        },
      })
    } else if (headerSquished.current) {
      // Spring back to normal — match morph transition type
      headerSquished.current = false
      // Use easing when spring is disabled or during pre-dismiss
      const isSpringCollapse = !preDismissRef.current && useSpring
      const transition = isSpringCollapse
        ? squishSpring(collapseDur, DEFAULT_COLLAPSE_DUR, bounceVal)
        : { duration: collapseDur * 0.5, ease: SMOOTH_EASE }
      headerSquishCtrl.current = animate(1, 0, {
        ...transition,
        onUpdate: (v) => {
          const scale = 1 - 0.05 * v
          const pushY = v * 1
          el.style.transform = `scale(${scale}) translateY(${pushY}px)`
        },
        onComplete: () => {
          el.style.transform = ''
        },
      })
    }

    return () => { headerSquishCtrl.current?.stop() }
  }, [showBody, dismissing, actionSuccess, prefersReducedMotion, expandDur, collapseDur, useSpring])

  // Keep Sonner's toast stacking in sync when it re-renders (e.g. hover expand/collapse).
  // Sonner overwrites --offset/--initial-height with stale values from its React state,
  // so we observe style mutations on the toast list and re-apply correct heights.
  // Uses a shared singleton observer per <ol> to avoid N observers for N toasts.
  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return
    const ol = wrapper.closest('[data-sonner-toast]')?.parentElement
    if (!ol) return

    // Synchronous sync: corrects --initial-height AND --offset every time Sonner
    // overwrites them with stale values from its React state. The shared observer
    // runs the correction before paint, so CSS transitions stay enabled and the
    // stack movement animates smoothly without a stale-offset overlap flash.
    const unregister = registerSonnerObserver(ol, () => {
      syncSonnerHeights(wrapper, true)
    })

    // Immediate sync when Sonner expands the stack (data-expanded → true).
    // MutationObserver callbacks are microtasks — they run before the next paint,
    // so --offset is corrected before the first CSS transition frame renders.
    const expandObs = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (
          m.type === 'attributes' &&
          m.attributeName === 'data-expanded' &&
          (m.target as HTMLElement).getAttribute('data-expanded') === 'true'
        ) {
          syncSonnerHeights(wrapper, true)
          break
        }
      }
    })
    expandObs.observe(ol, {
      attributes: true,
      attributeFilter: ['data-expanded'],
      subtree: true,
    })

    return () => {
      unregister()
      expandObs.disconnect()
    }
  }, [])

  // Action button handler
  const handleActionClick = useCallback(() => {
    if (!effectiveAction) return
    if (effectiveAction.successLabel) {
      // Save expanded dims synchronously before onClick (which may throw)
      expandedDimsRef.current = { ...aDims.current }
      collapsingRef.current = true
      setActionSuccess(effectiveAction.successLabel)
    }
    try { effectiveAction.onClick() } catch { /* onClick errors shouldn't block morph-back */ }
  }, [effectiveAction])

  // ---------------------------------------------------------------------------
  // Swipe-to-dismiss touch gesture
  // ---------------------------------------------------------------------------
  const SWIPE_THRESHOLD = 100
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null)
  const [swipeOffsetX, setSwipeOffsetX] = useState(0)
  const isSwipingRef = useRef(false)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!getGooeySwipeToDismiss()) return
    const touch = e.touches[0]
    swipeStartRef.current = { x: touch.clientX, y: touch.clientY }
    isSwipingRef.current = false
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!swipeStartRef.current || !getGooeySwipeToDismiss()) return
    const touch = e.touches[0]
    const dx = touch.clientX - swipeStartRef.current.x
    const dy = touch.clientY - swipeStartRef.current.y

    // If vertical movement is dominant, cancel swipe tracking
    if (!isSwipingRef.current && Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 10) {
      swipeStartRef.current = null
      return
    }

    // Lock into horizontal swipe once threshold is met
    if (!isSwipingRef.current && Math.abs(dx) > 10) {
      isSwipingRef.current = true
    }

    if (isSwipingRef.current) {
      setSwipeOffsetX(dx)
    }
  }, [])

  const handleTouchEnd = useCallback(() => {
    if (!getGooeySwipeToDismiss()) {
      swipeStartRef.current = null
      return
    }
    if (isSwipingRef.current && Math.abs(swipeOffsetX) >= SWIPE_THRESHOLD && toastId) {
      sonnerToast.dismiss(toastId)
    }
    swipeStartRef.current = null
    isSwipingRef.current = false
    setSwipeOffsetX(0)
  }, [swipeOffsetX, toastId])

  // Compute swipe visual feedback
  const swipeOpacity = swipeOffsetX !== 0
    ? Math.max(0, 1 - Math.abs(swipeOffsetX) / (SWIPE_THRESHOLD * 1.5))
    : 1
  const swipeTranslate = swipeOffsetX !== 0 ? `translateX(${swipeOffsetX}px)` : ''

  const renderIcon = () => {
    if (!actionSuccess && icon) return icon
    if (isLoading) return <SpinnerIcon size={18} className={styles.spinnerSpin} />
    const IconComponent = phaseIconMap[effectivePhase]
    return <IconComponent size={18} />
  }

  const iconTransition = useMemo(
    () => prefersReducedMotion ? { duration: 0.01 } : { duration: 0.2 },
    [prefersReducedMotion],
  )
  const iconEl = (
    <div className={`${styles.iconWrapper}${classNames?.icon ? ` ${classNames.icon}` : ''}`}>
      <AnimatePresence mode="wait">
        <motion.div
          key={isLoading ? 'spinner' : effectivePhase}
          initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={iconTransition}
        >
          {renderIcon()}
        </motion.div>
      </AnimatePresence>
    </div>
  )
  const titleEl = (
    <span className={`${styles.title}${classNames?.title ? ` ${classNames.title}` : ''}`}>{effectiveTitle}</span>
  )

  // Capture creation time on mount for the timestamp display
  const createdAtRef = useRef(new Date())
  const timestampStr = useMemo(
    () => createdAtRef.current.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', second: '2-digit' }),
    [],
  )

  const iconAndTitle = (
    <>{iconEl}{titleEl}</>
  )

  // Memoize base position style so a new object isn't created every render
  const basePositionStyle = useMemo<React.CSSProperties>(
    () => {
      const base: React.CSSProperties = isCenter ? { margin: '0 auto' } : isRight ? { marginLeft: 'auto', transform: 'scaleX(-1)' } : {}
      // Per-toast color props set the public CSS vars inline on the wrapper, so they
      // win over any --gooey-* a consumer declares higher up in the tree.
      const vars: Record<string, string> = {}
      if (fillColorProp) vars['--gooey-fill'] = fillColorProp
      if (borderColor) {
        vars['--gooey-border'] = borderColor
        vars['--gooey-border-width'] = `${borderWidth ?? 1.5}px`
      }
      return { ...base, ...vars } as React.CSSProperties
    },
    [isCenter, isRight, fillColorProp, borderColor, borderWidth],
  )

  // Build wrapper style: merge position styles with swipe transform/opacity
  const wrapperStyle = useMemo<React.CSSProperties | undefined>(() => {
    if (swipeTranslate) {
      return {
        ...basePositionStyle,
        transform: (basePositionStyle.transform ? basePositionStyle.transform + ' ' : '') + swipeTranslate,
        opacity: swipeOpacity,
        transition: 'none',
      }
    }
    return Object.keys(basePositionStyle).length > 0 ? basePositionStyle : undefined
  }, [basePositionStyle, swipeTranslate, swipeOpacity])

  const contentStyle = useMemo(
    () => isCenter ? { textAlign: 'center' } as const : isRight ? { transform: 'scaleX(-1)', textAlign: 'right' } as const : { textAlign: 'left' } as const,
    [isCenter, isRight],
  )

  const handleMouseEnter = useCallback(() => { hoveredRef.current = true; setHovered(true) }, [])
  const handleMouseLeave = useCallback(() => { hoveredRef.current = false; setHovered(false) }, [])

  return (
    <div ref={wrapperRef} className={`${styles.wrapper}${classNames?.wrapper ? ` ${classNames.wrapper}` : ''}`} style={wrapperStyle} role={effectivePhase === 'error' || effectivePhase === 'warning' ? 'alert' : 'status'} aria-live={effectivePhase === 'error' || effectivePhase === 'warning' ? 'assertive' : 'polite'} aria-atomic="true" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} data-center={isCenter || undefined} data-theme={theme}>
      {/* SVG background — overflow visible, path controls shape */}
      <svg
        className={styles.blobSvg}
        aria-hidden
      >
        <path
          ref={pathRef}
          className={styles.blobPath}
        />
      </svg>

      {/* Close button — shown on hover when enabled via GooeyToaster closeButton prop */}
      {showCloseButton && effectivePhase !== 'loading' && (
        <button
          className={`${styles.closeButton}${(isRight ? closeButtonSetting !== 'top-right' : closeButtonSetting === 'top-right') ? ` ${styles.closeButtonRight}` : ''}`}
          aria-label="Close toast"
          type="button"
          style={{
            ...(hasBorder ? { boxShadow: 'none' } : {}),
            ...(isCenter && closeButtonSetting !== 'top-right' ? { top: 6, left: -1 } : {}),
          }}
          onClick={(e) => {
            e.stopPropagation()
            const id = toastId
            if (id != null) sonnerToast.dismiss(id)
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}

      {/* Content — un-flip so text reads normally */}
      <div
        ref={contentRef}
        className={`${styles.content} ${showBody ? styles.contentExpanded : styles.contentCompact}${classNames?.content ? ` ${classNames.content}` : ''}`}
        style={contentStyle}
      >
        <div ref={headerRef} className={`${styles.header} ${titleColorMap[effectivePhase]}${classNames?.header ? ` ${classNames.header}` : ''}`}>
          {iconAndTitle}
          {/* No-body toasts: timestamp inline after the title (hidden after action success) */}
          {!hasDescription && !hasAction && !actionSuccess && showTimestamp && <span className={styles.timestamp}>{timestampStr}</span>}
        </div>

        <AnimatePresence>
          {showBody && hasDescription && !dismissing && (
            <motion.div
              key="description"
              className={`${styles.description}${classNames?.description ? ` ${classNames.description}` : ''}`}
              style={{ textAlign: 'left' }}
              initial={prefersReducedMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={prefersReducedMotion ? { duration: 0.01 } : { duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>{effectiveDescription}</div>
                {showTimestamp && <span className={styles.timestamp}>{timestampStr}</span>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Body toasts without description: timestamp on its own line */}
        <AnimatePresence>
          {showBody && !hasDescription && hasAction && !dismissing && showTimestamp && (
            <motion.div
              key="timestamp-body"
              className={styles.timestamp}
              style={{ textAlign: 'right', marginTop: 8, paddingLeft: 0 }}
              initial={prefersReducedMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={prefersReducedMotion ? { duration: 0.01 } : { duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            >
              {timestampStr}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showBody && hasAction && effectiveAction && !dismissing && (
            <motion.div
              key="action"
              className={`${styles.actionWrapper}${classNames?.actionWrapper ? ` ${classNames.actionWrapper}` : ''}`}
              initial={prefersReducedMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={prefersReducedMotion ? { duration: 0.01 } : { duration: 0.35, ease: [0.4, 0, 0.2, 1], delay: 0.1 }}
            >
              <button
                className={`${styles.actionButton} ${actionColorMap[effectivePhase]}${classNames?.actionButton ? ` ${classNames.actionButton}` : ''}`}
                onClick={handleActionClick}
                type="button"
                aria-label={effectiveAction.label}
              >
                {effectiveAction.label}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mounted only once the body has expanded, so the shrink animation starts
            when the toast opens and runs in sync with the dismiss timer. */}
        {showProgress && showBody && !actionSuccess && fullDelay > 0 && (
          <div
            key={progressKey}
            className={`${styles.progressWrapper}${hovered || containerHovered ? ` ${styles.progressPaused}` : ''}`}
            data-testid="gooey-progress"
          >
            <div
              className={`${styles.progressBar} ${progressColorMap[effectivePhase]}`}
              style={{ '--gooey-progress-duration': `${fullDelay}ms` } as React.CSSProperties}
            />
          </div>
        )}
      </div>
    </div>
  )
}
