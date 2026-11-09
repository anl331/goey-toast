import type { ToasterProps } from 'sonner'

let _position: ToasterProps['position'] = 'bottom-right'
let _dir: 'ltr' | 'rtl' = 'ltr'
let _spring: boolean = true
let _bounce: number | undefined = undefined
let _theme: 'light' | 'dark' = 'light'

export function setGooeyTheme(theme: 'light' | 'dark') {
  _theme = theme
}

export function getGooeyTheme(): 'light' | 'dark' {
  return _theme
}

export function setGooeyPosition(position: ToasterProps['position']) {
  _position = position
}

export function getGooeyPosition() {
  return _position
}

export function setGooeyDir(dir: 'ltr' | 'rtl') {
  _dir = dir
}

export function getGooeyDir(): 'ltr' | 'rtl' {
  return _dir
}

export function setGooeySpring(spring: boolean) {
  _spring = spring
}

export function getGooeySpring() {
  return _spring
}

export function setGooeyBounce(bounce: number | undefined) {
  _bounce = bounce
}

export function getGooeyBounce() {
  return _bounce
}

let _visibleToasts = 3

export function setGooeyVisibleToasts(n: number) {
  _visibleToasts = n
}

export function getGooeyVisibleToasts() {
  return _visibleToasts
}

// ---------------------------------------------------------------------------
// Container hover — broadcast from GooeyToaster to all mounted GooeyToast instances
// so timers pause and re-expand triggers correctly when hovering the stack.
// ---------------------------------------------------------------------------
let _swipeToDismiss = true

export function setGooeySwipeToDismiss(enabled: boolean) {
  _swipeToDismiss = enabled
}

export function getGooeySwipeToDismiss() {
  return _swipeToDismiss
}

let _closeOnEscape = true

export function setGooeyCloseOnEscape(enabled: boolean) {
  _closeOnEscape = enabled
}

export function getGooeyCloseOnEscape() {
  return _closeOnEscape
}

let _maxQueue = Infinity

export function setGooeyMaxQueue(n: number) {
  _maxQueue = n
}

export function getGooeyMaxQueue() {
  return _maxQueue
}

let _queueOverflow: 'drop-oldest' | 'drop-newest' = 'drop-oldest'

export function setGooeyQueueOverflow(strategy: 'drop-oldest' | 'drop-newest') {
  _queueOverflow = strategy
}

export function getGooeyQueueOverflow() {
  return _queueOverflow
}

let _showProgress = false

export function setGooeyShowProgress(show: boolean) {
  _showProgress = show
}

export function getGooeyShowProgress() {
  return _showProgress
}

let _showTimestamp = true

export function setGooeyShowTimestamp(show: boolean) {
  _showTimestamp = show
}

export function getGooeyShowTimestamp() {
  return _showTimestamp
}

let _closeButton: boolean | 'top-left' | 'top-right' = false

export function setGooeyCloseButton(value: boolean | 'top-left' | 'top-right') {
  _closeButton = value
}

export function getGooeyCloseButton(): boolean | 'top-left' | 'top-right' {
  return _closeButton
}

let _containerHovered = false
type HoverCb = (hovered: boolean) => void
const _hoverSubs: Set<HoverCb> = new Set()

export function setContainerHovered(hovered: boolean) {
  if (_containerHovered === hovered) return
  _containerHovered = hovered
  _hoverSubs.forEach(cb => cb(hovered))
}

export function getContainerHovered() {
  return _containerHovered
}

export function subscribeContainerHovered(cb: HoverCb): () => void {
  _hoverSubs.add(cb)
  return () => { _hoverSubs.delete(cb) }
}

// ---------------------------------------------------------------------------
// ARIA live region announcer — pushes text to a persistent live region so
// screen readers detect toast notifications reliably.
// ---------------------------------------------------------------------------
export type AriaLivePoliteness = 'polite' | 'assertive'

interface Announcement {
  message: string
  politeness: AriaLivePoliteness
}

type AnnounceCb = (announcement: Announcement) => void
const _announceSubs: Set<AnnounceCb> = new Set()

export function announce(message: string, politeness: AriaLivePoliteness = 'polite') {
  _announceSubs.forEach(cb => cb({ message, politeness }))
}

export function subscribeAnnouncements(cb: AnnounceCb): () => void {
  _announceSubs.add(cb)
  return () => { _announceSubs.delete(cb) }
}

// ---------------------------------------------------------------------------
// Notification sounds — opt-in, off by default.
// ---------------------------------------------------------------------------
let _sound = false
let _soundVolume = 0.4

export function setGooeySound(enabled: boolean) {
  _sound = enabled
}

export function getGooeySound() {
  return _sound
}

export function setGooeySoundVolume(volume: number) {
  _soundVolume = Math.min(1, Math.max(0, volume))
}

export function getGooeySoundVolume() {
  return _soundVolume
}
