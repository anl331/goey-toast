import { useState, useEffect, useRef, type ReactNode } from 'react'
import { toast } from 'sonner'
import { GooeyToast } from './components/GooeyToast'
import { ToastErrorBoundary } from './components/ToastErrorBoundary'
import { getGooeyVisibleToasts, getGooeyMaxQueue, getGooeyQueueOverflow, announce, type AriaLivePoliteness } from './context'
import { playGooeySound } from './sound'
import type {
  GooeyToastOptions,
  GooeyPromiseData,
  GooeyToastPhase,
  GooeyToastType,
  GooeySoundOption,
  GooeyToastAction,
  GooeyToastClassNames,
  GooeyToastTimings,
  GooeyToastUpdateOptions,
  DismissFilter,
} from './types'
import type { AnimationPresetName } from './presets'

const DEFAULT_EXPANDED_DURATION = 4000

function getAnnouncePoliteness(type: GooeyToastType): AriaLivePoliteness {
  return type === 'error' || type === 'warning' ? 'assertive' : 'polite'
}

function buildAnnouncementMessage(title: string, description?: ReactNode): string {
  if (!description || typeof description !== 'string') return title
  return `${title}: ${description}`
}

// ---------------------------------------------------------------------------
// Toast queue — limits concurrent toasts to `visibleToasts` (default 3).
// Excess toasts wait in a FIFO queue and fire when a slot opens.
// ---------------------------------------------------------------------------
const _activeIds = new Map<string | number, GooeyToastType>()
const _queue: Array<{ id: string | number; type: GooeyToastType; create: () => void }> = []

// ---------------------------------------------------------------------------
// Callback registry — stores onDismiss/onAutoClose per toast ID so they can
// be invoked when the toast unmounts. The _autoCloseFlags set tracks toasts
// whose dismiss was triggered by the auto-close timer (not manual action).
// ---------------------------------------------------------------------------
const _toastCallbacks = new Map<string | number, {
  onDismiss?: (id: string | number) => void
  onAutoClose?: (id: string | number) => void
}>()
const _autoCloseFlags = new Set<string | number>()
const _manualDismissFlags = new Set<string | number>()
// Per-toast `sound` overrides, so in-place type updates honor them.
const _soundOverrides = new Map<string | number, GooeySoundOption>()

/** @internal Mark a toast as being auto-closed (timer-based dismiss). */
export function _markAutoClose(id: string | number) {
  _autoCloseFlags.add(id)
}

/** @internal Reset queue state — exported for tests only. */
export function _resetQueue() {
  _activeIds.clear()
  _queue.length = 0
  _toastUpdateListeners.clear()
  _toastCallbacks.clear()
  _autoCloseFlags.clear()
  _manualDismissFlags.clear()
  _soundOverrides.clear()
}

/** @internal Get the most recently created active toast ID — used by Escape key handler. */
export function _getMostRecentActiveId(): string | number | undefined {
  let last: string | number | undefined
  for (const id of _activeIds.keys()) last = id
  return last
}

function _processQueue() {
  const max = getGooeyVisibleToasts()
  while (_queue.length > 0 && _activeIds.size < max) {
    const next = _queue.shift()!
    _activeIds.set(next.id, next.type)
    next.create()
  }
}

function _enqueue(entry: { id: string | number; type: GooeyToastType; create: () => void }): boolean {
  const maxQueue = getGooeyMaxQueue()
  const overflow = getGooeyQueueOverflow()
  if (_queue.length >= maxQueue) {
    if (overflow === 'drop-newest') return false
    // drop-oldest: remove the oldest queued item
    _queue.shift()
  }
  _queue.push(entry)
  return true
}

function _onToastDismissed(id: string | number) {
  if (!_activeIds.delete(id)) return
  _toastUpdateListeners.delete(id)

  // Invoke callbacks — auto-close is true if explicitly flagged OR if not manually dismissed
  const cbs = _toastCallbacks.get(id)
  if (cbs) {
    const isAutoClose = _autoCloseFlags.has(id) || !_manualDismissFlags.has(id)
    if (isAutoClose && cbs.onAutoClose) {
      try { cbs.onAutoClose(id) } catch { /* callback errors must not break queue */ }
    }
    if (cbs.onDismiss) {
      try { cbs.onDismiss(id) } catch { /* callback errors must not break queue */ }
    }
    _toastCallbacks.delete(id)
  }
  _autoCloseFlags.delete(id)
  _manualDismissFlags.delete(id)
  _soundOverrides.delete(id)

  _processQueue()
}

