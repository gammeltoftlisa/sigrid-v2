'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { IconChevronDown, IconPrinter } from '@tabler/icons-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
import FlowHeader from '@/components/legacy/FlowHeader'
import { StatusChip } from '@/components/studio/StatusChip'
import { StudioGuide } from '@/components/studio/StudioGuide'
import { CheckSheet, SizesSheet } from '@/components/studio/StudioSheets'
import { useStudioPattern } from '@/lib/studio/use-pattern'
import { isDone, type WizardStep } from '@/lib/studio/wizard'

/** A chip in the guide's top bar, styled like the sewer's size chip */
const chip = 'inline-flex h-8 shrink-0 items-center gap-1 rounded-full bg-glass pr-2.5 pl-3 text-xs font-medium text-foreground transition-colors duration-150 hover:bg-card'

/**
 * The guide editor: the sewing guide exactly as sewers see it, with editing
 * added. The size chip opens Sizes and the print button opens Pattern pieces,
 * where the sewer has the same buttons. Closing goes back to the pattern page.
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

  if (missing) {
    return (
      <main className="flex min-h-dvh items-center justify-center p-6">
        <Empty>
          <EmptyHeader>
            <EmptyTitle>This pattern isn’t here</EmptyTitle>
            <EmptyDescription>It may have been deleted, or it was made in another browser.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button nativeButton={false} render={<Link href="/studio" />}>
              Go to the studio
            </Button>
          </EmptyContent>
        </Empty>
      </main>
    )
  }
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
    <>
      {/* The same sheet as the sewer's guide */}
      <div className="fixed inset-x-0 top-3 bottom-0 flex flex-col overflow-hidden rounded-t-3xl bg-background">
        <FlowHeader garmentName={pattern.name} onClose={() => router.push(`/studio/${id}`)}>
          <div className="flex shrink-0 items-center gap-1">
            <button type="button" onClick={() => setSizesOpen(true)} aria-label={`Sizes: ${sizeText}. Edit sizes`} className={chip}>
              <span className="tabular-nums">{sizeText}</span>
              <IconChevronDown size={12} aria-hidden />
            </button>
            <button
              type="button"
              onClick={openPieces}
              aria-label="Pattern pieces"
              title="Pattern pieces"
              className="flex size-8 items-center justify-center rounded-full bg-glass text-foreground transition-colors duration-150 hover:bg-card"
            >
              <IconPrinter size={14} />
            </button>
            <StatusChip pattern={pattern} onClick={() => setCheckOpen(true)} />
          </div>
        </FlowHeader>

        <StudioGuide
          pattern={pattern}
          onChange={change}
          selected={selected}
          onSelect={setSelected}
          pieceFocus={pieceFocus}
          onPieceFocus={setPieceFocus}
          onOpenSizes={() => setSizesOpen(true)}
        />
      </div>

      <SizesSheet open={sizesOpen} onOpenChange={setSizesOpen} pattern={pattern} onChange={change} />
      <CheckSheet
        open={checkOpen}
        onOpenChange={setCheckOpen}
        pattern={pattern}
        onChange={change}
        onOpen={openPart}
        onMarkReady={() => {
          change({ status: 'ready' })
          toast.success('Ready to publish.')
        }}
      />
    </>
  )
}
