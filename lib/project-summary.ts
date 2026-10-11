import type { ProjectPart } from '@/components/patterns/project-panel'
import { garments, getGarmentGuide } from './data'
import { groupIntoJourneys } from './journeys'
import { loadProject, type ProjectState } from './projects'
import { sizeLabel } from './sizes'
import type { Garment, StandardSize } from './types'

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

/**
 * Maps a garment's guide and saved progress onto the design system's ProjectPanel:
 * each short journey becomes a part with how many of its steps are done.
 */
export function projectPanelData(garment: Garment, size: StandardSize, completedUntil: number) {
  const steps = getGarmentGuide(garment.id)?.steps ?? []
  const parts: ProjectPart[] = groupIntoJourneys(steps).map((j) => ({
    key: j.key,
    title: j.title,
    kind: j.kind,
    done: j.stepIndices.filter((i) => i < completedUntil).length,
    total: j.stepIndices.length,
  }))
  return {
    name: garment.name,
    href: `/garment/${garment.id}`,
    continueHref: `/garment/${garment.id}/guide`,
    sizeLabel: sizeLabel(size),
    nextStep: steps[completedUntil]?.title,
    parts,
  }
}
