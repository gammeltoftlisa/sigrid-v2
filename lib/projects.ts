import { z } from 'zod'

import { readJson, writeRaw } from './local-store'
import { sewingSaved } from './sewing-store'
import { allSizes } from './sizes'
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

const projectSchema = z.object({
  // The guide looks the size up in a table, so one it doesn't know would crash it
  size: z.custom<StandardSize>((s) => allSizes.includes(s as StandardSize)),
  completedUntil: z.number().int().min(0),
  updatedAt: z.string().optional(),
})

export function loadProject(garmentId: string): ProjectState | null {
  const result = readJson(key(garmentId), projectSchema)
  return result.status === 'ok' ? result.value : null
}

export function saveProject(garmentId: string, project: ProjectState) {
  // Opening a guide saves too. Only a real change counts as newer, or an out-of-date device would
  // overwrite progress made elsewhere.
  const saved = loadProject(garmentId)
  if (saved && saved.size === project.size && saved.completedUntil === project.completedUntil) return
  const { size, completedUntil } = project
  if (writeRaw(key(garmentId), JSON.stringify({ size, completedUntil, updatedAt: new Date().toISOString() })).ok) sewingSaved()
}
