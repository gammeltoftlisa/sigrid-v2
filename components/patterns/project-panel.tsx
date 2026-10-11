import Link from 'next/link'
import { IconArrowRight, IconCut, IconIroning, IconNeedleThread, IconRuler2, type Icon } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import { Panel, PanelRow, StepDot, type RowState } from '@/components/patterns/panel'
import { GarmentImage } from '@/components/garment/GarmentArt'

export type ProjectPartKind = 'prepare' | 'cut' | 'sew' | 'finish'

/** One short part of a project ("Shoulders", "Neckline"…) and how many of its steps are done. */
export type ProjectPart = {
  key: string
  title: string
  kind: ProjectPartKind
  done: number
  total: number
}

const KIND_ICON: Record<ProjectPartKind, Icon> = {
  prepare: IconRuler2,
  cut: IconCut,
  sew: IconNeedleThread,
  finish: IconIroning,
}

/**
 * A project shown the way the sewing guide shows it: header with count and progress,
 * the garment, its short parts as rows (done / active / upcoming), and one
 * "Continue sewing" bar. Used on Home, Projects and the garment page.
 */
export function ProjectPanel({
  name,
  href,
  continueHref,
  sizeLabel,
  nextStep,
  parts,
  showImage = true,
  label = 'Your project',
  showAction = true,
  className,
}: {
  name: string
  /** The garment page */
  href: string
  /** Where "Continue sewing" goes, usually the guide */
  continueHref: string
  /** e.g. "M / 38" */
  sizeLabel: string
  /** Title of the next step, shown under the name */
  nextStep?: string
  parts: ProjectPart[]
  /** Hide the thumbnail and name when the panel sits on the garment's own page */
  showImage?: boolean
  label?: string
  /** Hide the Continue bar when the page already has its own main action */
  showAction?: boolean
  className?: string
}) {
  const total = parts.reduce((n, p) => n + p.total, 0)
  const done = parts.reduce((n, p) => n + Math.min(p.done, p.total), 0)
  const finished = total > 0 && done >= total
  // The first part that isn't finished is where Emma is now
  const activeKey = parts.find((p) => p.done < p.total)?.key

  return (
    <Panel
      label={label}
      meta={`${done} / ${total}`}
      progress={total ? (done / total) * 100 : 0}
      className={className}
      footer={
        showAction && (
          <Button size="lg" className="w-full" render={<Link href={finished ? href : continueHref} />}>
            {finished ? 'View garment' : 'Continue sewing'}
            <IconArrowRight data-icon="inline-end" />
          </Button>
        )
      }
    >
      <div className="flex items-center gap-3 px-1 pb-1">
        {showImage && <GarmentImage name={name} className="aspect-[4/5] w-14 shrink-0 p-1.5" />}
        <div className="flex min-w-0 flex-col">
          {showImage && (
            <Link href={href} className="truncate text-base font-medium hover:underline hover:underline-offset-4">
              {name}
            </Link>
          )}
          <span className={showImage ? 'text-xs text-muted-foreground tabular-nums' : 'px-1 text-sm text-muted-foreground tabular-nums'}>
            {sizeLabel}
            {!finished && nextStep && <> · Next: {nextStep}</>}
          </span>
        </div>
      </div>
      {parts.map((p) => {
        const state: RowState = p.done >= p.total ? 'done' : p.key === activeKey ? 'active' : 'upcoming'
        const KindIcon = KIND_ICON[p.kind]
        return (
          <PanelRow
            key={p.key}
            state={state}
            leading={
              <StepDot state={state}>
                <KindIcon className="size-3.5" />
              </StepDot>
            }
            title={p.title}
            meta={`${p.done}/${p.total}`}
          />
        )
      })}
    </Panel>
  )
}
