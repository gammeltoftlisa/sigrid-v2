'use client'

import { useState } from 'react'
import {
  IconArrowDown,
  IconArrowUp,
  IconBulb,
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconDroplet,
  IconIroning,
  IconNeedleThread,
  IconPlus,
  IconRuler2,
  IconScissors,
  IconTrash,
} from '@tabler/icons-react'
import { cn } from 'cn'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { ChipGroup } from '@/components/patterns/chip-group'
import { StatusDot } from '@/components/legacy/progress'
import PatternCanvas from '@/components/sewing/PatternCanvas'
import { ACTION_LABELS } from '@/components/sewing/actions'
import { standardSizes } from '@/lib/data'
import {
  actionFromTitle,
  insertStep,
  isDrawable,
  moveStep,
  renameSection,
  sectionsOf,
  type Section,
  type StudioPattern,
  type StudioStep,
} from '@/lib/studio/patterns'
import { InlinePick, InlineText, InlineTextarea } from './Inline'

type Change = (patch: Partial<StudioPattern>) => void

const NO_PIECE = 'none'

/** Same icons as the sewer's step list */
function sectionIcon(section: Section, steps: StudioStep[]) {
  const actions = section.indices.map((i) => steps[i].action)
  if (actions.includes('cut')) return IconScissors
  if (actions.every((a) => a === 'prepare')) return IconDroplet
  if (/finish|hem/i.test(section.group)) return IconIroning
  return IconNeedleThread
}

const focusLater = (label: string) =>
  requestAnimationFrame(() => document.querySelector<HTMLElement>(`[aria-label="${label}"]`)?.focus())

/**
 * The sewing guide exactly as a sewer sees it (step list on the left, the
 * drawing, the instruction panel underneath), written in place: pick a step in
 * the list and type straight into its instruction panel.
 */
