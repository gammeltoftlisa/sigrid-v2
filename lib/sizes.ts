import type { StandardSize } from './types'

export const allSizes: StandardSize[] = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

// EU numeric equivalent shown next to each letter size, e.g. "XS / 34"
export const euSizes: Record<StandardSize, number> = {
  XS: 34,
  S: 36,
  M: 38,
  L: 40,
  XL: 42,
  XXL: 44,
}

export const sizeLabel = (size: StandardSize) => `${size} / ${euSizes[size]}`

const STORAGE_KEY = 'sigrid_user_size'

export function loadSavedSize(): StandardSize | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw && raw in euSizes ? (raw as StandardSize) : null
  } catch {
    return null
  }
}

export function saveSize(size: StandardSize) {
  try {
    localStorage.setItem(STORAGE_KEY, size)
  } catch {}
}
