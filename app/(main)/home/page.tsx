'use client'

import { useState } from 'react'
import Link from 'next/link'
import { IconArrowRight } from '@tabler/icons-react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { CategoryTabs } from '@/components/patterns/category-tabs'
import { GarmentCard } from '@/components/patterns/garment-card'
import { PageContainer, PageHeader } from '@/components/patterns/page-header'
import { PageSection } from '@/components/patterns/page-section'
import { Wordmark } from '@/components/patterns/wordmark'
import { GarmentImage } from '@/components/garment/GarmentArt'
import { useMounted } from '@/hooks/use-mounted'
import { creatorPatterns, creators, garments, getGarmentGuide } from '@/lib/data'
import { listProjects, type ProjectSummary } from '@/lib/project-summary'
import { sizeLabel } from '@/lib/sizes'
import type { GarmentCategory } from '@/lib/types'

const categories = ['All', 'Tops', 'Bottoms', 'Dresses', 'Outerwear'] as const satisfies readonly (GarmentCategory | 'All')[]

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

/** The one thing Emma most likely wants: pick up where she stopped. */
function ContinuePanel({ summary }: { summary: ProjectSummary }) {
  const { garment, project, totalSteps, percent } = summary
  const nextStep = getGarmentGuide(garment.id)?.steps[project.completedUntil]
  return (
    <section
      aria-labelledby="continue-title"
      className="grid overflow-hidden rounded-(--radius) bg-hero text-hero-foreground sm:grid-cols-[1fr_14rem] md:grid-cols-[1fr_18rem]"
    >
      <div className="flex flex-col gap-6 p-6 md:p-10">
        <div className="flex flex-col gap-2">
          <p className="eyebrow text-hero-muted">Continue where you left off</p>
          <h2 id="continue-title" className="text-3xl md:text-4xl">
            {garment.name}
          </h2>
          {nextStep && (
            <p className="text-base text-hero-muted">
              Next: <span className="text-hero-foreground">{nextStep.title}</span>
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Progress value={percent} aria-label={`${garment.name} progress`} />
          <p className="text-sm text-hero-muted tabular-nums">
            {Math.min(project.completedUntil, totalSteps)} of {totalSteps} steps · {sizeLabel(project.size)}
          </p>
        </div>
        <Button size="lg" className="w-full sm:w-auto sm:self-start" render={<Link href={`/garment/${garment.id}/guide`} />}>
          Continue sewing
          <IconArrowRight data-icon="inline-end" />
        </Button>
      </div>
      <GarmentImage name={garment.name} className="hidden p-8 sm:flex" artClassName="max-w-48" />
    </section>
  )
}

export default function HomePage() {
  const [category, setCategory] = useState<(typeof categories)[number]>('All')
  // Projects live in localStorage, and the greeting depends on the local clock
  const mounted = useMounted()
  const projects = mounted ? listProjects() : []
  const current = projects.find((p) => !p.finished) ?? null
  const startedIds = new Set(projects.filter((p) => !p.finished).map((p) => p.garment.id))
  const hello = mounted ? greeting() : 'Hello'

  const filtered = category === 'All' ? garments : garments.filter((g) => g.category === category)

  return (
    <PageContainer>
      <div className="-mb-6 flex items-center justify-between pt-5 md:hidden">
        <Wordmark />
        <Link href="/profile" aria-label="Your profile" className="rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          <Avatar className="size-9">
            <AvatarFallback>E</AvatarFallback>
          </Avatar>
        </Link>
      </div>
      <PageHeader
        title={`${hello}, Emma`}
        description={current ? 'Pick up where you left off, or start something new.' : 'Choose a garment and we’ll guide you through every step.'}
      />

      {current && <ContinuePanel summary={current} />}

      <PageSection title={current ? 'Start something new' : 'Choose a garment'}>
        <CategoryTabs label="Filter by category" options={categories} value={category} onValueChange={setCategory} />
        {filtered.length > 0 ? (
          <div key={category} className="tile-grid grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 xl:grid-cols-4">
            {filtered.map((g) => (
              <GarmentCard
                key={g.id}
                href={`/garment/${g.id}`}
                name={g.name}
                difficulty={g.difficulty}
                time={g.estimatedTime}
                price={g.price}
                tag={startedIds.has(g.id) ? 'In progress' : undefined}
              />
            ))}
          </div>
        ) : (
          <p className="py-8 text-sm text-muted-foreground">Nothing in {category.toLowerCase()} yet.</p>
        )}
      </PageSection>

      <PageSection
        title="New from creators"
        action={
          <Button variant="link" className="px-0" render={<Link href="/explore" />}>
            See all
          </Button>
        }
      >
        <div className="scroll-row tile-grid -mx-4 flex snap-x gap-4 overflow-x-auto px-4 sm:-mx-0 sm:px-0">
          {creatorPatterns.slice(0, 4).map((p) => (
            <GarmentCard
              key={p.id}
              className="w-44 shrink-0 snap-start sm:w-52"
              href={`/garment/${p.garmentId}`}
              name={p.name}
              difficulty={p.difficulty}
              byline={creators.find((c) => c.id === p.creatorId)?.handle}
              price={p.price}
            />
          ))}
        </div>
      </PageSection>
    </PageContainer>
  )
}
