import { catalogGarments, getGuideOutline } from './data'
import { listPublishedGarments } from './published'
import { loadProject, type ProjectState } from './projects'
import type { Garment } from './types'

export interface ProjectSummary {
  garment: Garment
  project: ProjectState
  totalSteps: number
  finished: boolean
  percent: number
}

/** Average minutes per step for a garment, from its estimate ("3–4 hours") and step count */
export function minutesPerStep(estimate: string, steps: number) {
  const nums = estimate.match(/\d+(?:\.\d+)?/g)?.map(Number) ?? [3]
  const hours = nums.reduce((a, b) => a + b, 0) / nums.length
  return steps ? (hours * 60) / steps : 0
}

/** Every project the user has started, in-progress first and the most recently touched first. Browser only. */
export function listProjects(): ProjectSummary[] {
  return [...catalogGarments, ...listPublishedGarments()]
    .flatMap((garment) => {
      const project = loadProject(garment.id)
      if (!project) return []
      const totalSteps = getGuideOutline(garment.id)?.steps.length ?? 0
      const done = Math.min(project.completedUntil, totalSteps)
      const finished = totalSteps > 0 && done >= totalSteps
      return [{ garment, project, totalSteps, finished, percent: totalSteps ? Math.round((done / totalSteps) * 100) : 0 }]
    })
    .sort((a, b) => Number(a.finished) - Number(b.finished) || (b.project.updatedAt ?? '').localeCompare(a.project.updatedAt ?? ''))
}

/** What a project card shows: the garment, the next step and how far along it is */
export function projectCardData({ garment, project, totalSteps }: ProjectSummary) {
  const steps = getGuideOutline(garment.id)?.steps ?? []
  return {
    name: garment.name,
    photoSrc: garment.photo,
    href: `/garment/${garment.id}`,
    continueHref: `/garment/${garment.id}/guide`,
    nextStep: steps[project.completedUntil]?.title,
    done: Math.min(project.completedUntil, totalSteps),
    total: totalSteps,
  }
}