// ---------------------------------------------------------------------------
// Toast update store — allows in-place updates to active toasts.
// Each toast wrapper subscribes to its own ID; calling update() stores
// partial new props and notifies the listener to re-render.
// ---------------------------------------------------------------------------
const _toastUpdateListeners = new Map<string | number, (opts: GooeyToastUpdateOptions) => void>()

function updateGooeyToast(id: string | number, options: GooeyToastUpdateOptions) {
  const listener = _toastUpdateListeners.get(id)
  if (listener) {
    listener(options)
    // Update the type in _activeIds if the type changed
    if (options.type !== undefined && _activeIds.has(id)) {
      if (_activeIds.get(id) !== options.type) playGooeySound(options.type, _soundOverrides.get(id))
      _activeIds.set(id, options.type)
    }
    // Announce updated content to screen readers
    if (options.title !== undefined) {
      announce(
        buildAnnouncementMessage(options.title, options.description),
        options.type ? getAnnouncePoliteness(options.type) : 'polite',
      )
    }
  }
}

function GooeyToastWrapper({
  initialPhase,
  title: initialTitle,
  type: initialType,
  description: initialDescription,
  action: initialAction,
  icon,
  classNames,
  fillColor,
  borderColor,
  borderWidth,
  timing,
  preset,
  spring,
  bounce,
  showProgress,
  showTimestamp: initialShowTimestamp,
  toastId,
  onDismiss,
  onAutoClose,
}: {
  initialPhase: GooeyToastPhase
  title: string
  type: GooeyToastType
  description?: ReactNode
  action?: GooeyToastAction
  icon?: ReactNode
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
  toastId: string | number
  onDismiss?: (id: string | number) => void
  onAutoClose?: (id: string | number) => void
}) {
  // Register callbacks so _onToastDismissed can invoke them on unmount
  useEffect(() => {
    if (onDismiss || onAutoClose) {
      _toastCallbacks.set(toastId, { onDismiss, onAutoClose })
    }
  }, [toastId, onDismiss, onAutoClose])

  const [title, setTitle] = useState(initialTitle)
  const [type, setType] = useState(initialType)
  const [phase, setPhase] = useState<GooeyToastPhase>(initialPhase)
  const [description, setDescription] = useState(initialDescription)
  const [action, setAction] = useState(initialAction)
  const [currentIcon, setCurrentIcon] = useState<ReactNode | undefined>(icon)
  const [showTimestamp, setShowTimestamp] = useState<boolean | undefined>(initialShowTimestamp)

  // Subscribe to in-place updates for this toast's ID.
  useEffect(() => {
    const handleUpdate = (opts: GooeyToastUpdateOptions) => {
      if (opts.title !== undefined) setTitle(opts.title)
      if (opts.description !== undefined) setDescription(opts.description)
      if (opts.type !== undefined) {
        setType(opts.type)
        setPhase(opts.type)
      }
      if (opts.action !== undefined) setAction(opts.action)
      if ('icon' in opts) setCurrentIcon(opts.icon ?? undefined)
      if (opts.showTimestamp !== undefined) setShowTimestamp(opts.showTimestamp)
    }
    _toastUpdateListeners.set(toastId, handleUpdate)
    return () => {
      _toastUpdateListeners.delete(toastId)
    }
  }, [toastId])

  // Guarantee the queue slot is freed when this toast unmounts from Sonner's DOM.
  // Uses a mounted ref + delayed check to survive React StrictMode's dev-only
  // double-mount cycle (mount → unmount → remount) without prematurely freeing the slot.
  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      setTimeout(() => {
        if (!mountedRef.current) _onToastDismissed(toastId)
      }, 100)
    }
  }, [toastId])

  return (
    <ToastErrorBoundary>
      <GooeyToast
        title={title}
        description={description}
        type={type}
        action={action}
        icon={currentIcon}
        phase={phase}
        classNames={classNames}
        fillColor={fillColor}
        borderColor={borderColor}
        borderWidth={borderWidth}
        timing={timing}
        preset={preset}
        spring={spring}
        bounce={bounce}
        showProgress={showProgress}
        showTimestamp={showTimestamp}
        toastId={toastId}
      />
    </ToastErrorBoundary>
  )
}