export function StudioGuide({ pattern, onChange }: { pattern: StudioPattern; onChange: Change }) {
  const { steps, pieces } = pattern
  const [selected, setSelected] = useState(0)
  const current = Math.min(selected, steps.length - 1)
  const step = steps[current]
  const sections = sectionsOf(steps)
  const section = sections.find((s) => s.indices.includes(current))
  const piece = step?.pieceId ? pieces.find((p) => p.id === step.pieceId && isDrawable(p)) : undefined

  const setSteps = (next: StudioStep[]) => onChange({ steps: next })
  const update = (patch: Partial<StudioStep>) => setSteps(steps.map((s, i) => (i === current ? { ...s, ...patch } : s)))

  const addStep = (at: number, group: string) => {
    setSteps(insertStep(steps, at, group))
    setSelected(at)
    focusLater('Step title')
  }
  const addSection = () => {
    let n = 1
    const name = () => (steps.length === 0 ? 'Prepare' : n === 1 ? 'New section' : `New section ${n}`)
    while (steps.some((s) => s.group === name())) n++
    addStep(steps.length, name())
  }
  const deleteStep = () => {
    setSteps(steps.filter((_, i) => i !== current))
    setSelected(Math.max(0, current - 1))
    toast('Step deleted', { action: { label: 'Undo', onClick: () => onChange({ steps }) } })
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 md:flex-row">
      {/* ── Step list, like the guide's side panel ── */}
      <div className="glass-panel order-3 flex min-h-96 flex-col md:min-h-0 overflow-hidden rounded-(--radius) md:order-none md:w-88 md:shrink-0 lg:w-96">
        <div className="shrink-0 px-3 pt-4 pb-2">
          <div className="mb-1.5 flex items-center justify-between">
            <p className="eyebrow text-muted-foreground">Steps</p>
            <p className="text-xs font-medium text-muted-foreground tabular-nums">0 / {steps.length}</p>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-card" />
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-2">
          {sections.map((sec) => {
            const Icon = sectionIcon(sec, steps)
            return (
              <div key={`${sec.group}-${sec.indices[0]}`} className="mb-2 overflow-hidden rounded-(--control-radius) bg-card">
                <div className="flex items-center gap-2.5 px-2.5 py-2">
                  <StatusDot state="upcoming" size="md">
                    <Icon size={15} />
                  </StatusDot>
                  <InlineText
                    label="Section name"
                    value={sec.group}
                    placeholder="Section name"
                    onChange={(name) => setSteps(renameSection(steps, sec, name))}
                    className="text-sm"
                  />
                  <span className="text-xs tabular-nums text-muted-foreground">0/{sec.indices.length}</span>
                </div>
                <div className="px-2 pb-1">
                  {sec.indices.map((i, n) => (
                    <button
                      key={steps[i].id}
                      type="button"
                      onClick={() => setSelected(i)}
                      aria-current={i === current ? 'step' : undefined}
                      className={cn(
                        'mb-1 flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-colors',
                        i === current ? 'bg-glass' : 'hover:bg-background',
                      )}
                    >
                      <StatusDot state={i === current ? 'active' : 'upcoming'}>{n + 1}</StatusDot>
                      <span className={cn('flex-1 truncate text-sm leading-tight', i === current ? 'font-medium text-foreground' : 'text-ink-2')}>
                        {steps[i].title === 'New step' ? <span className="text-muted-foreground">New step</span> : steps[i].title}
                      </span>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => addStep(sec.indices[sec.indices.length - 1] + 1, sec.group)}
                    className="mb-1 flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-muted-foreground hover:bg-background"
                  >
                    <IconPlus className="size-4" aria-hidden />
                    Add step
                  </button>
                </div>
              </div>
            )
          })}
          {steps.length > 0 && (
            <Button variant="ghost" className="w-full text-muted-foreground" onClick={addSection}>
              <IconPlus data-icon="inline-start" />
              Add section
            </Button>
          )}
        </div>

        {/* The sewer's ‹ Mark done › bar; here the arrows move through the steps */}
        <div className={cn('shrink-0 px-3 pt-1 pb-3', steps.length === 0 && 'hidden')}>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSelected(Math.max(0, current - 1))}
              disabled={current <= 0}
              aria-label="Previous step"
              className="flex size-11 items-center justify-center rounded-full bg-card text-foreground disabled:pointer-events-none disabled:opacity-40"
            >
              <IconChevronLeft size={16} stroke={2.5} />
            </button>
            <div
              aria-hidden
              title="Sewers press this when a step is done"
              className="flex h-11 flex-1 cursor-default items-center justify-center gap-1.5 rounded-(--control-radius) bg-primary text-sm font-medium text-primary-foreground"
            >
              <IconCheck size={15} stroke={3} />
              Mark done
            </div>
            <button
              onClick={() => setSelected(Math.min(steps.length - 1, current + 1))}
              disabled={current >= steps.length - 1}
              aria-label="Next step"
              className="flex size-11 items-center justify-center rounded-full bg-card text-foreground disabled:pointer-events-none disabled:opacity-40"
            >
              <IconChevronRight size={16} stroke={2.5} />
            </button>
          </div>
        </div>
      </div>

      {/* ── The drawing, then the instruction panel ── */}
      {step ? (
        <div className="contents md:flex md:min-h-0 md:flex-1 md:flex-col">
          <div className="relative order-1 h-56 shrink-0 overflow-hidden rounded-(--radius) bg-card md:order-none md:h-auto md:min-h-0 md:flex-1">
            <PatternCanvas key={`${step.id}-${step.pieceId}-${step.action}`} piece={piece ?? null} action={step.action} measurements={standardSizes.M} title={step.title} />
            <div className="glass absolute top-3 left-3 flex items-center gap-1 rounded-full py-1 pr-2 pl-3 text-xs">
              Drawing
              <InlinePick className="mx-0 font-medium" label="Drawing" text={piece ? `${piece.label} · ${piece.name}` : 'none'} placeholder="none">
                {pieces.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Add pattern pieces on the pattern page first.</p>
                ) : (
                  <ChipGroup
                    label="Drawing"
                    options={[{ value: NO_PIECE, label: 'None' }, ...pieces.map((p) => ({ value: p.id, label: `${p.label} · ${p.name}` }))]}
                    value={[step.pieceId ?? NO_PIECE]}
                    onValueChange={([v]) => update({ pieceId: v === NO_PIECE ? undefined : v })}
                  />
                )}
              </InlinePick>
            </div>
          </div>

          <section aria-label="Step" className="glass-panel order-2 shrink-0 rounded-(--radius) px-5 py-4 md:order-none md:mt-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{step.group}</span> · Step {(section?.indices.indexOf(current) ?? 0) + 1} of {section?.indices.length ?? 1}
              </p>
              <div className="flex items-center">
                <Button variant="ghost" size="icon-sm" aria-label="Move step up" disabled={current === 0} onClick={() => { const m = moveStep(steps, current, -1); setSteps(m.steps); setSelected(m.index) }}>
                  <IconArrowUp />
                </Button>
                <Button variant="ghost" size="icon-sm" aria-label="Move step down" disabled={current === steps.length - 1} onClick={() => { const m = moveStep(steps, current, 1); setSteps(m.steps); setSelected(m.index) }}>
                  <IconArrowDown />
                </Button>
                <Button variant="ghost" size="icon-sm" aria-label="Delete step" onClick={deleteStep}>
                  <IconTrash />
                </Button>
              </div>
            </div>

            <div className="mb-2 flex items-center gap-2.5">
              <span className="shrink-0 rounded-full bg-card px-2.5 py-0.5 text-xs font-medium">{ACTION_LABELS[step.action]}</span>
              <InlineText
                label="Step title"
                value={step.title === 'New step' ? '' : step.title}
                placeholder="Start with what to do, e.g. Pin the side seams"
                onChange={(title) => update({ title: title || 'New step', action: actionFromTitle(title, step.action) })}
                className="text-lg leading-tight font-semibold"
              />
            </div>

            <InlineTextarea
              label="Step instruction"
              value={step.instruction}
              placeholder="Explain it in short sentences. Give numbers with units: sew 1.5 cm from the edge."
              onChange={(instruction) => update({ instruction })}
              className="max-w-prose text-sm leading-relaxed text-muted-foreground"
            />

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-card py-1 pr-2 pl-3 text-sm font-medium">
                <IconRuler2 size={16} aria-hidden />
                <InlineText
                  label="Key measurement"
                  value={step.measurement ?? ''}
                  placeholder="Add a measurement"
                  onChange={(m) => update({ measurement: m || undefined })}
                  className="field-sizing-content w-auto min-w-24"
                />
              </span>
            </div>

            <div className="mt-3 flex items-start gap-2 rounded-(--control-radius) bg-card px-4 py-3">
              <IconBulb size={18} className="mt-0.5 shrink-0 text-warning-solid" aria-hidden />
              <InlineText
                label="Tip"
                value={step.tip ?? ''}
                placeholder="Add a tip (optional)"
                onChange={(tip) => update({ tip: tip || undefined })}
                className="text-sm data-[empty=true]:bg-transparent"
              />
            </div>
          </section>
        </div>
      ) : (
        <div className="order-1 flex flex-1 flex-col items-center justify-center gap-3 rounded-(--radius) bg-card p-6 text-center md:order-none">
          <IconNeedleThread className="size-8 text-muted-foreground" aria-hidden />
          <p className="text-base font-semibold">No steps yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">You write each step right here, exactly where sewers will read it.</p>
          <Button onClick={addSection}>
            <IconPlus data-icon="inline-start" />
            Add the first step
          </Button>
        </div>
      )}
    </div>
  )
}
