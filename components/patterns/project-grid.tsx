import { ProductGrid } from '@/components/patterns/product-grid'
import { ProjectCard } from '@/components/patterns/project-card'
import { projectCardData, type ProjectSummary } from '@/lib/project-summary'

/** Projects in the shared product container, with a stroke between them. */
export function ProjectGrid({ label, projects, count = false }: { label: string; projects: ProjectSummary[]; count?: boolean }) {
  return (
    <ProductGrid label={label} meta={count ? projects.length : undefined}>
      <div className="tiles tiles-compact">
        {projects.map((p) => (
          <ProjectCard key={p.garment.id} {...projectCardData(p)} />
        ))}
      </div>
    </ProductGrid>
  )
}
