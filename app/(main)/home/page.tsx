'use client'

import { useState } from 'react'

import { CategoryTabs } from '@/components/patterns/category-tabs'
import { GarmentCard } from '@/components/patterns/garment-card'
import { PageContainer, PageHeader } from '@/components/patterns/page-header'
import { PageSection } from '@/components/patterns/page-section'
import { KeepHeight } from '@/components/patterns/keep-height'
import { ProjectGrid } from '@/components/patterns/project-grid'
import { useMounted } from '@/hooks/use-mounted'
import { garments } from '@/lib/data'
import { listProjects } from '@/lib/project-summary'
import type { GarmentCategory } from '@/lib/types'

const categories = ['All', 'Tops', 'Bottoms', 'Dresses', 'Outerwear'] as const satisfies readonly (GarmentCategory | 'All')[]

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

export default function HomePage() {
  const [category, setCategory] = useState<(typeof categories)[number]>('All')
  // Projects live in localStorage, and the greeting depends on the local clock
  const mounted = useMounted()
  const projects = mounted ? listProjects() : []
  const inProgress = projects.filter((p) => !p.finished)
  const current = inProgress[0] ?? null
  const hello = mounted ? greeting() : 'Hello'

  const filtered = category === 'All' ? garments : garments.filter((g) => g.category === category)

  return (
    <PageContainer>
      <PageHeader
        className="pt-8 md:pt-10"
        title={hello}
        description={current ? undefined : 'Choose a garment. Every pattern comes in your size.'}
      />

      {inProgress.length > 0 && <ProjectGrid label={inProgress.length === 1 ? 'Your project' : 'Your projects'} projects={inProgress} />}

      <PageSection title={current ? 'Start something new' : 'Garments'}>
        <CategoryTabs label="Filter by category" options={categories} value={category} onValueChange={setCategory} />
        <KeepHeight>
          {filtered.length > 0 ? (
            <div key={category} className="tile-grid tiles">
              {filtered.map((g) => (
                <GarmentCard
                  key={g.id}
                  href={`/garment/${g.id}`}
                  name={g.name}
                  difficulty={g.difficulty}
                  time={g.estimatedTime}
                  price={g.price}
                />
              ))}
            </div>
          ) : (
            <p className="py-8 text-sm text-muted-foreground">No {category.toLowerCase()} yet. More patterns are on the way.</p>
          )}
        </KeepHeight>
      </PageSection>
    </PageContainer>
  )
}
