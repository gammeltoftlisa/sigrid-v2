/**
 * Shared interaction feedback, so every pressable thing in the app behaves
 * the same way. Progress states (upcoming / active / done) live in
 * ./progress.tsx; keyboard focus is one global ring in globals.css.
 *
 * - press:  buttons, chips, cards shrink to 97%; small icon-only targets to 90%
 * - hover:  on white surfaces → light grey fill; on items that are already
 *           grey → one shade darker; amber buttons → deeper amber;
 *           cards → lift; text links → darker + underline
 * - speed:  feedback 150 ms (state/progress changes use 200 ms)
 * - disabled: 40% opacity and no pointer events (so no hover or press either)
 */

/** framer-motion `whileTap` for buttons, chips and cards */
export const TAP = { scale: 0.97 }
/** framer-motion `whileTap` for small icon-only targets */
export const TAP_ICON = { scale: 0.9 }

export const feedback = 'transition duration-150 ease-out'
export const press = 'active:scale-[0.97]'
export const pressIcon = 'active:scale-90'

export const hoverOnSurface = 'hover:bg-surface-2'
export const hoverOnMuted = 'hover:bg-rim'

export const disabled = 'disabled:opacity-40 disabled:pointer-events-none'

export const cardInteractive =
  'transition duration-200 ease-out hover:shadow-card hover:-translate-y-0.5 active:scale-[0.97]'

export const textLink =
  `text-primary font-semibold underline-offset-4 hover:text-primary-deep hover:underline ${feedback}`
