/** Connects what the browser saves to the account sync, and tells the screen when another device changed something. */
let version = 0
const screens = new Set<() => void>()
let onChange: (() => void) | null = null

export function subscribeSewing(listener: () => void) {
  screens.add(listener)
  return () => { screens.delete(listener) }
}
export const getSewingVersion = () => version

/** The saved data changed underneath the screen: redraw what reads it */
export function sewingReplaced() {
  version++
  screens.forEach((listener) => listener())
}

/** Something was saved on this device */
export const sewingSaved = () => onChange?.()
export function setSewingSavedHandler(handler: (() => void) | null) { onChange = handler }
