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
  IconTrash,
} from '@tabler/icons-react'
import { cn } from 'cn'
import { toast } from 'sonner'

import { useRef, useState } from 'react'

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
import PatternCanvas from '@/components/sewing/PatternCanvas'
import { ACTION_LABELS } from '@/components/sewing/actions'
import { standardSizes } from '@/lib/data'
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
import { PieceShape } from './PieceShape'
import { InlinePick, InlineText, InlineTextarea, TodoMark } from './Inline'
import { SectionPicker } from './SectionPicker'
import { sectionIconKey, type SectionIconKey } from './section-icons'

type Change = (patch: Partial<StudioPattern>) => void

const NO_PIECE = 'none'

const focusLater = (label: string) =>
  requestAnimationFrame(() => document.querySelector<HTMLElement>(`[aria-label="${label}"]`)?.focus())

/**
 * The sewing guide exactly as a sewer sees it (step list on the left, the
 * drawing, the instruction panel underneath), written in place: pick a step in
 * the list and type straight into its instruction panel.
 */
export function StudioGuide({
  pattern,
  onChange,
  selected,
  onSelect,
  pieceFocus,
  onPieceFocus,
  onOpenSizes,
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
    onChange({ pieces: rest, steps: steps.map((s) => (s.pieceId === id ? { ...s, pieceId: undefined } : s)) })
    onPieceFocus(rest[0]?.id ?? '')
    toast('Piece deleted', { action: { label: 'Undo', onClick: () => onChange(before) } })
  }
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

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-3 pt-0 md:flex-row">
      {/* ── Step list, like the guide's side panel ── */}
      <div className="glass-panel order-3 flex min-h-96 flex-col md:min-h-0 overflow-hidden rounded-(--radius) md:order-none md:w-88 md:shrink-0 lg:w-96">
        <div className="shrink-0 px-3 pt-4 pb-2">
          <div className="mb-1.5 flex items-center justify-between">
            <p className="kicker">Steps</p>
            <p className="text-xs font-medium text-muted-foreground tabular-nums">0 / {steps.length}</p>
          </div>
          <div className="stitch-track h-0.5 rounded-full" aria-hidden />
        </div>

        <div ref={listRef} className="flex-1 overflow-y-auto px-2 pb-2">
          {/* First step of the guide: the pattern pieces and their measurements in every size */}
          <div data-slot="inset" className="mb-2 rounded-(--control-radius)">
            <button
              type="button"
              onClick={() => onPieceFocus(pieceFocus === null ? (pieces[0]?.id ?? '') : pieceFocus)}
              className="flex w-full items-center gap-2.5 px-2.5 py-2 text-left"
            >
              <span className="step-dot-upcoming flex size-7 shrink-0 items-center justify-center rounded-full">
                <IconRulerMeasure size={15} aria-hidden />
              </span>
              <span className="flex-1 truncate text-sm">Pattern pieces</span>
              <span className="text-xs tabular-nums text-muted-foreground">
                {pieces.length === 0 ? 'None yet' : `${pieces.filter((p) => pattern.sizes.length > 0 && pattern.sizes.every((s) => pieceSizeDone(p, s))).length}/${pieces.length}`}
              </span>
            </button>
            <div className="px-2 pb-1">
              {pieces.map((p, i) => {
                const on = pieceFocus === p.id
                const done = pattern.sizes.length > 0 && pattern.sizes.every((s) => pieceSizeDone(p, s))
                return (
                  <div key={p.id} className={cn('group/piece mb-1 flex items-center rounded-(--control-radius) pr-1 transition-colors', on ? 'step-row-active' : 'glass-inset-hover')}>
                    <button
                      type="button"
                      onClick={() => onPieceFocus(p.id)}
                      aria-current={on ? 'step' : undefined}
                      className="flex min-w-0 flex-1 items-center gap-2 py-2 pr-1.5 pl-8 text-left outline-none"
                    >
                      <span
                        className={cn(
                          'flex size-5 shrink-0 items-center justify-center rounded-full text-2xs font-semibold',
                          on ? 'step-dot-active' : 'step-dot-upcoming text-muted-foreground',
                        )}
                      >
                        {p.label}
                      </span>
                      <span className={cn('flex-1 truncate text-sm leading-tight', on ? 'font-medium text-foreground' : 'text-foreground')}>
                        {p.name === 'New piece' ? <span className="text-muted-foreground">New piece</span> : p.name}
                      </span>
                      {done ? <IconCheck className="size-3.5 text-muted-foreground" aria-label="All sizes measured" /> : <TodoMark>Measure</TodoMark>}
                    </button>
                    {/* Move the piece in the list; shown on hover, focus, on phones and on the open piece */}
                    {pieces.length > 1 && (
                      <span className={cn('flex shrink-0 opacity-0 transition-opacity group-hover/piece:opacity-100 group-focus-within/piece:opacity-100 pointer-coarse:opacity-100', on && 'opacity-100')}>
                        <Button variant="ghost" size="icon-xs" aria-label={`Move ${p.name} up`} disabled={i === 0} onClick={() => movePiece(i, -1)}>
                          <IconArrowUp />
                        </Button>
                        <Button variant="ghost" size="icon-xs" aria-label={`Move ${p.name} down`} disabled={i === pieces.length - 1} onClick={() => movePiece(i, 1)}>
                          <IconArrowDown />
                        </Button>
                      </span>
                    )}
                  </div>
                )
              })}
              {pieces.length > 0 && (
                <button type="button" onClick={addPiece} className="glass-inset-hover mb-1 flex w-full items-center gap-2 rounded-(--control-radius) px-2.5 py-2 text-left text-sm text-muted-foreground">
                  <IconPlus className="size-4" aria-hidden />
                  Add piece
                </button>
              )}
            </div>
          </div>

          {sections.map((sec) => {
            const firstId = steps[sec.indices[0]].id
            return (
              <div key={`${sec.group}-${sec.indices[0]}`} className="mb-2 rounded-(--control-radius) bg-card">
                <div className="flex items-center gap-2.5 px-2.5 py-2">
                  <SectionPicker
                    title={sec.group}
                    icon={sectionIconKey(sec, steps, pattern.sectionIcons)}
                    open={pickerFor === firstId}
                    onOpenChange={(o) => setPickerFor(o ? firstId : null)}
                    onChange={(next) => setSection(sec, next)}
                  />
                  <InlineText
                    required
                    label="Section name"
                    value={sec.group}
                    placeholder="Section name"
                    onChange={(name) => setSection(sec, { title: name })}
                    className="text-sm"
                  />
                  <span className="text-xs tabular-nums text-muted-foreground">0/{sec.indices.length}</span>
                </div>
                <div className="px-2 pb-1">
                  {sec.indices.map((i, n) => {
                    const s = steps[i]
                    const isCurrent = i === current
                    const others = sections.filter((o) => o.group !== sec.group)
                    return (
                      <div key={s.id} data-drop="row" data-to={i} data-group={sec.group}>
                        {dropLine(i, sec.group)}
                        <div
                          style={drag?.from === i ? { transform: `translateY(${drag.dy}px)` } : undefined}
                          className={cn(
                            'group/row relative mb-1 flex items-center gap-1 rounded-(--control-radius) pr-1',
                            drag?.from === i ? 'z-20 bg-card' : 'transition-colors',
                            isCurrent ? 'step-row-active' : drag ? '' : 'glass-inset-hover',
                          )}
                        >
                          {/* Handle: press and drag to move the step */}
                          <span
                            onPointerDown={(e) => startDrag(e, i)}
                            onPointerMove={moveDrag}
                            onPointerUp={() => endDrag(true)}
                            onPointerCancel={() => endDrag(false)}
                            title="Drag to move"
                            aria-hidden
                            className={cn(
                              'flex h-9 w-6 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground transition-colors select-none hover:text-foreground',
                              drag?.from === i && 'cursor-grabbing text-foreground',
                            )}
                          >
                            <IconGripVertical className="size-4" />
                          </span>
                          <button
                            type="button"
                            onClick={() => setSelected(i)}
                            aria-current={isCurrent ? 'step' : undefined}
                            className="flex min-w-0 flex-1 items-center gap-2 py-2 text-left outline-none"
                          >
                            {/* The step number, also on the step being edited (the guide shows a dot there) */}
                            <span
                              className={cn(
                                'flex size-5 shrink-0 items-center justify-center rounded-full text-2xs font-semibold tabular-nums transition-colors',
                                isCurrent ? 'step-dot-active' : 'step-dot-upcoming text-muted-foreground',
                              )}
                            >
                              {n + 1}
                            </span>
                            <span className={cn('flex-1 truncate text-sm leading-tight', isCurrent ? 'font-medium text-foreground' : 'text-foreground')}>
                              {s.title === 'New step' ? <span className="text-muted-foreground">New step</span> : s.title}
                            </span>
                            {(!s.title.trim() || s.title === 'New step' || !s.instruction.trim()) && <TodoMark className="mr-1">To write</TodoMark>}
                          </button>
                          {/* Everything you can do with a step; also how to move it by keyboard or on a phone */}
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  aria-label={`More for step ${n + 1}, ${s.title}`}
                                  className={cn(
                                    'shrink-0 opacity-0 transition-opacity group-hover/row:opacity-100 group-focus-within/row:opacity-100 aria-expanded:opacity-100 pointer-coarse:opacity-100',
                                    isCurrent && 'opacity-100',
                                  )}
                                />
                              }
                            >
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
                        </div>
                      </div>
                    )
                  })}
                  {dropLine(sec.indices[sec.indices.length - 1] + 1, sec.group)}
                  <button
                    type="button"
                    data-drop="end"
                    data-to={sec.indices[sec.indices.length - 1] + 1}
                    data-group={sec.group}
                    onClick={() => addStep(sec.indices[sec.indices.length - 1] + 1, sec.group)}
                    className="glass-inset-hover mb-1 flex w-full items-center gap-2 rounded-(--control-radius) px-2.5 py-2 text-left text-sm text-muted-foreground"
                  >
                    <IconPlus className="size-4" aria-hidden />
                    Add step
                  </button>
                </div>
              </div>
            )
          })}
          {steps.length === 0 ? (
            <div data-slot="inset" className="mb-2 flex items-center gap-2.5 rounded-(--control-radius) px-2.5 py-2">
              <span className="step-dot-upcoming flex size-7 shrink-0 items-center justify-center rounded-full">
                <IconNeedleThread size={15} aria-hidden />
              </span>
              <span className="flex-1 truncate text-sm">Sewing steps</span>
              {/* The middle panel already offers it when it shows the empty guide */}
              {pieceFocus === null ? (
                <span className="text-xs text-muted-foreground">None yet</span>
              ) : (
                <Button variant="outline" size="xs" onClick={addSection}>
                  <IconPlus data-icon="inline-start" />
                  Add step
                </Button>
              )}
            </div>
          ) : (
            <Button variant="ghost" className="w-full text-muted-foreground" onClick={addSection}>
              <IconPlus data-icon="inline-start" />
              Add section
            </Button>
          )}
        </div>

        {/* The sewer's ‹ Mark done › bar; here the arrows move through the steps */}
        <div className={cn('shrink-0 px-3 pt-1 pb-3', steps.length === 0 && 'hidden')}>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon-lg" onClick={() => setSelected(Math.max(0, current - 1))} disabled={current <= 0} aria-label="Previous step">
              <IconChevronLeft />
            </Button>
            {/* What the sewer sees; here it does nothing, so it isn't a real button */}
            <span aria-hidden title="Sewers press this when a step is done" className="flex-1">
              <Button size="lg" tabIndex={-1} className="pointer-events-none w-full">
                <IconCheck data-icon="inline-start" stroke={2.5} />
                Mark done
              </Button>
            </span>
            <Button variant="outline" size="icon-lg" onClick={() => setSelected(Math.min(steps.length - 1, current + 1))} disabled={current >= steps.length - 1} aria-label="Next step">
              <IconChevronRight />
            </Button>
          </div>
        </div>
      </div>

      {/* ── The drawing, then the instruction panel ── */}
      {pieceFocus !== null ? (
        focusedPiece ? (
          <div className="contents md:flex md:min-h-0 md:flex-1 md:flex-col">
            <div className="relative order-1 h-72 shrink-0 overflow-hidden guide-canvas rounded-(--radius) md:order-none md:h-auto md:min-h-0 md:flex-1">
              <PieceShape piece={focusedPiece} sizes={pattern.sizes} active={activeSize} highlight={activeLine} />
            </div>
            <section aria-label="Piece measurements" className="glass-panel order-2 shrink-0 overflow-y-auto rounded-(--radius) px-5 py-4 md:order-none md:mt-3 md:max-h-1/2">
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
            </section>
          </div>
        ) : (
          <div className="order-1 flex flex-1 flex-col items-center justify-center gap-3 guide-canvas rounded-(--radius) p-6 text-center md:order-none">
            <IconRulerMeasure className="size-8 text-muted-foreground" aria-hidden />
            <h2 className="text-3xl">Start with the <em className="display-italic">pattern pieces</em></h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              Measure each piece from top to bottom, in every size. Sigrid draws it from your numbers, and the steps can show it.
            </p>
            <Button onClick={addPiece}>
              <IconPlus data-icon="inline-start" />
              Add a piece
            </Button>
          </div>
        )
      ) : step ? (
        <div className="contents md:flex md:min-h-0 md:flex-1 md:flex-col">
          <div className="relative order-1 h-56 shrink-0 overflow-hidden guide-canvas rounded-(--radius) md:order-none md:h-auto md:min-h-0 md:flex-1">
            <PatternCanvas key={`${step.id}-${step.pieceId}-${step.action}`} piece={piece ?? null} action={step.action} measurements={standardSizes.M} title={step.title} />
            <div className="glass absolute top-3 left-3 flex items-center gap-1 rounded-full py-1 pr-2 pl-3 text-xs">
              Drawing
              <InlinePick className="mx-0 font-medium" label="Drawing" text={piece ? `${piece.label} · ${piece.name}` : 'none'} placeholder="none">
                {pieces.length === 0 ? (
                  <Button variant="outline" size="sm" onClick={() => onPieceFocus('')}>
                    Add pattern pieces
                  </Button>
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
              <p className="kicker">
                {step.group} · Step {(section?.indices.indexOf(current) ?? 0) + 1} of {section?.indices.length ?? 1}
              </p>
              <div className="flex items-center">
                <Button variant="ghost" size="icon-sm" aria-label="Move step up" disabled={current === 0} onClick={() => move(current, -1)}>
                  <IconArrowUp />
                </Button>
                <Button variant="ghost" size="icon-sm" aria-label="Move step down" disabled={current === steps.length - 1} onClick={() => move(current, 1)}>
                  <IconArrowDown />
                </Button>
                <Button variant="ghost" size="icon-sm" aria-label="Delete step" onClick={() => deleteStep()}>
                  <IconTrash />
                </Button>
              </div>
            </div>

            <div className="mb-2 flex items-center gap-2.5">
              <span className="eyebrow shrink-0 rounded-full bg-card px-2.5 py-1 text-muted-foreground">{ACTION_LABELS[step.action]}</span>
              <InlineText
                required
                label="Step title"
                value={step.title === 'New step' ? '' : step.title}
                placeholder="Start with what to do, e.g. Pin the side seams"
                onChange={(title) => update({ title: title || 'New step', action: actionFromTitle(title, step.action) })}
                className="font-heading text-3xl leading-tight"
              />
            </div>

            <InlineTextarea
              required
              label="Step instruction"
              value={step.instruction}
              placeholder="Explain it in short sentences. Give numbers with units: sew 1.5 cm from the edge."
              onChange={(instruction) => update({ instruction })}
              className="max-w-prose text-base text-muted-foreground"
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
              <IconBulb size={18} className="mt-0.5 shrink-0 text-primary" aria-hidden />
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
        <div className="order-1 flex flex-1 flex-col items-center justify-center gap-3 guide-canvas rounded-(--radius) p-6 text-center md:order-none">
          <IconNeedleThread className="size-8 text-muted-foreground" aria-hidden />
          <h2 className="text-3xl">Write the <em className="display-italic">sewing steps</em></h2>
          <p className="max-w-sm text-sm text-muted-foreground">You write each step right here, exactly where sewers will read it.</p>
          <Button onClick={addSection}>
            <IconPlus data-icon="inline-start" />
            Add a step
          </Button>
        </div>
      )}
    </div>
  )
}
