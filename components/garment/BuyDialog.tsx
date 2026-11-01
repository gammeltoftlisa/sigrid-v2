'use client'

import { useState } from 'react'
import Link from 'next/link'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Spinner } from '@/components/ui/spinner'

/**
 * Before paying: Swedish distance-selling law (see the refund policy) only ends the right to cancel
 * digital content if the buyer asked to start straight away and confirmed they understand that.
 */
export function BuyDialog({ open, name, price, busy, onOpenChange, onConfirm }: { open: boolean; name: string; price: number; busy: boolean; onOpenChange: (open: boolean) => void; onConfirm: () => void }) {
  const [agreed, setAgreed] = useState(false)
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Buy {name} for €{price}</AlertDialogTitle>
          <AlertDialogDescription>You pay on Stripe’s page. If you haven’t opened the pattern or the guide, you can cancel within 14 days. Read the <Link href="/legal/terms" target="_blank" rel="noopener" className="underline underline-offset-4">terms</Link> and <Link href="/legal/refunds" target="_blank" rel="noopener" className="underline underline-offset-4">refund policy</Link>.</AlertDialogDescription>
        </AlertDialogHeader>
        <label className="flex items-start gap-3 text-sm">
          <Checkbox checked={agreed} onCheckedChange={setAgreed} className="mt-0.5" />
          <span>I want to start straight away, and I understand I lose the right to cancel once I open the pattern or the guide.</span>
        </label>
        <AlertDialogFooter>
          <AlertDialogCancel>Not now</AlertDialogCancel>
          <AlertDialogAction disabled={!agreed || busy} onClick={onConfirm}>
            {busy && <Spinner data-icon="inline-start" />}
            Go to payment
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
