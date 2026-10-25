'use client'

import { useState } from 'react'
import Link from 'next/link'
import { IconArrowDown, IconArrowRight } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import { CategoryTabs } from '@/components/patterns/category-tabs'
import { HeroBand } from '@/components/patterns/hero-band'
import { GarmentCard } from '@/components/patterns/garment-card'
import { PageContainer } from '@/components/patterns/page-header'
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
  if (h < 12) return 'morning'
  if (h < 18) return 'afternoon'
  return 'evening'
}

export default function HomePage() {
  const [category, setCategory] = useState<(typeof categories)[number]>('All')
  // Projects live in localStorage, and the greeting depends on the local clock
  const mounted = useMounted()
  const projects = mounted ? listProjects() : []
  const inProgress = projects.filter((p) => !p.finished)
  const current = inProgress[0] ?? null
  const partOfDay = mounted ? greeting() : 'day'
  const today = mounted ? new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }) : ''

  const filtered = category === 'All' ? garments : garments.filter((g) => g.category === category)
  const started = new Set(projects.map((p) => p.garment.id))
  // Feature the first garment you haven't started yet
  const leadId = filtered.find((g) => !started.has(g.id))?.id

  return (
    <PageContainer>
      <HeroBand
        kicker={today || 'Your sewing table'}
        lines={['Good', <em key="part" className="display-italic">{partOfDay}.</em>]}
        description={
          current
            ? `${current.garment.name} is waiting where you left it. Pick up the next step whenever you’re ready.`
            : 'Choose a garment. Every pattern comes in your size, with each step explained.'
        }
        actions={
          current ? (
            <>
              <Button size="lg" nativeButton={false} render={<Link href={`/garment/${current.garment.id}/guide`} />}>
                Continue sewing
                <IconArrowRight data-icon="inline-end" />
              </Button>
              <Button size="lg" variant="outline" nativeButton={false} render={<a href="#garments" />}>
                Start something new
              </Button>
            </>
          ) : (
            <Button size="lg" nativeButton={false} render={<a href="#garments" />}>
              Browse garments
              <IconArrowDown data-icon="inline-end" />
            </Button>
          )
        }
      />

      {/* The current project is in the hero; the panel only lists the others */}
      {inProgress.length > 1 && <ProjectGrid label="Your other projects" projects={inProgress.slice(1)} />}

      <PageSection id="garments" title={current ? 'Start something new' : 'Garments'}>
        <CategoryTabs label="Filter by category" options={categories} value={category} onValueChange={setCategory} />
        <KeepHeight>
          {filtered.length > 0 ? (
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
          ) : (
            <p className="py-8 text-sm text-muted-foreground">No {category.toLowerCase()} yet. More patterns are on the way.</p>
          )}
        </KeepHeight>
      </PageSection>
    </PageContainer>
  )
}
