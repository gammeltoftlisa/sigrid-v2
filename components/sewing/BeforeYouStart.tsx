'use client'

import { useRef } from 'react'
import { IconPrinter, IconScissors, IconShirt } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PanelRow, StepDot } from '@/components/patterns/panel'

/** Shown the first time a guide opens: what to have on the table before step 1. */
export default function BeforeYouStart({
  open,
  printHref,
  fabricHref,
  fabricDetail,
  tools,
  onReady,
}: {
  open: boolean
  printHref: string
  fabricHref: string
  fabricDetail: string
  tools: string
  onReady: () => void
}) {
  // Start on the main button, not on the first link
  const readyButton = useRef<HTMLButtonElement>(null)
  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onReady() }}>
      <DialogContent initialFocus={readyButton}>
        <DialogHeader>
          <DialogTitle>Before you start</DialogTitle>
          <DialogDescription>Get these ready and the steps go smoothly.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <PanelRow
            href={printHref}
            external
            leading={<StepDot state="upcoming"><IconPrinter className="size-3.5" /></StepDot>}
            title="Print the pattern"
            detail="Opens in a new tab, in your size"
          />
          <PanelRow
            href={fabricHref}
            leading={<StepDot state="upcoming"><IconShirt className="size-3.5" /></StepDot>}
            title="Get your fabric"
            detail={fabricDetail}
          />
          {tools && (
            <PanelRow
              leading={<StepDot state="upcoming"><IconScissors className="size-3.5" /></StepDot>}
              title="Have your tools nearby"
              detail={tools}
            />
          )}
        </div>
        <DialogFooter>
          <Button ref={readyButton} size="lg" className="w-full" onClick={onReady}>I’m ready</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
