import { garments, getGarmentGuide } from './data'
import { loadProject, type ProjectState } from './projects'
import type { Garment } from './types'

export interface ProjectSummary {
  garment: Garment
  project: ProjectState
  totalSteps: number
  finished: boolean
  percent: number
}

/** Every project the user has started on this device, in-progress first. Browser only. */
export function listProjects(): ProjectSummary[] {
  return garments
    .flatMap((garment) => {
      const project = loadProject(garment.id)
      if (!project) return []
      const totalSteps = getGarmentGuide(garment.id)?.steps.length ?? 0
      const done = Math.min(project.completedUntil, totalSteps)
      const finished = totalSteps > 0 && done >= totalSteps
      return [{ garment, project, totalSteps, finished, percent: totalSteps ? Math.round((done / totalSteps) * 100) : 0 }]
    })
    .sort((a, b) => Number(a.finished) - Number(b.finished))
}
