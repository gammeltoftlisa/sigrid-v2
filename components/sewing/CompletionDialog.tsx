'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { IconX, IconCamera, IconShare, IconStar, IconStarFilled } from '@tabler/icons-react'
import PrimaryButton from '@/components/ui/PrimaryButton'
import SecondaryButton from '@/components/ui/SecondaryButton'
import IconButton from '@/components/ui/IconButton'
import GarmentIllustration from '@/components/ui/GarmentIllustration'
import { TAP_ICON } from '@/components/ui/interaction'
import type { Garment } from '@/lib/types'

const CONFETTI_COLORS = ['#BF8B5E', '#4E7D4F', '#D4903A', '#C5574A', '#C4A882']
const RATING_COPY = ['', "That's a start!", 'Getting there!', 'Good work!', 'Brilliant!', 'Perfect result!']

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
  useEffect(() => {
    if (open) setConfetti(makeConfetti())
  }, [open])

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
            className="absolute inset-0 bg-ink/40"
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
            className="relative w-full md:max-w-md max-h-[92vh] flex flex-col bg-bg rounded-t-3xl md:rounded-3xl shadow-modal overflow-hidden"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          >
            <div className="absolute top-4 right-4 z-10">
              <IconButton label="Close" onClick={onClose}>
                <IconX size={16} />
              </IconButton>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Finished garment + confetti */}
              <div className="relative h-56 flex items-center justify-center bg-surface-2/50 overflow-hidden">
                <motion.div
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 240, damping: 16, delay: 0.15 }}
                  className="w-40 h-40 rounded-full bg-primary-soft flex items-center justify-center p-8 shadow-soft"
                >
                  <GarmentIllustration name={garment.name} className="w-full h-full" />
                </motion.div>
                <div className="absolute inset-0 pointer-events-none">
                  {confetti.map((c, i) => (
                    <motion.div
                      key={i}
                      initial={{ left: `${c.x}%`, y: -20, rotate: c.rotate, opacity: 1 }}
                      animate={{ y: 260, rotate: c.spin, opacity: [1, 1, 0] }}
                      transition={{ duration: c.duration, delay: c.delay, ease: 'easeIn' }}
                      className="absolute top-0 w-2.5 h-2.5 rounded-sm"
                      style={{ backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length] }}
                    />
                  ))}
                </div>
              </div>

              <div className="px-6 pt-6 pb-4">
                <h2 id="done-title" className="text-title font-bold text-ink mb-1">You made this.</h2>
                <p className="text-body text-ink-2 mb-6">{garment.name} is finished. Add it to your wardrobe.</p>

                {/* Rating */}
                <h3 className="text-label font-semibold text-ink mb-2">How did it go?</h3>
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
                          ? <IconStarFilled size={32} className="text-warn" />
                          : <IconStar size={32} className="text-rim" stroke={1.5} />}
                      </motion.span>
                    </motion.button>
                  ))}
                </div>
                <p className="text-center mt-1 h-5 text-caption text-ink-2">{RATING_COPY[rating]}</p>

                {/* Photo */}
                <h3 className="text-label font-semibold text-ink mt-5 mb-2">Show it off</h3>
                <button className="w-full border-2 border-dashed border-rim rounded-3xl h-32 flex flex-col items-center justify-center gap-2 bg-surface hover:bg-surface-2 hover:border-primary/40 active:scale-[0.97] transition duration-150">
                  <IconCamera size={28} className="text-ink-3" stroke={1.5} />
                  <p className="text-label font-semibold text-ink">Upload a photo</p>
                  <p className="text-caption text-ink-3 -mt-1.5">Show the community your creation</p>
                </button>
              </div>
            </div>

            <div className="shrink-0 px-6 pt-3 pb-6 md:pb-5 border-t border-rim flex flex-col gap-2">
              <PrimaryButton href="/explore">Start your next project</PrimaryButton>
              <SecondaryButton>
                <IconShare size={18} />
                Share your creation
              </SecondaryButton>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
