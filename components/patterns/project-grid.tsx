import { Panel } from '@/components/patterns/panel'
import { ProjectCard } from '@/components/patterns/project-card'
import { projectCardData, type ProjectSummary } from '@/lib/project-summary'

/** Projects as white cards in a glass panel, in the same grid as product tiles. */
export function ProjectGrid({ label, projects, count = false }: { label: string; projects: ProjectSummary[]; count?: boolean }) {
  return (
    <Panel label={label} meta={count ? projects.length : undefined}>
      <div className="tile-grid tiles tiles-compact">
        {projects.map((p) => (
          <ProjectCard key={p.garment.id} {...projectCardData(p)} />
        ))}
      </div>
    </Panel>
  )
}
