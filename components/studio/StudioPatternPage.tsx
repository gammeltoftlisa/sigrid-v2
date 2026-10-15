'use client'

import { IconChevronDown, IconListCheck, IconPrinter, IconRuler2, IconScissors, IconShirt, IconShoppingBag } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import { ActionBar } from '@/components/patterns/action-bar'
import { ChipGroup } from '@/components/patterns/chip-group'
import { Panel, PanelRow, StepDot } from '@/components/patterns/panel'
import { PhotoLabel } from '@/components/patterns/photo-label'
import { GarmentImage } from '@/components/garment/GarmentArt'
import { TOOLS, type Tool } from '@/components/sewing/tools'
import { baseSize, plural, type StudioPattern } from '@/lib/studio/patterns'
import type { Difficulty, GarmentCategory } from '@/lib/types'
import { InlineNumber, InlinePick, InlineText, InlineTextarea } from './Inline'

type Change = (patch: Partial<StudioPattern>) => void

const CATEGORIES: GarmentCategory[] = ['Tops', 'Bottoms', 'Dresses', 'Outerwear']
const DIFFICULTIES: Difficulty[] = ['Beginner', 'Intermediate', 'Advanced']

/** Looks like PanelRow, but its text is editable and never cut off */
function EditRow({ leading, title, detail }: { leading: React.ReactNode; title: React.ReactNode; detail?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-(--control-radius) bg-card px-2.5 py-2.5">
      {leading}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="text-sm">{title}</div>
        {detail && <div className="text-xs text-muted-foreground">{detail}</div>}
      </div>
    </div>
  )
}

/** A PanelRow that opens something in the studio */
function OpenRow(props: React.ComponentProps<typeof PanelRow> & { onOpen: () => void; action: string }) {
  const { onOpen, action, ...row } = props
  return (
    <button type="button" onClick={onOpen} className="text-left">
      <PanelRow {...row} trailing={<span className="shrink-0 text-xs font-medium">{action}</span>} className="hover:bg-background" />
    </button>
  )
}

/**
 * The pattern's page exactly as sewers see it (the garment page's layout and
 * parts), with its content editable in place. Sizes and pattern pieces open
 * their own windows; "Start sewing" opens the guide, as it does for sewers.
 */
