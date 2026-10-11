'use client'

import Link from 'next/link'
import { IconArrowRight, IconCut, IconIroning, IconNeedleThread, IconRuler2, type Icon } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import { Panel, PanelRow, StepDot, type RowState } from '@/components/patterns/panel'
import { GarmentImage } from '@/components/garment/GarmentArt'
import { getGarmentGuide } from '@/lib/data'
import { groupIntoJourneys, type JourneyKind } from '@/lib/journeys'
import { sizeLabel } from '@/lib/sizes'
import type { Garment, StandardSize } from '@/lib/types'

const KIND_ICON: Record<JourneyKind, Icon> = {
  prepare: IconRuler2,
  cut: IconCut,
  sew: IconNeedleThread,
  finish: IconIroning,
}

/**
 * A project shown the way the guide shows it: header with count and progress,
 * the garment, its short parts as rows (done / active / upcoming), and one
 * "Continue sewing" bar. Used on Home, Projects and the garment page.
 */
export function ProjectPanel({
  garment,
  size,
  completedUntil,
  showImage = true,
  label = 'Your project',
  showAction = true,
  className,
}: {
  garment: Garment
  size: StandardSize
  completedUntil: number
  showImage?: boolean
  label?: string
  /** Hide the Continue bar when the page already has its own main action */
  showAction?: boolean
  className?: string
}) {
  const guide = getGarmentGuide(garment.id)
  const steps = guide?.steps ?? []
  const total = steps.length
  const done = Math.min(completedUntil, total)
  const finished = total > 0 && done >= total
  const journeys = guide ? groupIntoJourneys(steps) : []

  return (
    <Panel
      label={label}
      meta={`${done} / ${total}`}
      progress={total ? (done / total) * 100 : 0}
      className={className}
      footer={
        showAction && (
        <Button size="lg" className="w-full" render={<Link href={finished ? `/garment/${garment.id}` : `/garment/${garment.id}/guide`} />}>
          {finished ? 'View garment' : 'Continue sewing'}
          <IconArrowRight data-icon="inline-end" />
        </Button>
        )
      }
    >
      <div className="flex items-center gap-3 px-1 pb-1">
        {showImage && <GarmentImage name={garment.name} className="aspect-[4/5] w-14 shrink-0 p-1.5" />}
        <div className="flex min-w-0 flex-col">
          {/* Without the image the panel sits on the garment's own page, so the name would repeat */}
          {showImage && (
            <Link href={`/garment/${garment.id}`} className="truncate text-base font-medium hover:underline hover:underline-offset-4">
              {garment.name}
            </Link>
          )}
          <span className={showImage ? 'text-xs text-muted-foreground tabular-nums' : 'px-1 text-sm text-muted-foreground tabular-nums'}>
            {sizeLabel(size)}
            {!finished && steps[completedUntil] && <> · Next: {steps[completedUntil].title}</>}
          </span>
        </div>
      </div>
      {journeys.map((j) => {
        const jDone = j.stepIndices.filter((i) => i < completedUntil).length
        const jTotal = j.stepIndices.length
        const state: RowState = jDone === jTotal ? 'done' : j.stepIndices[0] <= completedUntil ? 'active' : 'upcoming'
        const KindIcon = KIND_ICON[j.kind]
        return (
          <PanelRow
            key={j.key}
            state={state}
            leading={
              <StepDot state={state}>
                <KindIcon className="size-3.5" />
              </StepDot>
            }
            title={j.title}
            meta={`${jDone}/${jTotal}`}
          />
        )
      })}
    </Panel>
  )
}
