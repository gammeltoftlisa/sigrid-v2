import { ProductGrid } from '@/components/patterns/product-grid'
import { ProjectCard } from '@/components/patterns/project-card'
import { projectCardData, type ProjectSummary } from '@/lib/project-summary'

/** Projects in the shared product container, with a stroke between them. */
export function ProjectGrid({ label, projects, count = false }: { label: string; projects: ProjectSummary[]; count?: boolean }) {
  return (
    <ProductGrid label={label} meta={count ? projects.length : undefined}>
      <div className="tiles">
        {/* The most recent comes first; its button is the page's one primary, the rest are secondary */}
        {projects.map((p, i) => (
          <ProjectCard key={p.garment.id} {...projectCardData(p)} primary={i === 0 && !p.finished} />
        ))}
      </div>
    </ProductGrid>
  )
}
