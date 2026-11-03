'use client'

import {
  IconArrowDown,
  IconArrowUp,
  IconBulb,
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconCopy,
  IconDotsVertical,
  IconGripVertical,
  IconNeedleThread,
  IconPlus,
  IconRuler2,
  IconRulerMeasure,
  IconTool,
  IconTrash,
} from '@tabler/icons-react'
import { cn } from 'cn'
import { toast } from 'sonner'

import { useMemo, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChipGroup } from '@/components/patterns/chip-group'
import { PanelSheet } from '@/components/patterns/panel-sheet'
import { StepDot } from '@/components/patterns/panel'
import { ProductFrame } from '@/components/patterns/product-grid'
import { StatusBadge } from '@/components/patterns/status-badge'
import PatternCanvas from '@/components/sewing/PatternCanvas'
import { StageProgress } from '@/components/sewing/StageProgress'
import { ACTION_LABELS } from '@/components/sewing/actions'
import { TOOLS, type Tool } from '@/components/sewing/tools'
import { standardSizes } from '@/lib/data'
import { groupIntoJourneys } from '@/lib/journeys'
import {
  actionFromTitle,
  duplicateStep,
  baseSize,
  insertStep,
  isDrawable,
  newPiece,
  pieceSizeDone,
  moveStep,
  moveStepTo,
  renameSection,
  sectionsOf,
  type Section,
  type StudioPattern,
  type StudioPiece,
  type StudioStep,
} from '@/lib/studio/patterns'
import type { StandardSize } from '@/lib/types'
import { PieceEditor } from './PieceEditor'
import { isSecondCut, pieceOf, stepPieceIds } from '@/lib/assembly'
import type { JoinKind } from '@/lib/types'
import { PieceShape } from './PieceShape'
import { InlinePick, InlineText, InlineTextarea, TodoMark } from './Inline'
import { SectionPicker } from './SectionPicker'
import { sectionIconKey, type SectionIconKey } from './section-icons'

type Change = (patch: Partial<StudioPattern>) => void

const focusLater = (label: string) =>
  requestAnimationFrame(() => document.querySelector<HTMLElement>(`[aria-label="${label}"]`)?.focus())

const unwritten = (s: StudioStep) => !s.title.trim() || s.title === 'New step' || !s.instruction.trim()

/**
 * The sewing guide exactly as a sewer sees it, written in place: the step card on one side with the
 * step's title, instruction, measurement, tool and tip typed straight into it, and the picture on the
 * other. All steps (in the top bar) opens the whole guide in a sheet, where steps and sections are
 * added, renamed, dragged and deleted. Pattern pieces are the guide's first step, measured in the card.
 */
