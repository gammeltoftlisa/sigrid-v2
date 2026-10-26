'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { IconX, IconCamera, IconShare, IconStar, IconStarFilled } from '@tabler/icons-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { GarmentArt } from '@/components/garment/GarmentArt'
import { TAP_ICON } from '@/components/legacy/interaction'
import { cn } from '@/lib/utils'
import type { Garment } from '@/lib/types'

// Fabric colourways, so the moment feels like Sigrid rather than a party popper
// The data ramp from the design tokens, so confetti stays in the palette
const CONFETTI_COLORS = ['bg-data-1', 'bg-data-2', 'bg-data-3', 'bg-data-4', 'bg-glass']
// A thank-you, not a grade: every make counts
const RATING_COPY = ['', 'Thanks for telling us. The next one gets easier.', 'Thanks. Every make teaches something.', 'Good to hear.', 'Lovely. That’s a real achievement.', 'Wonderful. Enjoy wearing it.']

type ConfettiPiece = { x: number; rotate: number; spin: number; duration: number; delay: number }

const makeConfetti = (): ConfettiPiece[] =>
  Array.from({ length: 16 }, () => ({
    x: 5 + Math.random() * 90,
    rotate: Math.random() * 360,
    spin: Math.random() * 720,
    duration: 2 + Math.random() * 1.5,
    delay: Math.random() * 1,
  }))

interface Props {
  garment: Garment
  open: boolean
  onClose: () => void
}

/** Shown over the guide when the last step is marked done. */
export default function CompletionDialog({ garment, open, onClose }: Props) {
  const [rating, setRating] = useState(0)
  const [hoveredStar, setHoveredStar] = useState(0)
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([])

  // Fresh confetti each time it opens (created in the browser, so no hydration mismatch)
  const [wasOpen, setWasOpen] = useState(false)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) setConfetti(makeConfetti())
  }

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const shown = hoveredStar || rating

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          <motion.div
            className="guide-overlay absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="done-title"
            className="done-dialog relative w-full md:max-w-md flex flex-col rounded-t-pane-lg md:rounded-pane-lg overflow-hidden"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          >
            <div className="absolute top-4 right-4 z-10">
              <Button variant="outline" size="icon-lg" aria-label="Close" onClick={onClose}>
                <IconX />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Finished garment + confetti */}
              <div className="done-hero relative h-56 flex items-center justify-center overflow-hidden">
                <motion.div
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 240, damping: 16, delay: 0.15 }}
                  className="w-40 h-40 rounded-(--radius) bg-muted flex items-center justify-center p-8"
                >
                  <GarmentArt name={garment.name} className="w-full h-full" />
                </motion.div>
                <div className="absolute inset-0 pointer-events-none">
                  {confetti.map((c, i) => (
                    <motion.div
                      key={i}
                      initial={{ left: `${c.x}%`, y: -20, rotate: c.rotate, opacity: 1 }}
                      animate={{ y: 260, rotate: c.spin, opacity: [1, 1, 0] }}
                      transition={{ duration: c.duration, delay: c.delay, ease: 'easeIn' }}
                      className={cn('absolute top-0 size-2.5 rounded-xs', CONFETTI_COLORS[i % CONFETTI_COLORS.length])}
                    />
                  ))}
                </div>
              </div>

              <div className="px-6 pt-6 pb-4">
                <p className="kicker mb-3">Finished</p>
                <h2 id="done-title" className="text-5xl mb-3">You <em className="display-italic">made</em> this.</h2>
                <p className="text-base text-muted-foreground mb-6">{garment.name} is finished, and you sewed every seam. Take a moment to enjoy it.</p>

                {/* Rating */}
                <h3 className="eyebrow text-muted-foreground mb-2">How did it go?</h3>
                <div className="flex gap-2 justify-center" role="radiogroup" aria-label="Rate your make">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <motion.button
                      key={star}
                      role="radio"
                      aria-checked={rating === star}
                      aria-label={`${star} star${star > 1 ? 's' : ''}`}
                      whileTap={TAP_ICON}
                      onMouseEnter={() => setHoveredStar(star)}
                      onMouseLeave={() => setHoveredStar(0)}
                      onClick={() => setRating(star)}
                      className="p-1 rounded-full"
                    >
                      <motion.span
                        animate={{ scale: star <= shown ? 1.12 : 1 }}
                        transition={{ duration: 0.15 }}
                        className="block"
                      >
                        {star <= shown
                          ? <IconStarFilled size={32} className="text-primary" />
                          : <IconStar size={32} className="text-muted-foreground" stroke={1.5} />}
                      </motion.span>
                    </motion.button>
                  ))}
                </div>
                <p className="text-center mt-1 h-5 text-xs text-muted-foreground">{RATING_COPY[rating]}</p>

                {/* Photo */}
                <h3 className="eyebrow text-muted-foreground mt-6 mb-2">Keep a record</h3>
                <button data-slot="inset" className="glass-inset-hover press w-full rounded-(--radius) h-32 flex flex-col items-center justify-center gap-2 border border-dashed">
                  <IconCamera size={28} className="text-muted-foreground" stroke={1.5} aria-hidden />
                  <p className="text-sm font-medium">Add a photo</p>
                  <p className="text-xs text-muted-foreground -mt-1.5">Remember what you made, and how far you’ve come</p>
                </button>
              </div>
            </div>

            <div className="shrink-0 px-6 pt-3 pb-6 md:pb-5 flex flex-col gap-2">
              <Button size="lg" className="w-full" nativeButton={false} render={<Link href="/explore" />}>
                Start your next project
              </Button>
              <Button size="lg" variant="outline" className="w-full">
                <IconShare data-icon="inline-start" />
                Share your creation
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
