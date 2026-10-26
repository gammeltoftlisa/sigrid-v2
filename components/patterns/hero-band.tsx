'use client'

import { motion, useScroll, useTransform } from 'motion/react'
import { cn } from 'cn'

import { MaskedLine, Rise, useRevealReady } from '@/components/patterns/reveal'

/**
 * The editorial top of a tab screen: an oversized stacked headline on one side, the copy
 * and actions anchored to the bottom of the other (the misalignment is on purpose).
 * Lines wipe in one after another; the headline drifts up gently as you scroll.
 * Put the line that carries the feeling in `<em>` and it turns italic brown.
 */
export function HeroBand({
  kicker,
  lines,
  description,
  actions,
  className,
}: {
  /** Small mono label above the headline */
  kicker?: React.ReactNode
  /** The headline, one entry per line. Keep it to 2–3 short lines. */
  lines: React.ReactNode[]
  description?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}) {
  const ready = useRevealReady()
  const { scrollY } = useScroll()
  const titleY = useTransform(scrollY, [0, 600], [0, -48])

  return (
    <header className={cn('hero-band page-header relative', className)}>
      <div className="hero-band-grid">
        <motion.div style={ready ? { y: titleY } : undefined} className="flex flex-col gap-5">
          {kicker && (
            <Rise>
              <p className="kicker">{kicker}</p>
            </Rise>
          )}
          <h1 className="hero-title">
            {lines.map((line, i) => (
              <MaskedLine key={i} index={i}>
                {line}
              </MaskedLine>
            ))}
          </h1>
        </motion.div>
        {(description || actions) && (
          <Rise index={lines.length} className="flex flex-col gap-6 lg:self-end lg:pb-3">
            {description && <p className="max-w-md text-base text-muted-foreground md:text-lg">{description}</p>}
            {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
          </Rise>
        )}
      </div>
    </header>
  )
}
