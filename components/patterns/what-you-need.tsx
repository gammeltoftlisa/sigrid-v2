'use client'

import Link from 'next/link'
import { cn } from 'cn'
import { IconChevronRight, IconShirt, type Icon } from '@tabler/icons-react'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { supplyHref, type PatternSupplies } from '@/lib/fabric/supplies'

import { supplyIcon } from './supply-icon'

interface Thing {
  id: string
  name: string
  detail?: string
  href?: string
  Icon: Icon
}

function Tile({ thing }: { thing: Thing }) {
  const body = (
    <>
      <span aria-hidden className="icon-bubble size-10">
        <thing.Icon />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-sm font-medium">{thing.name}</span>
        {thing.detail && <span className="text-xs text-muted-foreground">{thing.detail}</span>}
      </span>
      {thing.href && <IconChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover/row:translate-x-0.5" aria-hidden />}
    </>
  )
  const className = 'flex items-center gap-3 rounded-(--control-radius) p-2.5'
  return thing.href ? (
    <Link href={thing.href} data-control className={cn('press-row group/row outline-none transition-colors', className)}>
      {body}
    </Link>
  ) : (
    <div className={cn('border border-transparent', className)}>{body}</div>
  )
}

/** Everything a pattern needs, each with its picture. What the shop carries opens there; the rest you'll have or find elsewhere. */
export function WhatYouNeedDialog({
  open,
  onOpenChange,
  garmentId,
  fabric,
  supplies,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  garmentId: string
  /** The fabric, first in the list */
  fabric: { name: string; detail: string }
  supplies: PatternSupplies
}) {
  const toThing = (s: PatternSupplies['basics'][number]): Thing => ({ id: s.id, name: s.name, detail: s.detail, href: s.search ? supplyHref(garmentId, s) : undefined, Icon: supplyIcon(s) })
  const forThisPattern: Thing[] = [{ id: 'fabric', name: fabric.name, detail: fabric.detail, href: `/fabric?garment=${garmentId}`, Icon: IconShirt }, ...supplies.special.map(toThing)]
  const basics = supplies.basics.map(toThing)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85svh] flex-col gap-3 sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>What you’ll need</DialogTitle>
          <DialogDescription>{supplies.complete ? 'Choose one to find it in the shop.' : 'Choose one to find it in the shop. The full list comes with the guide.'}</DialogDescription>
        </DialogHeader>
        <div className="flex min-h-0 flex-col gap-3 overflow-y-auto">
          <section className="flex flex-col gap-2">
            <h3 className="eyebrow text-muted-foreground">For this pattern</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {forThisPattern.map((t) => (
                <Tile key={t.id} thing={t} />
              ))}
            </div>
          </section>
          <section className="flex flex-col gap-2">
            <h3 className="eyebrow text-muted-foreground">The basics</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {basics.map((t) => (
                <Tile key={t.id} thing={t} />
              ))}
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}