function PromiseToastWrapper<T>({
  promise,
  data,
  toastId,
}: {
  promise: Promise<T>
  data: GooeyPromiseData<T>
  toastId: string | number
}) {
  const [phase, setPhase] = useState<GooeyToastPhase>('loading')
  const [title, setTitle] = useState(data.loading)
  const [description, setDescription] = useState<ReactNode | undefined>(data.description?.loading)
  const [action, setAction] = useState<GooeyToastAction | undefined>(undefined)

  // Register callbacks so _onToastDismissed can invoke them on unmount
  useEffect(() => {
    if (data.onDismiss || data.onAutoClose) {
      _toastCallbacks.set(toastId, { onDismiss: data.onDismiss, onAutoClose: data.onAutoClose })
    }
  }, [toastId, data.onDismiss, data.onAutoClose])

  // Guarantee the queue slot is freed when this toast unmounts from Sonner's DOM.
  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      setTimeout(() => {
        if (!mountedRef.current) _onToastDismissed(toastId)
      }, 100)
    }
  }, [toastId])

  useEffect(() => {
    const resetDuration = (hasExpandedContent: boolean) => {
      const baseDuration = data.timing?.displayDuration ?? (hasExpandedContent ? DEFAULT_EXPANDED_DURATION : undefined)
      const collapseDurMs = 0.9 * 1000
      const duration = baseDuration != null && hasExpandedContent ? baseDuration + collapseDurMs : baseDuration
      if (duration != null) {
        toast.custom(() => (
          <PromiseToastWrapper promise={promise} data={data} toastId={toastId} />
        ), { id: toastId, duration })
      }
    }

    promise
      .then((result) => {
        const desc = typeof data.description?.success === 'function'
          ? data.description.success(result)
          : data.description?.success
        const resolvedTitle = typeof data.success === 'function'
          ? data.success(result)
          : data.success
        setTitle(resolvedTitle)
        setDescription(desc)
        setAction(data.action?.success)
        setPhase('success')
        playGooeySound('success', data.sound)
        resetDuration(Boolean(desc || data.action?.success))
        announce(buildAnnouncementMessage(resolvedTitle, desc), 'polite')
      })
      .catch((err) => {
        const desc = typeof data.description?.error === 'function'
          ? data.description.error(err)
          : data.description?.error
        const resolvedTitle = typeof data.error === 'function' ? data.error(err) : data.error
        setTitle(resolvedTitle)
        setDescription(desc)
        setAction(data.action?.error)
        setPhase('error')
        playGooeySound('error', data.sound)
        resetDuration(Boolean(desc || data.action?.error))
        announce(buildAnnouncementMessage(resolvedTitle, desc), 'assertive')
      })
  }, [])

  return (
    <ToastErrorBoundary>
      <GooeyToast
        title={title}
        description={description}
        type={phase === 'loading' ? 'info' : (phase as GooeyToastType)}
        action={action}
        phase={phase}
        classNames={data.classNames}
        fillColor={data.fillColor}
        borderColor={data.borderColor}
        borderWidth={data.borderWidth}
        timing={data.timing}
        preset={data.preset}
        spring={data.spring}
        bounce={data.bounce}
        showTimestamp={data.showTimestamp}
        toastId={toastId}
      />
    </ToastErrorBoundary>
  )
}

