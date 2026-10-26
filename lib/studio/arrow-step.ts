import type { KeyboardEvent } from 'react'

/**
 * ↑ / ↓ in a number field: 1 per press, 10 with Shift, 0.5 with Alt.
 * Returns the new number, or null when the key isn't an arrow (so the event is left alone).
 */
export function arrowStep(e: KeyboardEvent<HTMLInputElement>, text: string, { min }: { min?: number } = {}): number | null {
  if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return null
  e.preventDefault()
  const step = e.shiftKey ? 10 : e.altKey ? 0.5 : 1
  const now = parseFloat(text.replace(',', '.').replace('−', '-')) || 0
  const next = Number((now + (e.key === 'ArrowUp' ? step : -step)).toFixed(2))
  return min !== undefined ? Math.max(min, next) : next
}
