'use client'

import { use, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  IconArrowRight,
  IconCertificate,
  IconCheck,
  IconCircleCheck,
  IconLeaf,
  IconPlus,
  IconPrinter,
  IconShirt,
} from '@tabler/icons-react'

import { PageBreadcrumbs } from '@/components/patterns/page-breadcrumbs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { CreatorAvatar } from '@/components/patterns/creator-avatar'
import { MaterialItem } from '@/components/patterns/material-item'
import { BackButton } from '@/components/patterns/page-header'
import { PageSection } from '@/components/patterns/page-section'
import { StatusBadge } from '@/components/patterns/status-badge'
import { GarmentImage } from '@/components/garment/GarmentArt'
import SizeSheet from '@/components/garment/SizeSheet'
import { useMounted } from '@/hooks/use-mounted'
import { TOOLS } from '@/components/sewing/tools'
import { creators, getGarmentById, getGarmentGuide, standardSizes, tshirtFabrics } from '@/lib/data'
import { groupIntoJourneys } from '@/lib/journeys'
import { loadProject, saveProject, type ProjectState } from '@/lib/projects'
import { loadSavedSize, sizeLabel } from '@/lib/sizes'
import type { GuidePiece, StandardSize, UserMeasurements } from '@/lib/types'

const pieceName = (p: GuidePiece) => p.name ?? p.id.charAt(0).toUpperCase() + p.id.slice(1).replace(/-/g, ' ')

const pieceDims = (p: GuidePiece, m: UserMeasurements) => {
  const d = typeof p.dims === 'function' ? p.dims(m) : p.dims
  return `${Math.max(d.topWidth, d.bottomWidth)} × ${d.height} cm`
}

