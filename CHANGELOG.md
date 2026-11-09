# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Optional notification sounds: `GooeyToaster` `sound` (default `false`) and `soundVolume` (0-1, default `0.4`) props, plus a per-toast `sound` option on `GooeyToastOptions` and `GooeyPromiseData` that overrides the global setting. Tones are synthesized with the Web Audio API (no audio files, no dependencies), one per toast type. Promise toasts play the resolved state's sound; `gooeyToast.update` plays the new type's sound when the type changes. Plays are throttled (80ms) and skipped while the tab is hidden.
- Custom sound files: `sound` (global prop and per-toast option) now also accepts a URL string or a per-type map such as `{ success: '/ding.mp3' }`. Files are fetched, decoded and cached once per URL; types missing from a map, and files that fail to load, fall back to the built-in tone. New `preloadGooeySounds(urls)` export and `GooeySoundOption` type. A map may include a `default` key used for any type not listed. Set a full map once on the root `GooeyToaster` and every toast uses it: the files are fetched on mount (no AudioContext is created until a toast plays, and the first toast waits for an in-flight fetch rather than falling back to the built-in tone).

### Fixed

- `GooeyToaster` `showTimestamp={false}` now correctly hides timestamps on all toasts globally (fixes [#20](https://github.com/anl331/goey-toast/issues/20))
- Promise toasts respect the global `showTimestamp` setting when no per-toast override is provided

## [0.5.0] - 2026-06-08

### Added

- Bundled Agent Skill (`skills/goey-toast/SKILL.md`) so coding agents (Claude Code, Cursor, etc.) can install and use goey-toast correctly — install via `npx skills add anl331/goey-toast` ([skills.sh](https://www.skills.sh/))
- `goey-toast` CLI (`npx goey-toast add-skill`) to copy the skill into a project, with `--agents` (write/append `AGENTS.md` pointer) and `--dir` (custom target) flags, plus `print-skill`
- "AI Agents & Skills" section added to the docs site and README

## [0.4.1] - 2026-06-08

### Added

- Global `showTimestamp` configuration on `GooeyToaster` to enable/disable timestamps for all toasts by default
- Per-toast `showTimestamp` override still available to prioritize specific notifications

### Fixed

- Stack hover transitions no longer snap/flash — stack offset corrections now apply synchronously before paint, allowing smooth eased motion between stacked positions
- Expanded stack transitions honor `prefers-reduced-motion` (collapse to near-instant)
- Toast title descenders (`g`, `y`, `p`, `q`) no longer clipped at the bottom

## [0.4.0] - 2026-03-29

### Added

- Close button with configurable position (`top-left` / `top-right`) via `closeButton` prop on `GooeyToaster`
- Close button inherits toast border/fill styling; uses shadow when no border is set
- Close button visible on hover, touch, and keyboard focus with scale animation
- Dark mode support for close button with light glow shadow
- Optional `showTimestamp` prop to show/hide timestamp on individual toasts (default `true`)
- Backward-compatible export aliases for v0.2.x users (`GoeyToaster`, `goeyToast`, etc.)

### Fixed

- ESM export broken in v0.3.0 — rebuilt exports to reference correct renamed variables
- Center toast positioning on mobile viewports (≤600px)
- Toast header stretching full width due to `display: flex` regression — restored `inline-flex`
- Swipe-to-dismiss now works for compact (no-description) toasts — `toastId` always passed
- Close button position correctly mirrors for right-side and center toast positions

## [0.1.0] - 2026-02

### Added

- Organic blob morph animation (pill to blob and back)
- Five toast types: default, success, error, warning, info
- Description body with string or ReactNode support
- Timestamp display on toast UI with optional `showTimestamp` toggle

- Action button with optional success label morph-back
- Promise toasts with loading to success/error transitions
- Configurable timing: expand delay, morph duration, collapse, display
- Position support: top-left, top-right, bottom-left, bottom-right
- Right-side positions auto-mirror the blob horizontally
- Pre-dismiss collapse animation (blob shrinks to pill before exit)
- Custom fill color, border color, and border width
- CSS class overrides via classNames prop
- Built on Sonner and Framer Motion
