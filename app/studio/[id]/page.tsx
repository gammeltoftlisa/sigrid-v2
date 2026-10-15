'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
import { AppShell } from '@/components/patterns/app-nav'
import { PageBreadcrumbs } from '@/components/patterns/page-breadcrumbs'
import { StatusChip } from '@/components/studio/StatusChip'
import { StudioPatternPage } from '@/components/studio/StudioPatternPage'
import { CheckSheet, SizesSheet } from '@/components/studio/StudioSheets'
import { useStudioPattern } from '@/lib/studio/use-pattern'
import type { WizardStep } from '@/lib/studio/wizard'

/** Where each part of the page is typed in, for the last check to jump to */
const FIELD_FOR: Partial<Record<WizardStep, string>> = {
  basics: 'Pattern name',
  describe: 'Description',
  materials: 'Fabric',
}

/**
 * The studio opens on the pattern's page, exactly as sewers see it, with its
 * content editable. "Start sewing" opens the guide editor, like it opens the
 * guide for sewers.
 */
export default function StudioPatternRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { pattern, missing, change } = useStudioPattern(id)
  const [sizesOpen, setSizesOpen] = useState(false)
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

  const openGuide = () => router.push(`/studio/${id}/guide`)

  // From the last check: go wherever a part is filled in
  const openPart = (part: WizardStep) => {
    setCheckOpen(false)
    if (part === 'sizes') return setSizesOpen(true)
    if (part === 'pieces') return router.push(`/studio/${id}/guide?pieces`)
    if (part === 'guide') return openGuide()
    const label = FIELD_FOR[part]
    // Wait for the sheet to close, then put the cursor in the field
    setTimeout(() => document.querySelector<HTMLElement>(`[aria-label="${label}"]`)?.focus(), 250)
  }

  return (
    <AppShell>
      <main className="min-h-svh md:flex md:h-svh md:flex-col md:overflow-hidden">
        {/* The garment page's top line; the studio adds only the status chip */}
        <div className="shrink-0 px-4 md:pr-8 md:pl-4">
          <div className="top-bar flex h-14 items-center gap-2">
            <PageBreadcrumbs items={[{ label: 'Pattern studio', href: '/studio' }, { label: pattern.name }]} />
            <StatusChip pattern={pattern} onClick={() => setCheckOpen(true)} className="ml-auto" />
          </div>
        </div>

        <StudioPatternPage
          pattern={pattern}
          onChange={change}
          onOpenSizes={() => setSizesOpen(true)}
          onOpenPieces={() => router.push(`/studio/${id}/guide?pieces`)}
          onOpenGuide={openGuide}
        />
      </main>

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
    </AppShell>
  )
}
