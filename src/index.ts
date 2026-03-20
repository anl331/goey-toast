import './components/GooeyToast.css'
export { GooeyToaster } from './components/GooeyToaster'
export { gooeyToast } from './gooey-toast'
export { animationPresets } from './presets'
export type { AnimationPreset, AnimationPresetName } from './presets'
export type {
  GooeyToastOptions,
  GooeyPromiseData,
  GooeyToasterProps,
  GooeyToastAction,
  GooeyToastClassNames,
  GooeyToastTimings,
  GooeyToastUpdateOptions,
  DismissFilter,
} from './types'

// Backward-compatible aliases for v0.2.x users upgrading to v0.3.0
export { GooeyToaster as GoeyToaster } from './components/GooeyToaster'
export { gooeyToast as goeyToast } from './gooey-toast'
export type { GooeyPromiseData as GoeyPromiseData } from './types'
export type { GooeyToastClassNames as GoeyToastClassNames } from './types'
export type { GooeyToastTimings as GoeyToastTimings } from './types'
export type { GooeyToastOptions as GoeyToastOptions } from './types'
export type { GooeyToasterProps as GoeyToasterProps } from './types'
