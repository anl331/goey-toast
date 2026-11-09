---
name: goey-toast
description: Install and use goey-toast — a gooey, morphing React toast component built on Sonner with Framer Motion. Use when adding toast/notification UI to a React app (success/error/warning/info/promise toasts), or when the user mentions goey-toast / gooey toast.
license: MIT
---

# goey-toast

A gooey, morphing React toast component built on Sonner with Framer Motion
animations (pill → blob → pill). Use this skill to install the package and write
correct usage code in any React project.

## When to use

- Adding toast / notification UI to a React app (React >= 18).
- The user mentions "goey-toast", "gooey toast", or wants animated/morphing toasts.
- Replacing raw `sonner` toasts with the gooey variant.

## Install

```bash
npm install goey-toast react react-dom framer-motion
```

Peer deps (must exist in the host app):

| Package       | Version   |
| ------------- | --------- |
| react         | >= 18.0.0 |
| react-dom     | >= 18.0.0 |
| framer-motion | >= 10.0.0 |

### shadcn/ui projects

```bash
npx shadcn@latest add https://goey-toast.vercel.app/r/goey-toaster.json
```

Installs a wrapper at `components/ui/goey-toaster.tsx` and auto-installs deps.
The wrapper maps toast colors to shadcn tokens (`--popover`, `--border`, ...),
follows the `.dark` class automatically and defaults to `theme="system"` — no
theme prop needed. Import from `@/components/ui/goey-toaster` in that case.

## Two required steps to render toasts

1. **Mount `<GooeyToaster />` once** near the app root.
2. **Import the stylesheet once** at the entry point. Without it toasts render
   unstyled.

```tsx
import { GooeyToaster, gooeyToast } from 'goey-toast'
import 'goey-toast/styles.css' // REQUIRED — import once at app entry

function App() {
  return (
    <>
      <GooeyToaster position="bottom-right" />
      <button onClick={() => gooeyToast.success('Saved!')}>Save</button>
    </>
  )
}
```

## API: `gooeyToast`

```ts
gooeyToast(title, options?)         // default (neutral)
gooeyToast.success(title, options?) // green
gooeyToast.error(title, options?)   // red
gooeyToast.warning(title, options?) // yellow
gooeyToast.info(title, options?)    // blue
gooeyToast.promise(promise, data)   // loading → success/error
gooeyToast.update(id, options)      // update an existing toast in-place
gooeyToast.dismiss(idOrFilter?)     // dismiss one, by type, or all
```

### Common options (2nd arg)

| Option          | Type                | Notes                                          |
| --------------- | ------------------- | ---------------------------------------------- |
| `description`   | `ReactNode`         | String or component body                       |
| `action`        | `GooeyToastAction`  | `{ label, onClick, successLabel? }`            |
| `icon`          | `ReactNode`         | Custom icon (`null` clears in `update`)        |
| `duration`      | `number`            | ms                                             |
| `id`            | `string \| number`  | Stable id (needed for `update`)                |
| `fillColor` / `borderColor` / `borderWidth` | colors / px | Blob styling                  |
| `spring` / `bounce` | `boolean` / `number` | bounce `0.05`–`0.8`, default `0.4`        |
| `preset`        | `'smooth' \| 'bouncy' \| 'subtle' \| 'snappy'` | Animation preset    |
| `showProgress`  | `boolean`           | Countdown bar (only on toasts with a description/action; starts when the toast expands) |
| `sound`         | `boolean \| string \| { [type]?: url, default?: url }` | Per-toast sound override |
| `showTimestamp` | `boolean`           | Default `true`                                 |
| `onDismiss` / `onAutoClose` | `(id) => void` | Dismiss callbacks                    |

### `<GooeyToaster />` key props

`position` (`'top-left'|'top-center'|'top-right'|'bottom-left'|'bottom-center'|'bottom-right'`, default `'bottom-right'`),
`theme` (`'light'|'dark'|'system'`, default `'light'`), `closeButton`, `showProgress`, `closeOnEscape`,
`maxQueue`, `queueOverflow` (`'drop-oldest'|'drop-newest'`), `dir` (`'ltr'|'rtl'`),
`spring`, `bounce`, `preset`, `swipeToDismiss`, `showTimestamp`, `gap`, `offset`,
`sound` (`boolean | url | per-type map`, default `true`), `soundVolume` (0–1, default `0.4`).
`showProgress` and `sound` are both on by default — pass `false` to opt out.