export function StudioPatternPage({
  pattern,
  onChange,
  onOpenSizes,
  onOpenPieces,
  onOpenGuide,
}: {
  pattern: StudioPattern
  onChange: Change
  onOpenSizes: () => void
  onOpenPieces: () => void
  onOpenGuide: () => void
}) {
  const { fabric, sizes } = pattern
  const base = baseSize(sizes)
  const sizeRange = sizes.length === 0 ? '' : sizes.length === 1 ? sizes[0] : `${sizes[0]}–${sizes[sizes.length - 1]}`
  const meters = fabric.metersBySize[base]
  const toolsText = pattern.tools.map((t) => TOOLS[t].label.toLowerCase()).join(', ').replace(/^./, (c) => c.toUpperCase())

  const cta = (
    <Button size="lg" className="w-full" onClick={onOpenGuide}>
      Start sewing{pattern.price ? ` · €${pattern.price}` : ''}
    </Button>
  )

  return (
    <div className="md:grid md:min-h-0 md:flex-1 md:grid-cols-12 md:gap-x-(--grid-gutter) md:pr-8 md:pl-4">
      {/* Garment image, as on the garment page */}
      <div className="md:col-span-6 md:h-full md:min-h-0 md:pb-6">
        <GarmentImage
          name={pattern.name}
          className="mx-4 mt-4 aspect-product rounded-(--radius) sm:mx-6 md:m-0 md:aspect-auto md:h-full"
          artClassName="max-w-72 md:max-w-sm"
          sizes="(min-width: 768px) 50vw, 100vw"
        >
          <PhotoLabel className="absolute bottom-3 left-3 normal-case tracking-normal">Photos can be added later</PhotoLabel>
        </GarmentImage>
      </div>

      <div className="flex flex-col md:col-span-6 md:min-h-0 md:pb-6">
        <div className="flex w-full flex-1 flex-col gap-6 px-4 pt-6 pb-44 sm:px-6 md:min-h-0 md:px-0 md:pt-2 md:pb-0">
          <header className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-4">
              <h1 className="min-w-0 flex-1">
                <InlineText
                  inheritFont
                  label="Pattern name"
                  value={pattern.name === 'Untitled pattern' ? '' : pattern.name}
                  placeholder="Name your pattern"
                  onChange={(name) => onChange({ name: name || 'Untitled pattern' })}
                />
              </h1>
              <InlineNumber label="Price" unit="€" unitBefore value={pattern.price} placeholder="0" onChange={(price) => onChange({ price })} className="shrink-0 text-xl font-medium" />
            </div>
            <p className="flex flex-wrap items-center gap-x-1 text-xs text-muted-foreground">
              <InlinePick label="Difficulty" text={pattern.difficulty} placeholder="Difficulty">
                <ChipGroup
                  label="Difficulty"
                  options={DIFFICULTIES.map((d) => ({ value: d, label: d }))}
                  value={[pattern.difficulty]}
                  onValueChange={([difficulty]) => onChange({ difficulty })}
                />
              </InlinePick>
              ·
              <InlineText
                label="Time to sew"
                value={pattern.estimatedTime}
                placeholder="time, e.g. 3–4 hours"
                onChange={(estimatedTime) => onChange({ estimatedTime })}
                className="field-sizing-content w-auto min-w-16"
              />
              ·
              <button
                type="button"
                onClick={onOpenSizes}
                className="-mx-1 inline-flex items-center gap-0.5 rounded-md px-1 py-0.5 transition-colors hover:bg-foreground/5"
              >
                {sizeRange || 'Add sizes'}
                <IconChevronDown className="size-3 opacity-60" aria-hidden />
              </button>
              ·
              <InlinePick label="Category" text={pattern.category} placeholder="Category">
                <ChipGroup
                  label="Category"
                  options={CATEGORIES.map((c) => ({ value: c, label: c }))}
                  value={[pattern.category]}
                  onValueChange={([category]) => onChange({ category })}
                />
              </InlinePick>
            </p>
            <InlineTextarea
              label="Description"
              value={pattern.description}
              placeholder="Describe the garment in two or three sentences: the shape, what makes it nice, what you learn."
              onChange={(description) => onChange({ description })}
              className="-mx-1 max-w-prose text-sm text-muted-foreground"
            />
          </header>

          {/* One container, like the garment page: rows scroll inside, the main button stays at its bottom */}
          <Panel className="md:min-h-0 md:flex-1" bodyClassName="md:overflow-y-auto" footer={<div className="hidden md:block">{cta}</div>} label="Overview">
            <OpenRow
              onOpen={onOpenGuide}
              action={pattern.steps.length ? 'Edit guide' : 'Write guide'}
              leading={<StepDot state="upcoming"><IconListCheck className="size-3.5" /></StepDot>}
              title={plural(pattern.steps.length, 'step')}
              detail="Stop after any step, your progress is saved."
            />
            <EditRow
              leading={<StepDot state="upcoming"><IconShirt className="size-3.5" /></StepDot>}
              title={<InlineText label="Fabric" value={fabric.name} placeholder="Fabric, e.g. linen or cotton poplin" onChange={(name) => onChange({ fabric: { ...fabric, name } })} />}
              detail={
                <>
                  <span>{meters ? `${meters} m for ${base}` : 'Fabric per size is set under sizes'} · Find fabric</span>
                  <InlineText label="Why this fabric" value={fabric.why} placeholder="Why it suits the garment (optional)" onChange={(why) => onChange({ fabric: { ...fabric, why } })} />
                </>
              }
            />
            <OpenRow
              onOpen={onOpenSizes}
              action={sizes.length ? 'Edit' : 'Add'}
              leading={<StepDot state="upcoming"><IconRuler2 className="size-3.5" /></StepDot>}
              title={sizes.length ? `Size chart · ${sizes.join(', ')}` : 'Sizes'}
              detail={sizes.length ? 'Body measurements and fabric for each size' : 'Choose the sizes and their measurements'}
            />
            <EditRow
              leading={<StepDot state="upcoming"><IconShoppingBag className="size-3.5" /></StepDot>}
              title="Also needed"
              detail={
                <InlineTextarea
                  label="Also needed, one per line"
                  value={pattern.notions.join('\n')}
                  placeholder="One per line: thread, zip 20 cm…"
                  onChange={(v) => onChange({ notions: v.split('\n') })}
                />
              }
            />
            <EditRow
              leading={<StepDot state="upcoming"><IconScissors className="size-3.5" /></StepDot>}
              title="Tools"
              detail={
                <InlinePick label="Tools" text={toolsText} placeholder="Choose tools">
                  <ChipGroup<Tool>
                    multiple
                    label="Tools"
                    options={(Object.keys(TOOLS) as Tool[]).map((t) => ({ value: t, label: TOOLS[t].label }))}
                    value={pattern.tools}
                    onValueChange={(tools) => onChange({ tools })}
                  />
                </InlinePick>
              }
            />
            <OpenRow
              onOpen={onOpenPieces}
              action={pattern.pieces.length ? 'Edit' : 'Add'}
              leading={<StepDot state="upcoming"><IconPrinter className="size-3.5" /></StepDot>}
              title={`Pattern · ${plural(pattern.pieces.length, 'piece')}`}
              detail="Ready once you choose a size"
            />
          </Panel>
        </div>

        {/* Phones: the main button stays reachable, as on the garment page */}
        <ActionBar>{cta}</ActionBar>
      </div>
    </div>
  )
}
