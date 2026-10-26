'use client'

import { IconCheck, IconCircleCheck } from '@tabler/icons-react'
import { cn } from 'cn'

import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { PUBLISHED_PREFIX } from '@/lib/published'
import { PanelSheet } from '@/components/patterns/panel-sheet'
import { StatusMessage } from '@/components/patterns/status-message'
import type { StudioPattern } from '@/lib/studio/patterns'
import { WIZARD, isDone, missingFor, type WizardStep } from '@/lib/studio/wizard'
import { SizesForm } from './StepForms'

type Change = (patch: Partial<StudioPattern>) => void

function Body({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 pb-4">{children}</div>
}

/**
 * The last check before publishing: what's done and what still needs something,
 * each with a way to it, and "Mark ready to publish" once all is filled in.
 */
export function CheckSheet({
  open,
  onOpenChange,
  pattern,
  onChange,
  onOpen,
  onMarkReady,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  pattern: StudioPattern
  onChange: Change
  /** Takes the maker to where a part is filled in */
  onOpen: (part: WizardStep) => void
  onMarkReady: () => void
}) {
  const parts = WIZARD.filter((w) => w.id !== 'publish')
  const left = parts.filter((w) => !isDone(w.id, pattern))

  return (
    <PanelSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Check and publish"
      description="Everything sewers need, in one list."
      footer={
        pattern.publishedAt ? (
          <>
            <Button size="lg" variant="outline" onClick={() => onChange({ publishedAt: null })}>
              Unpublish
            </Button>
            <Button size="lg" className="ml-auto" nativeButton={false} render={<Link href={`/garment/${PUBLISHED_PREFIX}${pattern.id}`} />}>
              View product page
            </Button>
          </>
        ) : (
          <Button size="lg" className="ml-auto" disabled={left.length > 0} onClick={onMarkReady}>
            <IconCircleCheck data-icon="inline-start" />
            Publish
          </Button>
        )
      }
    >
      <Body>
        {left.length > 0 ? (
          <StatusMessage status="warning" title={left.length === 1 ? 'One part still needs something' : `${left.length} parts still need something`} />
        ) : pattern.publishedAt ? (
          <StatusMessage status="success" title="Published">
            It’s in Explore with its own product page. Changes you make show there straight away.
          </StatusMessage>
        ) : (
          <StatusMessage status="info" title="Everything is filled in">
            Publish it when you have looked it over. It appears in Explore with its own product page.
          </StatusMessage>
        )}
        <ol className="flex flex-col gap-2">
          {parts.map((w) => {
            const missing = missingFor(w.id, pattern)
            return (
              <li key={w.id} className="flex items-center gap-3 rounded-(--control-radius) bg-card p-3">
                <span
                  className={cn(
                    'flex size-7 shrink-0 items-center justify-center rounded-full',
                    missing.length ? 'bg-muted text-muted-foreground' : 'bg-accent text-primary',
                  )}
                >
                  {missing.length ? <span className="size-1.5 rounded-full bg-current" /> : <IconCheck className="size-3.5" stroke={2.5} aria-label="Done" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{w.title}</p>
                  <p className="text-xs text-muted-foreground">{missing.length ? `Add ${missing.join(' and ')}` : 'Done'}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => onOpen(w.id)}>
                  {missing.length ? 'Finish' : 'Edit'}
                </Button>
              </li>
            )
          })}
        </ol>
      </Body>
    </PanelSheet>
  )
}

/** Sizes, the size chart and the fabric each size needs: everything that changes with size */
export function SizesSheet({ open, onOpenChange, pattern, onChange }: { open: boolean; onOpenChange: (o: boolean) => void; pattern: StudioPattern; onChange: Change }) {
  return (
    <PanelSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Sizes"
      description="Every size needs its own measurements. Fill in one size, then let Sigrid estimate the rest for you to check."
      footer={
        <Button size="lg" className="ml-auto" onClick={() => onOpenChange(false)}>
          Done
        </Button>
      }
    >
      <Body>
        <SizesForm pattern={pattern} onChange={onChange} />
      </Body>
    </PanelSheet>
  )
}
