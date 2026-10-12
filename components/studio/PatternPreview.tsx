import { IconListCheck, IconPrinter, IconRuler2, IconScissors, IconShirt, IconShoppingBag } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import { Panel, PanelRow, StepDot } from '@/components/patterns/panel'
import { GarmentImage } from '@/components/garment/GarmentArt'
import { TOOLS } from '@/components/sewing/tools'
import { baseSize, plural, type StudioPattern } from '@/lib/studio/patterns'

/**
 * The pattern's page as a sewer sees it on their phone, built from the same
 * pieces as the real garment page. Read-only: it fills in as the maker types.
 */
export function PatternPreview({ pattern }: { pattern: StudioPattern }) {
  const named = pattern.name !== 'Untitled pattern'
  const sizes = pattern.sizes.length ? `${pattern.sizes[0]}–${pattern.sizes[pattern.sizes.length - 1]}` : null
  const meta = [pattern.difficulty, pattern.estimatedTime.trim(), sizes].filter(Boolean).join(' · ')
  const notions = pattern.notions.map((n) => n.trim()).filter(Boolean)
  const base = baseSize(pattern.sizes)
  const meters = pattern.fabric.metersBySize[base]
  const chart = pattern.sizes.map((s) => pattern.sizeChart[s]).filter((b) => b?.bust)
  const range = (key: 'bust' | 'hips') => {
    const v = chart.map((b) => b![key]!).filter(Boolean)
    return v.length ? `${Math.min(...v)}–${Math.max(...v)} cm` : ''
  }
  const tools = pattern.tools.map((t) => TOOLS[t].label.toLowerCase()).join(', ').replace(/^./, (c) => c.toUpperCase())

  return (
    <div className="flex flex-col gap-5">
      <GarmentImage name={pattern.name} className="aspect-cover rounded-(--radius)" artClassName="max-w-40" sizes="400px" />

      <header className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-4">
          <p className={named ? 'text-2xl font-semibold tracking-tight' : 'text-2xl font-semibold tracking-tight text-muted-foreground'}>
            {named ? pattern.name : 'Your pattern'}
          </p>
          <p className="text-xl font-medium tabular-nums">{pattern.price ? `€${pattern.price}` : '€–'}</p>
        </div>
        <p className="text-xs text-muted-foreground">{meta}</p>
        <p className="max-w-prose text-sm text-muted-foreground">{pattern.description.trim() || 'Your description appears here.'}</p>
      </header>

      <Panel label="Overview" footer={<Button size="lg" className="w-full" tabIndex={-1}>Start sewing{pattern.price ? ` · €${pattern.price}` : ''}</Button>}>
        <PanelRow
          leading={<StepDot state="upcoming"><IconListCheck className="size-3.5" /></StepDot>}
          title={plural(pattern.steps.length, 'step')}
          detail="Stop after any step, your progress is saved."
        />
        <PanelRow
          leading={<StepDot state="upcoming"><IconShirt className="size-3.5" /></StepDot>}
          title={pattern.fabric.name.trim() || 'Fabric'}
          detail={meters ? `${meters} m for ${base} · Find fabric` : 'Find fabric'}
        />
        {chart.length > 0 && (
          <PanelRow
            leading={<StepDot state="upcoming"><IconRuler2 className="size-3.5" /></StepDot>}
            title={`Size chart · ${pattern.sizes.join(', ')}`}
            detail={`Bust ${range('bust')} · Hips ${range('hips')}`}
          />
        )}
        {notions.length > 0 && (
          <PanelRow leading={<StepDot state="upcoming"><IconShoppingBag className="size-3.5" /></StepDot>} title="Also needed" detail={notions.join(', ')} />
        )}
        {tools && <PanelRow leading={<StepDot state="upcoming"><IconScissors className="size-3.5" /></StepDot>} title="Tools" detail={tools} />}
        {pattern.pieces.length > 0 && (
          <PanelRow
            leading={<StepDot state="upcoming"><IconPrinter className="size-3.5" /></StepDot>}
            title={`Pattern · ${plural(pattern.pieces.length, 'piece')}`}
            detail="Ready once you choose a size"
          />
        )}
      </Panel>
    </div>
  )
}