function createGooeyToast(
  title: string,
  type: GooeyToastType,
  options?: GooeyToastOptions
) {
  const hasExpandedContent = Boolean(options?.description || options?.action)
  const baseDuration = options?.timing?.displayDuration ?? options?.duration ?? (options?.description ? DEFAULT_EXPANDED_DURATION : undefined)
  // Expanded toasts: Infinity duration, component controls dismiss (hover re-expand support)
  // Simple toasts: normal duration
  const duration = hasExpandedContent ? Infinity : baseDuration

  const toastId = options?.id ?? Math.random().toString(36).slice(2)

  if (options?.sound !== undefined) _soundOverrides.set(toastId, options.sound)

  const create = () => {
    playGooeySound(type, options?.sound)
    toast.custom(
      () => (
        <GooeyToastWrapper
          initialPhase={type}
          title={title}
          type={type}
          description={options?.description}
          action={options?.action}
          icon={options?.icon}
          classNames={options?.classNames}
          fillColor={options?.fillColor}
          borderColor={options?.borderColor}
          borderWidth={options?.borderWidth}
          timing={options?.timing}
          preset={options?.preset}
          spring={options?.spring}
          bounce={options?.bounce}
          showProgress={options?.showProgress}
          showTimestamp={options?.showTimestamp}
          toastId={toastId}
          onDismiss={options?.onDismiss}
          onAutoClose={options?.onAutoClose}
        />
      ),
      {
        duration,
        id: toastId,
      }
    )
  }

  // Register callbacks before creating the toast so they're available on unmount
  if (options?.onDismiss || options?.onAutoClose) {
    _toastCallbacks.set(toastId, { onDismiss: options.onDismiss, onAutoClose: options.onAutoClose })
  }

  // Announce to screen readers via the persistent ARIA live region
  announce(
    buildAnnouncementMessage(title, options?.description),
    getAnnouncePoliteness(type),
  )

  if (_activeIds.size < getGooeyVisibleToasts()) {
    _activeIds.set(toastId, type)
    create()
  } else {
    _enqueue({ id: toastId, type, create })
  }

  return toastId
}

function dismissGooeyToast(idOrFilter?: string | number | DismissFilter) {
  if (idOrFilter != null && typeof idOrFilter === 'object') {
    // Dismiss by type filter
    const filterTypes = Array.isArray(idOrFilter.type) ? idOrFilter.type : [idOrFilter.type]
    const typesSet = new Set<GooeyToastType>(filterTypes)

    // Remove matching toasts from the queue
    for (let i = _queue.length - 1; i >= 0; i--) {
      if (typesSet.has(_queue[i].type)) {
        _queue.splice(i, 1)
      }
    }

    // Dismiss matching active toasts via Sonner
    for (const [id, toastType] of _activeIds) {
      if (typesSet.has(toastType)) {
        _manualDismissFlags.add(id)
        toast.dismiss(id)
      }
    }
  } else if (idOrFilter != null) {
    // Dismiss by specific ID
    const idx = _queue.findIndex(q => q.id === idOrFilter)
    if (idx !== -1) {
      _queue.splice(idx, 1)
      return
    }
    // Mark as manual dismiss so onAutoClose is NOT called
    _manualDismissFlags.add(idOrFilter)
    // Dismiss from Sonner — unmount cleanup in GooeyToastWrapper handles activeIds + queue
    toast.dismiss(idOrFilter)
  } else {
    // Dismiss all: mark all active as manual dismiss, clear queue and dismiss
    for (const id of _activeIds.keys()) {
      _manualDismissFlags.add(id)
    }
    _queue.length = 0
    _activeIds.clear()
    toast.dismiss()
  }
}

export const gooeyToast = Object.assign(
  (title: string, options?: GooeyToastOptions) =>
    createGooeyToast(title, 'default', options),
  {
    success: (title: string, options?: GooeyToastOptions) =>
      createGooeyToast(title, 'success', options),
    error: (title: string, options?: GooeyToastOptions) =>
      createGooeyToast(title, 'error', options),
    warning: (title: string, options?: GooeyToastOptions) =>
      createGooeyToast(title, 'warning', options),
    info: (title: string, options?: GooeyToastOptions) =>
      createGooeyToast(title, 'info', options),
    promise: <T,>(promise: Promise<T>, data: GooeyPromiseData<T>) => {
      const id = Math.random().toString(36).slice(2)

      // Announce loading state to screen readers
      announce(buildAnnouncementMessage(data.loading, data.description?.loading), 'polite')

      // Register callbacks before creating the toast
      if (data.onDismiss || data.onAutoClose) {
        _toastCallbacks.set(id, { onDismiss: data.onDismiss, onAutoClose: data.onAutoClose })
      }

      const create = () => {
        toast.custom(() => (
          <PromiseToastWrapper promise={promise} data={data} toastId={id} />
        ), {
          id,
          duration: (data.timing?.displayDuration != null || data.description) ? Infinity : undefined,
        })
      }

      if (_activeIds.size < getGooeyVisibleToasts()) {
        _activeIds.set(id, 'info')
        create()
      } else {
        _enqueue({ id, type: 'info', create })
      }

      return id
    },
    dismiss: dismissGooeyToast,
    update: updateGooeyToast,
  }
)