## Theming & dark mode

Theme changes restyle toasts already on screen. Pick one:

```tsx
<GooeyToaster theme="system" />                    // follow the OS
<GooeyToaster theme={resolvedTheme === 'dark' ? 'dark' : 'light'} /> // next-themes
```

Every color is a CSS variable, so app tokens (Tailwind, shadcn) can drive them.
Declare anywhere in the tree (`:root`, `.dark`, ...):

```css
:root  { --gooey-fill: #fff;    --gooey-title-default: #111; --gooey-description: #555; }
.dark  { --gooey-fill: #18181b; --gooey-title-default: #eee; --gooey-description: #aaa; }
/* also: --gooey-border, --gooey-border-width, --gooey-timestamp, --gooey-close-fg,
   --gooey-title-{success,error,warning,info,loading},
   --gooey-action-{type}-{bg,fg,bg-hover,bg-active}, --gooey-progress-{type}, --gooey-progress-track */
```

Prefer these variables over `classNames` for colors. Per-toast `fillColor` /
`borderColor` still win over the variables.

## Sounds (on by default)

Built-in tones play by default. To customize, set once on the root
`<GooeyToaster>`; every toast uses it — don't pass `sound` on each toast:

```tsx
<GooeyToaster sound={false} />                 // turn sounds off
<GooeyToaster sound={{                         // custom files (fetched on mount)
  success: '/sounds/success.mp3',
  error: '/sounds/error.mp3',
  default: '/sounds/notify.mp3',               // fallback for unlisted types
}} />
gooeyToast.error('Quiet one', { sound: false }) // per-toast override
```

## Recipes

### Description + action button

```tsx
gooeyToast.info('Share link ready', {
  description: 'Your link has been generated.',
  action: {
    label: 'Copy',
    onClick: () => navigator.clipboard.writeText(url),
    successLabel: 'Copied!', // morphs back to pill after click
  },
})
```

### Promise toast

```tsx
gooeyToast.promise(saveData(), {
  loading: 'Saving...',
  success: (data) => `Saved ${data.count} items`,
  error: (e) => `Failed: ${String(e)}`,
  description: { success: 'All changes synced.', error: 'Try again later.' },
  action: { error: { label: 'Retry', onClick: () => retry() } },
})
```

### Update in place

```tsx
const id = gooeyToast('Uploading...', { icon: <Spinner /> })
gooeyToast.update(id, { title: 'Done', type: 'success', icon: null })
```

### Dismiss by filter

```tsx
gooeyToast.dismiss(id)                       // one
gooeyToast.dismiss({ type: 'error' })        // all errors
gooeyToast.dismiss({ type: ['error','warning'] })
gooeyToast.dismiss()                         // all
```

## Gotchas

- Forgetting `import 'goey-toast/styles.css'` → unstyled toasts. Most common bug.
- `<GooeyToaster />` must be mounted exactly once, near the root.
- `update()` requires the same `id` returned from the create call.
- `framer-motion` is a peer dep — install it explicitly.
- Dark mode: default `theme` is `'light'`. Pass `"system"` or the app's resolved
  theme; don't pass next-themes' raw `theme` value (it can be `"system"` or
  `undefined` before mount — `"system"` is fine, map anything else to light/dark).
- Sounds are on by default; if the user/app wants silent toasts, pass
  `sound={false}`. Browsers block audio until the user has interacted with the
  page; sound files must be same-origin or CORS-enabled.
- Backward-compat aliases exist (`GoeyToaster`, `goeyToast`) for v0.2.x; prefer
  the double-`o` names (`GooeyToaster`, `gooeyToast`).

## Reference

- Live demo & docs: https://goey-toast.vercel.app
- npm: https://www.npmjs.com/package/goey-toast
