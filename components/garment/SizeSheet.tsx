'use client'

import { useEffect, useState } from 'react'
import { IconBulb, IconColorSwatch } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { SizePicker } from '@/components/patterns/size-picker'
import { StatusMessage } from '@/components/patterns/status-message'
import { useMediaQuery } from '@/hooks/use-media-query'
import { standardSizes, tshirtFabrics } from '@/lib/data'
import { sizeLabel } from '@/lib/sizes'
import type { Garment, StandardSize, UserMeasurements } from '@/lib/types'

type SizeField = keyof UserMeasurements

const fieldLabels: Record<SizeField, string> = {
  bust: 'Bust', waist: 'Waist', hips: 'Hips', height: 'Height', inseam: 'Inseam',
}

interface Props {
  garment: Garment
  open: boolean
  onClose: () => void
  /** Size selected when the sheet opens (current project size, or the profile size) */
  initialSize: StandardSize | null
  onConfirm: (size: StandardSize) => void
  /**
   * Set when a project is already under way: picking a different size then
   * shows a warning that progress will be reset.
   */
  progress?: { size: StandardSize; done: number; total: number }
}

/** Choose (or change) the size a project is sewn in. Bottom drawer on phones, dialog from md up. */
export default function SizeSheet({ garment, open, onClose, initialSize, onConfirm, progress }: Props) {
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const [size, setSize] = useState<StandardSize | null>(initialSize)
  const fabric = tshirtFabrics[0]

  // Re-sync each time the sheet opens
  useEffect(() => {
    if (open) setSize(initialSize && garment.sizes.includes(initialSize) ? initialSize : null)
  }, [open, initialSize, garment.sizes])

  const isChange = !!progress
  const changed = isChange && size !== null && size !== progress.size
  const willReset = changed && progress.done > 0

  const chartFields: SizeField[] = garment.category === 'Bottoms' ? ['waist', 'hips', 'inseam'] : ['bust', 'waist', 'hips']

  const title = isChange ? 'Change size' : 'Choose your size'
  const description = isChange
    ? `You’re sewing ${garment.name} in ${sizeLabel(progress.size)}.`
    : 'Your pattern is drafted in this size. You can change it later, though that starts the steps again.'

  const confirmLabel = !size
    ? 'Choose a size to continue'
    : !isChange
      ? `Start sewing in ${sizeLabel(size)}`
      : !changed
        ? `Keep ${sizeLabel(size)}`
        : willReset
          ? `Restart in ${sizeLabel(size)}`
          : `Change to ${sizeLabel(size)}`

  const confirm = () => {
    if (!size) return
    if (isChange && !changed) onClose()
    else onConfirm(size)
  }

  const body = (
    <div className="flex flex-col gap-4">
      <SizePicker sizes={garment.sizes} value={size} onValueChange={setSize} current={progress?.size} />

      {size ? (
        <dl className="grid grid-cols-3 gap-2">
          {chartFields.map((f) => (
            <div key={f} className="flex flex-col gap-0.5 rounded-lg bg-muted px-3 py-2 text-center">
              <dt className="text-xs text-muted-foreground">{fieldLabels[f]}</dt>
              <dd className="text-sm font-medium whitespace-nowrap tabular-nums">{standardSizes[size][f]} cm</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="text-sm text-muted-foreground">Choose a size to see its body measurements.</p>
      )}

      <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
        {!isChange && size && size === initialSize && <li>Your size from your profile.</li>}
        {size && (
          <li className="flex items-start gap-2">
            <IconColorSwatch className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span className="tabular-nums">
              {fabric.quantityMeters} m of {fabric.name.toLowerCase()} for {sizeLabel(size)}
            </span>
          </li>
        )}
        <li className="flex items-start gap-2">
          <IconBulb className="mt-0.5 size-4 shrink-0" aria-hidden />
          Between two sizes? Go for the larger one. It’s easier to take in than let out.
        </li>
      </ul>

      {willReset && (
        <StatusMessage status="warning" title="This starts the steps again">
          You’ve done {progress.done} of {progress.total} steps in {sizeLabel(progress.size)}. A new size means new pattern
          pieces, so you’ll begin again from the first step.
        </StatusMessage>
      )}
    </div>
  )

  const confirmButton = (
    <Button size="lg" className="w-full" variant={willReset ? 'destructive' : 'default'} disabled={!size} onClick={confirm}>
      {confirmLabel}
    </Button>
  )

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="gap-5 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          {body}
          <DialogFooter>{confirmButton}</DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()} showSwipeHandle>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription>{description}</DrawerDescription>
        </DrawerHeader>
        <div className="overflow-y-auto px-4 pt-2">{body}</div>
        <DrawerFooter className="pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">{confirmButton}</DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