export default function GarmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const garment = getGarmentById(id)
  const fabric = tshirtFabrics[0]
  const creator = garment.isCreator && garment.creatorId ? creators.find((c) => c.id === garment.creatorId) : null
  const [following, setFollowing] = useState(false)
  const guide = getGarmentGuide(id)
  const journeys = useMemo(() => (guide ? groupIntoJourneys(guide.steps) : []), [guide])
  const tools = useMemo(() => (guide ? [...new Set(guide.steps.flatMap((s) => (s.tool ? [s.tool] : [])))] : []), [guide])
  const totalSteps = guide?.steps.length ?? 0

  // Project state lives in the browser, so read it after mount
  const mounted = useMounted()
  // undefined = nothing changed on this page yet, so read what's saved
  const [started, setStarted] = useState<ProjectState | undefined>(undefined)
  const project = started ?? (mounted ? loadProject(id) : null)
  const profileSize = mounted ? loadSavedSize() : null
  const [sizeSheetOpen, setSizeSheetOpen] = useState(false)

  const done = project ? Math.min(project.completedUntil, totalSteps) : 0
  const nextJourney = project ? journeys.find((j) => j.stepIndices.includes(project.completedUntil)) : undefined
  const finished = !!project && totalSteps > 0 && done >= totalSteps
  const inProgress = !!project && !finished

  const enterGuide = () => {
    sessionStorage.setItem('sigrid_flow_enter', '1')
    router.push(`/garment/${id}/guide`)
  }

  const startProject = (size: StandardSize) => {
    const next = { size, completedUntil: 0 }
    saveProject(id, next)
    setStarted(next)
    setSizeSheetOpen(false)
    enterGuide()
  }

  const onCta = () => (inProgress ? enterGuide() : setSizeSheetOpen(true))
  const ctaLabel = inProgress ? 'Continue sewing' : finished ? 'Sew it again' : `Start sewing · €${garment.price}`
  const sizeRange = `${garment.sizes[0]}–${garment.sizes[garment.sizes.length - 1]}`

  const printHref = `/garment/${id}/pattern?print=true${project ? `&size=${project.size}` : ''}`

  const cta = (
    <div className="flex flex-col gap-1.5">
      <Button size="lg" className="w-full" onClick={onCta}>
        {ctaLabel}
        {inProgress && <IconArrowRight data-icon="inline-end" />}
      </Button>
      {inProgress && (
        <p className="text-center text-xs text-muted-foreground tabular-nums">
          {done} of {totalSteps} steps done · {sizeLabel(project!.size)}
        </p>
      )}
    </div>
  )

  return (
    <div className="min-h-svh md:grid md:grid-cols-2">
      {/* Illustration: top of the page on phones, sticky left half from md */}
      <div className="md:sticky md:top-0 md:flex md:h-svh md:flex-col">
        <div className="flex items-center gap-2 px-4 pt-4 sm:px-6 md:pt-6">
          <BackButton />
          <PageBreadcrumbs
            items={[
              { label: 'Home', href: '/home' },
              ...(garment.isCreator ? [{ label: 'Explore', href: '/explore' }] : []),
              { label: garment.name },
            ]}
          />
        </div>
        <GarmentImage
          name={garment.name}
          className="mx-4 mt-4 aspect-[4/5] p-10 sm:mx-6 md:m-0 md:mt-6 md:aspect-auto md:flex-1 md:p-16"
          artClassName="max-w-72 md:max-w-sm"
        />
      </div>

      <div className="flex flex-col">
        <div className="flex w-full flex-1 flex-col gap-8 px-4 pt-6 pb-32 sm:px-6 md:px-12 md:pt-16 md:pb-0">
          <header className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-2xl font-semibold tracking-tight">{garment.name}</h1>
              <p className="text-2xl font-semibold tracking-tight tabular-nums">€{garment.price}</p>
            </div>
            <p className="text-sm text-muted-foreground">
              {garment.difficulty} · {garment.estimatedTime} · Sizes {sizeRange}
            </p>
            <p className="max-w-prose text-base leading-relaxed text-muted-foreground">{garment.description}</p>
          </header>

          {project && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{finished ? 'Finished' : 'Your project'}</CardTitle>
                <CardDescription className="tabular-nums">
                  {finished
                    ? `You sewed this in ${sizeLabel(project.size)}. Well done.`
                    : `${done} of ${totalSteps} steps done${nextJourney ? ` · Next: ${nextJourney.title}` : ''}`}
                </CardDescription>
                {finished && (
                  <StatusBadge status="success" className="col-start-2 row-span-2 row-start-1 self-start justify-self-end">
                    <IconCircleCheck data-icon="inline-start" />
                    Finished
                  </StatusBadge>
                )}
              </CardHeader>
              {!finished && (
                <CardContent>
                  <Progress value={totalSteps ? (done / totalSteps) * 100 : 0} aria-label="Project progress" />
                </CardContent>
              )}
            </Card>
          )}

          {creator && (
            <Card>
              <CardContent className="flex items-center gap-3">
                <CreatorAvatar creator={creator} size="lg" />
                <Link href={`/creator/${creator.id}`} className="flex min-w-0 flex-1 flex-col hover:underline">
                  <span className="flex items-center gap-1 truncate text-sm font-medium">
                    {creator.handle}
                    {creator.isCertified && <IconCertificate className="size-4 text-muted-foreground" aria-label="Certified" />}
                  </span>
                  <span className="text-sm text-muted-foreground">{creator.followerCount} followers</span>
                </Link>
                <Button variant={following ? 'outline' : 'secondary'} aria-pressed={following} onClick={() => setFollowing((f) => !f)}>
                  {following ? <IconCheck data-icon="inline-start" /> : <IconPlus data-icon="inline-start" />}
                  {following ? 'Following' : 'Follow'}
                </Button>
              </CardContent>
            </Card>
          )}

          <PageSection title="What you’ll need">
            <div className="flex flex-col">
              <MaterialItem
                id="fabric"
                icon={IconShirt}
                name={fabric.name}
                detail={fabric.description}
                quantity={`${fabric.quantityMeters} m`}
              />
              {fabric.isEco && (
                <span className="ml-12 inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <IconLeaf className="size-3.5" aria-hidden /> Lower-impact choice
                </span>
              )}
              {tools.map((t) => (
                <div key={t}>
                  <Separator />
                  <MaterialItem id={t} icon={TOOLS[t].Icon} name={TOOLS[t].label} />
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Fabric amount {project ? `is for ${sizeLabel(project.size)}` : 'varies slightly by size'}.
            </p>
          </PageSection>

          <PageSection
            title="Pattern"
            description={project ? `Drafted in ${sizeLabel(project.size)}. Print at 100% scale.` : `Available in sizes ${sizeRange}.`}
          >
            {guide && guide.pieces.length > 0 && (
              <ul className="flex flex-col">
                {guide.pieces.map((p, i) => (
                  <li key={p.id}>
                    {i > 0 && <Separator />}
                    <div className="flex items-center gap-3 py-2.5">
                      <span className="flex size-7 shrink-0 items-center justify-center border text-xs font-medium">
                        {p.label}
                      </span>
                      <span className="flex-1 text-sm">{pieceName(p)}</span>
                      {project && (
                        <span className="text-sm text-muted-foreground tabular-nums">
                          {pieceDims(p, standardSizes[project.size])}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {project ? (
              <Button variant="outline" className="self-start" render={<a href={printHref} target="_blank" rel="noopener" />}>
                <IconPrinter data-icon="inline-start" />
                Print pattern in {sizeLabel(project.size)}
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">Your printable pattern is ready as soon as you choose a size.</p>
            )}
          </PageSection>

          {journeys.length > 0 && (
            <PageSection title="How it goes" description={`${totalSteps} steps in ${journeys.length} short parts. Stop after any step, your progress is saved.`}>
              <ol className="flex flex-col gap-2">
                {journeys.map((j, i) => (
                  <li key={j.key} className="flex items-center gap-3">
                    <span className="w-6 shrink-0 text-sm text-muted-foreground tabular-nums">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="flex-1 text-sm">{j.title}</span>
                    <span className="text-sm text-muted-foreground tabular-nums">
                      {j.stepIndices.length} {j.stepIndices.length === 1 ? 'step' : 'steps'}
                    </span>
                  </li>
                ))}
              </ol>
            </PageSection>
          )}

          <div className="sticky bottom-0 -mx-12 mt-auto hidden border-t bg-background px-12 py-4 md:block">{cta}</div>
        </div>

        {/* Phones: action stays reachable at the bottom */}
        <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur supports-backdrop-filter:bg-background/80 md:hidden">
          {cta}
        </div>
      </div>

      <SizeSheet
        garment={garment}
        open={sizeSheetOpen}
        onClose={() => setSizeSheetOpen(false)}
        initialSize={project?.size ?? profileSize}
        onConfirm={startProject}
      />
    </div>
  )
}
