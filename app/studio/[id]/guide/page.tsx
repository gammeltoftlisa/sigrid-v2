'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { IconChevronDown, IconListNumbers, IconRulerMeasure } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import { AppShell } from '@/components/patterns/app-nav'
import { PageBreadcrumbs } from '@/components/patterns/page-breadcrumbs'
import { PatternMissing } from '@/components/studio/PatternMissing'
import { StatusChip } from '@/components/studio/StatusChip'
import { StudioGuide } from '@/components/studio/StudioGuide'
import { CheckSheet, SizesSheet } from '@/components/studio/StudioSheets'
import { useStudioPattern } from '@/lib/studio/use-pattern'
import { isDone, type WizardStep } from '@/lib/studio/wizard'

/**
 * The guide editor: the sewing guide exactly as sewers see it, with editing added. The same top line
 * (All steps, the size, the pattern), the same step card and picture. Here the size opens Sizes and
 * the pattern button opens Pattern pieces, where the sewer has the same buttons.
 */
export default function StudioGuidePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { pattern, missing, change } = useStudioPattern(id)
  const [selected, setSelected] = useState(0)
  const [sizesOpen, setSizesOpen] = useState(false)
  // The pieces step ('' = open with nothing picked) or null for the sewing steps; undefined until decided
  const [pieceFocusState, setPieceFocus] = useState<string | null | undefined>(undefined)
  const [checkOpen, setCheckOpen] = useState(false)
  const [stepsOpen, setStepsOpen] = useState(false)

  if (missing) return <PatternMissing />
  if (!pattern) return null

  // The guide opens on the pieces step when asked to (?pieces), or while the pieces aren't measured and no steps are written yet
  const piecesAsked = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('pieces')
  const pieceFocus =
    pieceFocusState !== undefined
      ? pieceFocusState
      : piecesAsked || (pattern.steps.length === 0 && !isDone('pieces', pattern))
        ? (pattern.pieces[0]?.id ?? '')
        : null
  const openPieces = () => setPieceFocus(pattern.pieces[0]?.id ?? '')

  // From the last check: go wherever a part is filled in
  const openPart = (part: WizardStep) => {
    setCheckOpen(false)
    if (part === 'sizes') setSizesOpen(true)
    else if (part === 'pieces') openPieces()
    else if (part === 'guide') {
      setPieceFocus(null)
      setSelected(Math.max(0, pattern.steps.findIndex((s) => !s.title.trim() || s.title === 'New step' || !s.instruction.trim())))
    } else router.push(`/studio/${id}`)
  }

  const sizes = pattern.sizes
  const sizeText = sizes.length === 0 ? 'Add sizes' : sizes.length === 1 ? sizes[0] : `${sizes[0]}–${sizes[sizes.length - 1]}`

  return (
    <AppShell>
      <main className="guide-page">
        {/* The sewer's guide top line; the studio adds only its status chip */}
        <div className="shrink-0 px-4 md:pr-8 md:pl-4">
          <div className="top-bar flex h-14 items-center gap-2">
            <PageBreadcrumbs
              className="hidden min-w-0 whitespace-nowrap sm:flex"
              items={[
                { label: 'Pattern studio', href: '/studio' },
                { label: pattern.name, href: `/studio/${id}` },
                { label: 'Sewing guide' },
              ]}
            />
            <div className="ml-auto flex shrink-0 items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setStepsOpen(true)} aria-label="All steps">
                <IconListNumbers data-icon="inline-start" />
                <span className="max-sm:sr-only">All steps</span>
              </Button>
              <Button variant="outline" size="sm" className="tabular-nums" onClick={() => setSizesOpen(true)} aria-label={`Sizes: ${sizeText}. Edit sizes`}>
                {sizeText}
                <IconChevronDown data-icon="inline-end" />
              </Button>
              <Button variant="outline" size="icon" onClick={openPieces} aria-label="Pattern pieces" title="Pattern pieces">
                <IconRulerMeasure />
              </Button>
              <StatusChip pattern={pattern} onClick={() => setCheckOpen(true)} />
            </div>
          </div>
        </div>

        <h1 className="sr-only">{pattern.name}: sewing guide</h1>
        <StudioGuide
          pattern={pattern}
          onChange={change}
          selected={selected}
          onSelect={(i) => {
            setPieceFocus(null)
            setSelected(i)
          }}
          pieceFocus={pieceFocus}
          onPieceFocus={setPieceFocus}
          onOpenSizes={() => setSizesOpen(true)}
          stepsOpen={stepsOpen}
          onStepsOpenChange={setStepsOpen}
        />
      </main>

      <SizesSheet open={sizesOpen} onOpenChange={setSizesOpen} pattern={pattern} onChange={change} />
      <CheckSheet
        open={checkOpen}
        onOpenChange={setCheckOpen}
        pattern={pattern}
        onChange={change}
        onOpen={openPart}
      />
    </AppShell>
  )
}
