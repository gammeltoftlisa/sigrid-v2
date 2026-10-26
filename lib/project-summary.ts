import { garments, getGarmentGuide } from './data'
import { listPublishedGarments } from './published'
import { loadProject, type ProjectState } from './projects'
import { sizeLabel } from './sizes'
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
  return [...garments, ...listPublishedGarments()]
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

/** What a project card shows: the garment, the next step and how far along it is */
export function projectCardData({ garment, project, totalSteps }: ProjectSummary) {
  const steps = getGarmentGuide(garment.id)?.steps ?? []
  return {
    name: garment.name,
    href: `/garment/${garment.id}`,
    continueHref: `/garment/${garment.id}/guide`,
    sizeLabel: sizeLabel(project.size),
    nextStep: steps[project.completedUntil]?.title,
    done: Math.min(project.completedUntil, totalSteps),
    total: totalSteps,
  }
}