export function StudioGuide({
  pattern,
  onChange,
  selected,
  onSelect,
  pieceFocus,
  onPieceFocus,
  onOpenSizes,
  stepsOpen,
  onStepsOpenChange,
}: {
  pattern: StudioPattern
  onChange: Change
  /** The step on the canvas; the page owns it so other places can open a step */
  selected: number
  onSelect: (index: number) => void
  /** The pattern piece being measured ('' = the pieces step with nothing picked), or null when a sewing step is shown */
  pieceFocus: string | null
  onPieceFocus: (id: string | null) => void
  onOpenSizes: () => void
  /** The All steps sheet */
  stepsOpen: boolean
  onStepsOpenChange: (open: boolean) => void
}) {
  const { steps, pieces } = pattern
  // Picking a sewing step leaves the pieces step
  const setSelected = (i: number) => {
    onPieceFocus(null)
    onSelect(i)
  }
  const [pieceSize, setPieceSize] = useState<StandardSize>(baseSize(pattern.sizes))
  const focusedPiece = pieceFocus ? pieces.find((p) => p.id === pieceFocus) : undefined
  // The measurement line being worked on, highlighted in the drawing
  const [activeLine, setActiveLine] = useState<string | null>(null)
  const activeSize = pattern.sizes.includes(pieceSize) ? pieceSize : baseSize(pattern.sizes)
  const addPiece = () => {
    const piece = newPiece(pieces)
    onChange({ pieces: [...pieces, piece] })
    onPieceFocus(piece.id)
    focusLater('Piece name')
  }
  // Reorder the pieces; their letters follow the new order (steps link to pieces by id, so nothing breaks)
  const movePiece = (from: number, dir: -1 | 1) => {
    const to = from + dir
    if (to < 0 || to >= pieces.length) return
    const next = [...pieces]
    ;[next[from], next[to]] = [next[to], next[from]]
    onChange({ pieces: next.map((p, i) => ({ ...p, label: String.fromCharCode(65 + (i % 26)) })) })
  }
  const updatePiece = (next: StudioPiece) => onChange({ pieces: pieces.map((p) => (p.id === next.id ? next : p)) })
  const deletePiece = (id: string) => {
    const before = { pieces, steps }
    const rest = pieces.filter((p) => p.id !== id)
    onChange({
      pieces: rest,
      steps: steps.map((s) => {
        const ids = stepPieceIds(s).filter((p) => pieceOf(p) !== id)
        return { ...s, pieceId: ids[0], pieceIds: ids.length > 1 ? ids : undefined, secondPieceId: undefined }
      }),
    })
    onPieceFocus(rest[0]?.id ?? '')
    toast('Piece deleted', { action: { label: 'Undo', onClick: () => onChange(before) } })
  }
  const current = Math.min(selected, steps.length - 1)
  const step = steps[current]
  const sections = sectionsOf(steps)
  const section = sections.find((s) => s.indices.includes(current))
  const piece = step?.pieceId ? pieces.find((p) => p.id === step.pieceId && isDrawable(p)) : undefined
  // The pieces this step is about; joined ones are drawn together, as the sewer will see them
  const stepIds = step ? stepPieceIds(step) : []
  const drawablePieces = pieces.filter(isDrawable)
  const labelOf = (pid: string) => {
    const p = pieces.find((x) => x.id === pieceOf(pid))
    return p ? `${p.label}${isSecondCut(pid) ? '²' : ''}` : '?'
  }
  const drawingText = stepIds.length === 0 ? 'none' : stepIds.map(labelOf).join(' + ')

  const setSteps = (next: StudioStep[]) => onChange({ steps: next })
  const update = (patch: Partial<StudioStep>) => setSteps(steps.map((s, i) => (i === current ? { ...s, ...patch } : s)))

  const addStep = (at: number, group: string) => {
    setSteps(insertStep(steps, at, group))
    setSelected(at)
    focusLater('Step title')
  }
  // The section whose icon chooser is open, by the id of its first step
  const [pickerFor, setPickerFor] = useState<number | null>(null)
  const addSection = () => {
    let n = 1
    const name = () => (steps.length === 0 ? 'Prepare' : n === 1 ? 'New section' : `New section ${n}`)
    while (steps.some((s) => s.group === name())) n++
    const newId = steps.reduce((m, s) => Math.max(m, s.id), 0) + 1
    setSteps(insertStep(steps, steps.length, name()))
    setSelected(steps.length)
    // A new section starts by choosing what it is
    setPickerFor(newId)
  }
  /** Changes a section's title and/or icon; the icon follows the section when it is renamed */
  const setSection = (sec: Section, next: { title?: string; icon?: SectionIconKey }) => {
    const icons = { ...pattern.sectionIcons }
    const title = next.title ?? sec.group
    if (next.icon) {
      if (title !== sec.group) delete icons[sec.group]
      icons[title] = next.icon
    } else if (title !== sec.group) {
      // Renamed by typing: an icon the maker picked moves with the section; one that was only
      // guessed from the old name is dropped, so the new name gets its own guess
      const kept = icons[sec.group]
      delete icons[sec.group]
      if (kept && kept !== sectionIconKey(sec, steps)) icons[title] = kept
    }
    onChange({ steps: title !== sec.group ? renameSection(steps, sec, title) : steps, sectionIcons: icons })
  }
  const deleteStep = (index = current) => {
    setSteps(steps.filter((_, i) => i !== index))
    setSelected(Math.max(0, index <= current ? current - 1 : current))
    toast('Step deleted', { action: { label: 'Undo', onClick: () => onChange({ steps }) } })
  }
  const move = (from: number, dir: -1 | 1) => {
    const m = moveStep(steps, from, dir)
    setSteps(m.steps)
    if (from === current) setSelected(m.index)
  }
  const moveTo = (from: number, to: number, group: string) => {
    const m = moveStepTo(steps, from, to, group)
    setSteps(m.steps)
    setSelected(m.index)
  }

  // Dragging: press the handle and move. Built on pointer events, so it works the same
  // with a mouse, a trackpad and a finger. The step follows the pointer, a thin line
  // shows where it will land, and the list scrolls near its edges.
  const listRef = useRef<HTMLDivElement>(null)
  const [drag, setDrag] = useState<{ from: number; startY: number; dy: number } | null>(null)
  const [drop, setDrop] = useState<{ to: number; group: string } | null>(null)

  /** Where a step would land at this height: before/after a step, or at the end of a section */
  const targetAt = (y: number) => {
    const els = [...(listRef.current?.querySelectorAll<HTMLElement>('[data-drop]') ?? [])]
    for (const el of els) {
      const r = el.getBoundingClientRect()
      if (y < r.bottom) {
        const to = Number(el.dataset.to)
        const group = el.dataset.group ?? ''
        return el.dataset.drop === 'row' ? { to: y < r.top + r.height / 2 ? to : to + 1, group } : { to, group }
      }
    }
    const last = els[els.length - 1]
    return last ? { to: Number(last.dataset.to), group: last.dataset.group ?? '' } : null
  }

  const startDrag = (e: React.PointerEvent, i: number) => {
    if (e.button !== 0) return
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    setDrag({ from: i, startY: e.clientY, dy: 0 })
    setDrop(null)
  }
  const moveDrag = (e: React.PointerEvent) => {
    if (!drag) return
    setDrag({ ...drag, dy: e.clientY - drag.startY })
    setDrop(targetAt(e.clientY))
    const list = listRef.current
    if (list) {
      const r = list.getBoundingClientRect()
      if (e.clientY < r.top + 40) list.scrollTop -= 12
      if (e.clientY > r.bottom - 40) list.scrollTop += 12
    }
  }
  const endDrag = (apply: boolean) => {
    if (apply && drag && drop) {
      const samePlace = (drop.to === drag.from || drop.to === drag.from + 1) && steps[drag.from].group === drop.group
      if (!samePlace) moveTo(drag.from, drop.to, drop.group)
    }
    setDrag(null)
    setDrop(null)
  }
  /** The landing line; takes no room, so nothing shifts under the pointer */
  const dropLine = (to: number, group: string) =>
    drop && drop.to === to && drop.group === group ? (
      <div aria-hidden className="relative h-0">
        <div className="absolute inset-x-2.5 -top-1 h-0.5 rounded-full bg-foreground" />
      </div>
    ) : null


  const journeys = useMemo(() => groupIntoJourneys(steps, { keepSections: true }), [steps])
  const inSection = section ? section.indices.indexOf(current) + 1 : 1
  const next = step ? steps[current + 1] : undefined
  const tool = step?.tool ? TOOLS[step.tool] : null
  // Picking anything in the sheet shows it and closes the sheet, as in the sewer's guide
  const pick = (i: number) => {
    setSelected(i)
    onStepsOpenChange(false)
  }
  const pickPiece = (id: string) => {
    onPieceFocus(id)
    onStepsOpenChange(false)
  }

  /** Everything you can do with a step: in the card's corner and on each row of the list */
  const stepMenu = (i: number, n: number, s: StudioStep, className?: string) => {
    const others = sections.filter((o) => o.group !== s.group)
    return (
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`More for step ${n}, ${s.title}`} className={className} />}>
          <IconDotsVertical />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem disabled={i === 0} onClick={() => move(i, -1)}>
            <IconArrowUp />
            Move up
          </DropdownMenuItem>
          <DropdownMenuItem disabled={i === steps.length - 1} onClick={() => move(i, 1)}>
            <IconArrowDown />
            Move down
          </DropdownMenuItem>
          {others.length > 0 && (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Move to section</DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-48">
                {others.map((o) => (
                  <DropdownMenuItem key={`${o.group}-${o.indices[0]}`} onClick={() => moveTo(i, o.indices[o.indices.length - 1] + 1, o.group)}>
                    {o.group}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          )}
          <DropdownMenuItem
            onClick={() => {
              setSteps(duplicateStep(steps, i))
              setSelected(i + 1)
            }}
          >
            <IconCopy />
            Duplicate
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => deleteStep(i)}>
            <IconTrash />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  const piecesDone = pieces.filter((p) => pattern.sizes.length > 0 && pattern.sizes.every((s) => pieceSizeDone(p, s))).length

  // ── All steps: the whole guide, as the sewer's list, with everything to build it ──
  const list = (
    <div ref={listRef} className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-4 pb-4">
      {/* First step of the guide: the pattern pieces and their measurements in every size */}
      <div className="overflow-hidden rounded-(--control-radius) border">
        <button type="button" onClick={() => pickPiece(pieceFocus ?? pieces[0]?.id ?? '')} aria-current={pieceFocus !== null ? 'step' : undefined} className="guide-step flex w-full items-center gap-3 px-2.5 py-2.5 text-left">
          <StepDot state="upcoming"><IconRulerMeasure className="size-3.5" /></StepDot>
          <span className="min-w-0 flex-1 truncate text-sm">Pattern pieces</span>
          <span className="text-xs tabular-nums text-muted-foreground">{pieces.length === 0 ? 'None yet' : `${piecesDone}/${pieces.length}`}</span>
        </button>
        <ol className="flex flex-col gap-1 px-2 pt-1 pb-2">
          {pieces.map((p, i) => {
            const on = pieceFocus === p.id
            const done = pattern.sizes.length > 0 && pattern.sizes.every((s) => pieceSizeDone(p, s))
            return (
              <li key={p.id} className="group/piece flex items-center gap-1">
                <button type="button" onClick={() => pickPiece(p.id)} aria-current={on ? 'step' : undefined} className="guide-step flex min-w-0 flex-1 items-center gap-2.5 rounded-(--control-radius) px-2 py-1.5 text-left">
                  <StepDot state={on ? 'active' : 'upcoming'} className="size-6">{p.label}</StepDot>
                  <span className={cn('min-w-0 flex-1 truncate text-sm', on && 'font-medium')}>
                    {p.name === 'New piece' ? <span className="text-muted-foreground">New piece</span> : p.name}
                  </span>
                  {done ? <IconCheck className="size-3.5 text-muted-foreground" aria-label="All sizes measured" /> : <TodoMark>Measure</TodoMark>}
                </button>
                {pieces.length > 1 && (
                  <span className="flex shrink-0 opacity-0 transition-opacity group-hover/piece:opacity-100 group-focus-within/piece:opacity-100 pointer-coarse:opacity-100">
                    <Button variant="ghost" size="icon-xs" aria-label={`Move ${p.name} up`} disabled={i === 0} onClick={() => movePiece(i, -1)}>
                      <IconArrowUp />
                    </Button>
                    <Button variant="ghost" size="icon-xs" aria-label={`Move ${p.name} down`} disabled={i === pieces.length - 1} onClick={() => movePiece(i, 1)}>
                      <IconArrowDown />
                    </Button>
                  </span>
                )}
              </li>
            )
          })}
          <li>
            <button
              type="button"
              onClick={() => {
                addPiece()
                onStepsOpenChange(false)
              }}
              className="guide-step flex w-full items-center gap-2.5 rounded-(--control-radius) px-2 py-1.5 text-left text-sm text-muted-foreground"
            >
              <IconPlus className="size-4" aria-hidden />
              Add piece
            </button>
          </li>
        </ol>
      </div>

      {sections.map((sec) => {
        const firstId = steps[sec.indices[0]].id
        return (
          <div key={`${sec.group}-${sec.indices[0]}`} className="rounded-(--control-radius) border">
            <div className="flex items-center gap-2.5 px-2.5 py-2">
              <SectionPicker
                title={sec.group}
                icon={sectionIconKey(sec, steps, pattern.sectionIcons)}
                open={pickerFor === firstId}
                onOpenChange={(o) => setPickerFor(o ? firstId : null)}
                onChange={(nextIcon) => setSection(sec, nextIcon)}
              />
              <InlineText required label="Section name" value={sec.group} placeholder="Section name" onChange={(name) => setSection(sec, { title: name })} className="text-sm" />
              <span className="text-xs tabular-nums text-muted-foreground">{sec.indices.length}</span>
            </div>
            <ol className="flex flex-col gap-1 px-2 pt-1 pb-2">
              {sec.indices.map((i, n) => {
                const s = steps[i]
                const isCurrent = pieceFocus === null && i === current
                return (
                  <li key={s.id} data-drop="row" data-to={i} data-group={sec.group}>
                    {dropLine(i, sec.group)}
                    <div
                      style={drag?.from === i ? { transform: `translateY(${drag.dy}px)` } : undefined}
                      className={cn('group/row relative flex items-center gap-1', drag?.from === i && 'z-20')}
                    >
                      {/* Handle: press and drag to move the step */}
                      <span
                        onPointerDown={(e) => startDrag(e, i)}
                        onPointerMove={moveDrag}
                        onPointerUp={() => endDrag(true)}
                        onPointerCancel={() => endDrag(false)}
                        title="Drag to move"
                        aria-hidden
                        className={cn('flex h-9 w-5 shrink-0 cursor-grab touch-none items-center justify-center text-muted-foreground select-none hover:text-foreground', drag?.from === i && 'cursor-grabbing text-foreground')}
                      >
                        <IconGripVertical className="size-4" />
                      </span>
                      <button type="button" onClick={() => pick(i)} aria-current={isCurrent ? 'step' : undefined} className={cn('guide-step flex min-w-0 flex-1 items-center gap-2.5 rounded-(--control-radius) px-2 py-1.5 text-left', drag?.from === i && 'bg-card')}>
                        <StepDot state={isCurrent ? 'active' : 'upcoming'} className="size-6">{n + 1}</StepDot>
                        <span className={cn('min-w-0 flex-1 truncate text-sm', isCurrent && 'font-medium')}>
                          {s.title === 'New step' ? <span className="text-muted-foreground">New step</span> : s.title}
                        </span>
                        {unwritten(s) && <TodoMark>To write</TodoMark>}
                      </button>
                      {stepMenu(i, n + 1, s, 'shrink-0 opacity-0 transition-opacity group-hover/row:opacity-100 group-focus-within/row:opacity-100 aria-expanded:opacity-100 pointer-coarse:opacity-100')}
                    </div>
                  </li>
                )
              })}
              {dropLine(sec.indices[sec.indices.length - 1] + 1, sec.group)}
              <li>
                <button
                  type="button"
                  data-drop="end"
                  data-to={sec.indices[sec.indices.length - 1] + 1}
                  data-group={sec.group}
                  onClick={() => {
                    addStep(sec.indices[sec.indices.length - 1] + 1, sec.group)
                    onStepsOpenChange(false)
                  }}
                  className="guide-step flex w-full items-center gap-2.5 rounded-(--control-radius) px-2 py-1.5 text-left text-sm text-muted-foreground"
                >
                  <IconPlus className="size-4" aria-hidden />
                  Add step
                </button>
              </li>
            </ol>
          </div>
        )
      })}
      <Button
        variant="ghost"
        className="w-full text-muted-foreground"
        onClick={() => {
          addSection()
          onStepsOpenChange(false)
        }}
      >
        <IconPlus data-icon="inline-start" />
        Add section
      </Button>
    </div>
  )

  // ── The card: what the sewer reads for this step, typed straight into it ──
  let card: React.ReactNode
  if (pieceFocus !== null) {
    card = (
      <section aria-label="Piece measurements" className="glass-panel step-card flex min-h-0 flex-1 flex-col overflow-hidden rounded-(--radius) border">
        <header className="container-head flex items-baseline justify-between gap-3">
          <p className="eyebrow min-w-0 truncate text-muted-foreground">Pattern pieces</p>
          <p className="shrink-0 text-xs font-medium text-brand-ink tabular-nums">{pieces.length === 0 ? 'None yet' : `${piecesDone} of ${pieces.length} measured`}</p>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-1 pb-4">
          {focusedPiece ? (
            <PieceEditor
              // A fresh editor per piece, so nothing typed or opened on one piece shows on the next
              key={focusedPiece.id}
              pattern={pattern}
              piece={focusedPiece}
              size={activeSize}
              onSize={setPieceSize}
              onPiece={updatePiece}
              onDelete={() => deletePiece(focusedPiece.id)}
              onOpenSizes={onOpenSizes}
              onActiveLine={setActiveLine}
            />
          ) : (
            <div className="flex flex-col gap-3">
              <h2 className="title-lg">Start with the <em className="display-italic">pattern pieces</em></h2>
              <p className="max-w-prose text-base text-muted-foreground">Measure each piece from top to bottom, in every size. Sigrid draws it from your numbers, and the steps can show it.</p>
            </div>
          )}
        </div>
        <footer className="flex items-center gap-2 border-t p-3">
          {focusedPiece ? (
            <Button variant="outline" size="lg" className="flex-1" onClick={() => onPieceFocus(null)} disabled={steps.length === 0}>
              <IconNeedleThread data-icon="inline-start" />
              Go to the steps
            </Button>
          ) : null}
          <Button size="lg" className="flex-1" onClick={addPiece}>
            <IconPlus data-icon="inline-start" />
            Add piece
          </Button>
        </footer>
      </section>
    )
  } else if (step) {
    card = (
      <section aria-label="This step" className="glass-panel step-card flex min-h-0 flex-1 flex-col overflow-hidden rounded-(--radius) border">
        {/* Where you are, as the sewer sees it */}
        <header className="container-head flex flex-col gap-2.5">
          <div className="flex items-baseline justify-between gap-3">
            <p className="eyebrow min-w-0 truncate text-muted-foreground">
              {step.group}
              {section && section.indices.length > 1 ? ` · ${inSection} of ${section.indices.length}` : ''}
            </p>
            <p className="shrink-0 text-xs font-medium text-brand-ink tabular-nums">Step {current + 1} of {steps.length}</p>
          </div>
          <StageProgress journeys={journeys} completedUntil={0} total={steps.length} />
        </header>

        {/* What to do, written where it will be read */}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-1 pb-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <StatusBadge status="neutral">{ACTION_LABELS[step.action]}</StatusBadge>
              {unwritten(step) && <TodoMark>To write</TodoMark>}
              {stepMenu(current, current + 1, step, 'ml-auto')}
            </div>
            <h2 className="title-lg">
              <InlineTextarea
                inheritFont
                required
                label="Step title"
                value={step.title === 'New step' ? '' : step.title}
                placeholder="Start with what to do, e.g. Pin the side seams"
                onChange={(title) => update({ title: title.replace(/\n/g, ' ') || 'New step', action: actionFromTitle(title, step.action) })}
              />
            </h2>
            <InlineTextarea
              required
              label="Step instruction"
              value={step.instruction}
              placeholder="Explain it in short sentences. Give numbers with units: sew 1.5 cm from the edge."
              onChange={(instruction) => update({ instruction })}
              className="max-w-prose text-base leading-relaxed"
            />

            <ul className="flex flex-wrap gap-2">
              <li className="step-fact">
                <IconRuler2 aria-hidden />
                <InlineText label="Key measurement" value={step.measurement ?? ''} placeholder="Add a measurement" onChange={(m) => update({ measurement: m || undefined })} className="field-sizing-content w-auto min-w-24" />
              </li>
              <li className="step-fact">
                {tool ? <tool.Icon aria-hidden /> : <IconTool aria-hidden />}
                <InlinePick label="Tool" text={tool?.label ?? ''} placeholder="Add a tool">
                  <ChipGroup<Tool>
                    label="Tool"
                    options={(Object.keys(TOOLS) as Tool[]).map((t) => ({ value: t, label: TOOLS[t].label }))}
                    value={step.tool ? [step.tool] : []}
                    onValueChange={([t]) => update({ tool: t === step.tool ? undefined : t })}
                  />
                </InlinePick>
              </li>
            </ul>

            <aside className="step-tip">
              <IconBulb aria-hidden />
              <InlineTextarea label="Tip" value={step.tip ?? ''} placeholder="Add a tip (optional)" onChange={(tip) => update({ tip: tip || undefined })} />
            </aside>

            {next && (
              <button type="button" data-control onClick={() => setSelected(current + 1)} className="step-next">
                <span className="eyebrow text-muted-foreground">Next</span>
                <span className="min-w-0 truncate">{next.title}</span>
                <IconChevronRight aria-hidden className="ml-auto size-4 shrink-0 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        {/* The sewer's ‹ Mark done › bar; here the middle button adds the next step */}
        <footer className="flex items-center gap-2 border-t p-3">
          <Button variant="outline" size="icon-lg" onClick={() => setSelected(Math.max(0, current - 1))} disabled={current <= 0} aria-label="Previous step">
            <IconChevronLeft />
          </Button>
          <Button size="lg" className="flex-1" onClick={() => addStep(current + 1, step.group)}>
            <IconPlus data-icon="inline-start" />
            Add step
          </Button>
          <Button variant="outline" size="icon-lg" onClick={() => setSelected(Math.min(steps.length - 1, current + 1))} disabled={current >= steps.length - 1} aria-label="Next step">
            <IconChevronRight />
          </Button>
        </footer>
      </section>
    )
  } else {
    card = (
      <section aria-label="Sewing steps" className="glass-panel step-card flex min-h-0 flex-1 flex-col overflow-hidden rounded-(--radius) border">
        <header className="container-head">
          <p className="eyebrow text-muted-foreground">Sewing steps</p>
        </header>
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pt-1 pb-4">
          <h2 className="title-lg">Write the <em className="display-italic">sewing steps</em></h2>
          <p className="max-w-prose text-base text-muted-foreground">You write each step right here, exactly where sewers will read it.</p>
        </div>
        <footer className="border-t p-3">
          <Button size="lg" className="w-full" onClick={addSection}>
            <IconPlus data-icon="inline-start" />
            Add the first step
          </Button>
        </footer>
      </section>
    )
  }

  // ── The picture: the piece, the step's drawing, or the empty floor ──
  let picture: React.ReactNode
  if (pieceFocus !== null) {
    picture = focusedPiece ? (
      <PieceShape piece={focusedPiece} sizes={pattern.sizes} active={activeSize} highlight={activeLine} />
    ) : (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <IconRulerMeasure className="size-8" aria-hidden />
      </div>
    )
  } else if (step) {
    picture = (
      <>
        <PatternCanvas key={`${step.id}-${stepIds.join('+')}-${step.action}`} steps={steps} index={current} pieces={drawablePieces} measurements={standardSizes.M} />
        {/* Which pieces the drawing shows: on the picture, where you see the result */}
        <div className="glass-chip absolute top-3 left-3 flex items-center gap-1 rounded-full py-1 pr-2 pl-3 text-xs">
          Drawing
          <InlinePick className="mx-0 font-medium" label="Drawing" text={stepIds.length === 1 && piece ? `${piece.label} · ${piece.name}` : drawingText} placeholder="none">
            {pieces.length === 0 ? (
              <Button variant="outline" size="sm" onClick={() => onPieceFocus('')}>
                Add pattern pieces
              </Button>
            ) : (
              <div className="flex flex-col gap-2">
                <ChipGroup
                  multiple
                  label="Drawing"
                  options={pieces.flatMap((p) => [
                    { value: p.id, label: `${p.label} · ${p.name}` },
                    // A piece cut twice can join its own second cut (two halves, two collar layers)
                    ...(p.quantity >= 2 ? [{ value: `${p.id}#2`, label: `${p.label}² · second ${p.name.toLowerCase()}` }] : []),
                  ])}
                  value={stepIds}
                  onValueChange={(ids) => {
                    // Keep the order they were picked in: the first one is the base the others join
                    const ordered = [...stepIds.filter((x) => ids.includes(x)), ...ids.filter((x) => !stepIds.includes(x))]
                    update({ pieceId: pieceOf(ordered[0] ?? '') || undefined, pieceIds: ordered.length > 1 ? ordered : undefined, secondPieceId: undefined })
                  }}
                />
                {stepIds.length > 1 && (
                  <div className="flex flex-col gap-1.5">
                    <p className="text-xs text-muted-foreground">How {stepIds.slice(1).map(labelOf).join(' + ')} {stepIds.length > 2 ? 'go' : 'goes'} onto {labelOf(stepIds[0])}</p>
                    <ChipGroup<JoinKind>
                      label="How the pieces meet"
                      options={[
                        { value: 'side', label: 'Side by side' },
                        { value: 'top', label: 'Onto the top edge' },
                        { value: 'layer', label: 'Laid on top' },
                      ]}
                      value={[step.join ?? 'side']}
                      onValueChange={([join]) => update({ join })}
                    />
                  </div>
                )}
                <p className="max-w-72 text-xs text-muted-foreground">Pick two or more when this step joins pieces; the first is the one the others go onto. What earlier steps joined stays together.</p>
              </div>
            )}
          </InlinePick>
        </div>
      </>
    )
  } else {
    picture = (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <IconNeedleThread className="size-8" aria-hidden />
      </div>
    )
  }

  return (
    <>
      <PanelSheet
        open={stepsOpen}
        onOpenChange={onStepsOpenChange}
        title="All steps"
        description="Pick one to write it. Drag a step by its handle to move it."
      >
        {list}
      </PanelSheet>

      {/* One step at a time, the same frame as the sewer's guide. Phones: the picture on top. */}
      <div className="guide-body px-4 pb-3 md:pr-8 md:pb-6 md:pl-4">
        <div className="order-2 flex min-h-0 flex-1 flex-col md:order-none md:col-span-5 lg:col-span-4 xl:col-span-3">{card}</div>
        <div className="order-1 guide-canvas-pane flex shrink-0 flex-col md:order-none md:col-span-7 md:h-auto md:min-h-0 lg:col-span-8 xl:col-span-9">
          <ProductFrame className="flex min-h-0 flex-1 flex-col p-2 md:p-3">
            <div className="relative min-h-0 flex-1 overflow-hidden rounded-(--image-radius)">{picture}</div>
          </ProductFrame>
        </div>
      </div>
    </>
  )
}
