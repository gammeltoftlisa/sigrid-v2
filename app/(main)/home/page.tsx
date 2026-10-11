'use client'

import { useState } from 'react'
import Link from 'next/link'
import { cn } from 'cn'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { CategoryTabs } from '@/components/patterns/category-tabs'
import { GarmentCard } from '@/components/patterns/garment-card'
import { PageContainer, PageHeader } from '@/components/patterns/page-header'
import { PageSection } from '@/components/patterns/page-section'
import { ProjectPanel } from '@/components/patterns/project-panel'
import { Wordmark } from '@/components/patterns/wordmark'
import { useMounted } from '@/hooks/use-mounted'
import { creatorPatterns, creators, garments } from '@/lib/data'
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
        breadcrumbs={[{ label: 'Home' }]}
        title={
          <>
            {hello}, <span className="text-brand-ink">Emma</span>
          </>
        }
        description={
          current
            ? `Welcome back. Your ${current.garment.name.toLowerCase()} is right where you left it.`
            : 'What would you like to make? Every pattern comes in your size, with each step explained.'
        }
      />

      <div className={cn('grid gap-10', current && 'lg:grid-cols-[21rem_minmax(0,1fr)] xl:grid-cols-[24rem_minmax(0,1fr)]')}>
        {current && (
          <ProjectPanel
            garment={current.garment}
            size={current.project.size}
            completedUntil={current.project.completedUntil}
            className="lg:sticky lg:top-20 lg:self-start"
          />
        )}

        <div className="flex min-w-0 flex-col gap-14">
          <PageSection title={current ? 'Start something new' : 'Choose your first garment'}>
            <CategoryTabs label="Filter by category" options={categories} value={category} onValueChange={setCategory} />
            {filtered.length > 0 ? (
              <div
                key={category}
                className={cn(
                  'tile-grid grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3',
                  current ? '2xl:grid-cols-4' : 'xl:grid-cols-4 2xl:grid-cols-5',
                )}
              >
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
              <p className="py-8 text-sm text-muted-foreground">No {category.toLowerCase()} yet. More patterns are on the way.</p>
            )}
          </PageSection>

          <PageSection
            title="From independent pattern makers"
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
        </div>
      </div>

      <section aria-label="About Sigrid" className="flex flex-col gap-5 border-t pt-12 pb-6">
        <p className="eyebrow text-brand-ink">Sigrid</p>
        <p className="max-w-5xl text-4xl leading-[1.04] font-medium tracking-[-0.035em] md:text-6xl">
          Made by you, one calm step at a time<span className="text-brand">.</span>
        </p>
        <p className="max-w-prose text-base text-muted-foreground">
          Patterns in your size, every step explained, and your progress saved as you go.
        </p>
      </section>
    </PageContainer>
  )
}
