import { sewingSaved } from './sewing-store'
import type { StandardSize } from './types'

/** A started project: the size is chosen once up front, then progress builds on it. */
export interface ProjectState {
  size: StandardSize
  /** Number of guide steps marked done */
  completedUntil: number
  /** When the size or progress last changed, so the newest change wins across devices */
  updatedAt?: string
}

const key = (garmentId: string) => `sigrid_project_${garmentId}`

export function loadProject(garmentId: string): ProjectState | null {
  try {
    const raw = localStorage.getItem(key(garmentId))
    if (!raw) return null
    const p = JSON.parse(raw) as ProjectState
    return p && typeof p.size === 'string' && typeof p.completedUntil === 'number' ? p : null
  } catch {
    return null
  }
}

export function saveProject(garmentId: string, project: ProjectState) {
  try {
    // Opening a guide saves too. Only a real change counts as newer, or an out-of-date device would
    // overwrite progress made elsewhere.
    const saved = loadProject(garmentId)
    if (saved && saved.size === project.size && saved.completedUntil === project.completedUntil) return
    localStorage.setItem(key(garmentId), JSON.stringify({ size: project.size, completedUntil: project.completedUntil, updatedAt: new Date().toISOString() }))
    sewingSaved()
  } catch {}
}
