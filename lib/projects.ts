import type { StandardSize } from './types'

/** A started project: the size is chosen once up front, then progress builds on it. */
export interface ProjectState {
  size: StandardSize
  /** Number of guide steps marked done */
  completedUntil: number
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
    localStorage.setItem(key(garmentId), JSON.stringify(project))
  } catch {}
}
