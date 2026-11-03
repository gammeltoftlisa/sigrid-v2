'use client'

import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { IconChevronDown, IconDroplet, IconIroning, IconNeedleThread, IconScissors } from '@tabler/icons-react'

import type { SewingStep2D } from '@/lib/types'
import { groupIntoJourneys, type JourneyKind } from '@/lib/journeys'
import { SECTION_ICONS, type SectionIconKey } from '@/components/studio/section-icons'
import { progressStateOf, type ProgressState } from '@/components/legacy/progress'
import { StepDot } from '@/components/patterns/panel'
import { ease } from '@/components/patterns/reveal'

const JOURNEY_ICONS: Record<JourneyKind, typeof IconScissors> = {
  prepare: IconDroplet,
  cut: IconScissors,
  sew: IconNeedleThread,
  finish: IconIroning,
}

/**
 * The whole guide at a glance, for the All steps panel: the stages, each folding open to its steps. The stage
 * you're in starts open. The dot on a step says how far you've got (done, now, to come); the stitched outline
 * marks the step on screen, which may be another one. Picking a step only shows it: it never marks anything done.
 */
export default function StepsList({
  steps,
  completedUntil,
  viewStep,
  onPick,
  keepSections,
  sectionIcons,
}: {
  steps: SewingStep2D[]
  completedUntil: number
  viewStep: number
  /** Show this step (closes the panel) */
  onPick: (index: number) => void
  keepSections?: boolean
  sectionIcons?: Record<string, string>
}) {
  const journeys = useMemo(() => groupIntoJourneys(steps, { keepSections }), [steps, keepSections])
  const keyAt = (i: number) => journeys.find((j) => j.stepIndices.includes(i))?.key ?? null
  // Several may be open at once here: it's an overview, not a place to work
  const [open, setOpen] = useState<Set<string>>(() => new Set([keyAt(viewStep), keyAt(completedUntil)].filter((k): k is string => !!k)))
  const toggle = (k: string) =>
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(k)) next.delete(k)
      else next.add(k)
      return next
    })

  return (
    <div className="flex flex-col gap-2">
      {journeys.map((j) => {
        const doneCount = j.stepIndices.filter((i) => i < completedUntil).length
        const total = j.stepIndices.length
        const complete = doneCount === total
        const current = !complete && j.stepIndices[0] <= completedUntil
        const jState: ProgressState = complete ? 'done' : current ? 'active' : 'upcoming'
        const expanded = open.has(j.key)
        const own = sectionIcons?.[j.title]
        const Icon = own && own in SECTION_ICONS ? SECTION_ICONS[own as SectionIconKey].Icon : JOURNEY_ICONS[j.kind]

        return (
          <div key={j.key} className="overflow-hidden rounded-(--control-radius) border">
            <button type="button" onClick={() => toggle(j.key)} aria-expanded={expanded} className="guide-step flex w-full items-center gap-3 px-2.5 py-2.5 text-left">
              <StepDot state={jState}><Icon size={14} /></StepDot>
              <span className={`min-w-0 flex-1 truncate text-sm ${jState === 'done' ? 'text-muted-foreground' : 'text-foreground'} ${jState === 'active' ? 'font-medium' : ''}`}>
                {j.title}
              </span>
              <span className="text-xs tabular-nums text-muted-foreground">{doneCount}/{total}</span>
              <IconChevronDown size={12} className={`shrink-0 text-muted-foreground transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence initial={false}>
              {expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease }}
                  className="overflow-hidden"
                >
                  <ol className="flex flex-col gap-1 px-2 pt-1 pb-2">
                    {j.stepIndices.map((i) => {
                      const state = progressStateOf(i, completedUntil)
                      const onScreen = i === viewStep
                      return (
                        <li key={steps[i].id}>
                          <button
                            type="button"
                            onClick={() => onPick(i)}
                            aria-current={onScreen ? 'step' : undefined}
                            className="guide-step flex w-full items-center gap-2.5 rounded-(--control-radius) px-2 py-1.5 text-left"
                          >
                            <StepDot state={state} className="size-6">{i + 1}</StepDot>
                            <span className={`min-w-0 flex-1 truncate text-sm ${state === 'done' ? 'text-muted-foreground' : 'text-foreground'} ${state === 'active' ? 'font-medium' : ''}`}>
                              {steps[i].title}
                            </span>
                            {state === 'active' && <span className="eyebrow shrink-0 text-muted-foreground">Now</span>}
                          </button>
                        </li>
                      )
                    })}
                  </ol>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}
