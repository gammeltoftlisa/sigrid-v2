'use client'

import { useState } from 'react'
import { CategoryTabs } from '@/components/patterns/category-tabs'
import { GarmentCard } from '@/components/patterns/garment-card'
import { HomeDashboard } from '@/components/patterns/home-dashboard'
import { PageContainer, PageHeader } from '@/components/patterns/page-header'
import { PageSection } from '@/components/patterns/page-section'
import { ProductGrid } from '@/components/patterns/product-grid'
import { KeepHeight } from '@/components/patterns/keep-height'
import { useMounted } from '@/hooks/use-mounted'
import { garments } from '@/lib/data'
import { listProjects } from '@/lib/project-summary'
import type { GarmentCategory } from '@/lib/types'

const categories = ['All', 'Tops', 'Bottoms', 'Dresses', 'Outerwear'] as const satisfies readonly (GarmentCategory | 'All')[]

export default function HomePage() {
  const [category, setCategory] = useState<(typeof categories)[number]>('All')
  // Projects live in localStorage
  const mounted = useMounted()
  const projects = mounted ? listProjects() : []
  const inProgress = projects.filter((p) => !p.finished)
  const current = inProgress[0] ?? null

  const tabs = categories.filter((c) => c === 'All' || garments.some((g) => g.category === c))
  const filtered = category === 'All' ? garments : garments.filter((g) => g.category === category)
  const started = new Set(projects.map((p) => p.garment.id))
  // Feature the first garment you haven't started yet
  const leadId = filtered.find((g) => !started.has(g.id))?.id

  return (
    <PageContainer>
      {current ? (
        <PageHeader title="Your sewing" className="pt-8 md:pt-12" />
      ) : (
        <PageHeader title="Start sewing" description="Choose a garment. Every pattern comes in your size, with each step explained." className="pt-8 md:pt-12" />
      )}

      {current && <HomeDashboard projects={inProgress} />}

      <PageSection id="garments" title={current ? 'Start something new' : undefined}>
        <CategoryTabs label="Filter by category" options={tabs} value={category} onValueChange={setCategory} />
        <KeepHeight>
          {filtered.length > 0 ? (
            <ProductGrid>
            <div key={category} className="tile-grid tiles">
              {filtered.map((g) => (
                <GarmentCard
                  key={g.id}
                  lead={category === 'All' && g.id === leadId}
                  tag={started.has(g.id) ? 'In progress' : undefined}
                  description={g.description}
                  href={`/garment/${g.id}`}
                  name={g.name}
                  difficulty={g.difficulty}
                  time={g.estimatedTime}
                  price={g.price}
                />
              ))}
            </div>
            </ProductGrid>
          ) : (
            <p className="py-8 text-sm text-muted-foreground">No {category.toLowerCase()} yet. More patterns are on the way.</p>
          )}
        </KeepHeight>
      </PageSection>
    </PageContainer>
  )
}
