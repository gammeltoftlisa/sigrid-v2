'use client'

import { use, useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { getGarmentById, tshirtSteps } from '@/lib/data'
import PrimaryButton from '@/components/ui/PrimaryButton'
import StepTracker from '@/components/ui/StepTracker'
import SubStepPanel from '@/components/ui/SubStepPanel'

const SewingGuide = dynamic(() => import('@/components/three/SewingGuide'), { ssr: false })

export default function CompletePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const garment = getGarmentById(id)
  const router = useRouter()
  const [rating, setRating] = useState(0)
  const [hoveredStar, setHoveredStar] = useState(0)

  return (
    <div className="fixed inset-0 flex flex-col bg-[#F9F7F4]">
      <StepTracker current="complete" garmentId={id} garmentName={garment.name} stepProgress={rating > 0 ? 0.5 : 0} />

      <div className="flex-1 flex flex-row overflow-hidden">
        <SubStepPanel
          current="complete"
          activeSubStep={rating > 0 ? 1 : 0}
          onNext={() => router.push('/home')}
          onPrev={() => router.push(`/garment/${id}/guide`)}
          onExit={() => router.push('/home')}
          isLast
        />

        {/* Right 2/3 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto flex flex-col">
            {/* 3D rotating garment */}
            <div className="h-[40vh] relative flex-shrink-0">
              <SewingGuide
                steps={tshirtSteps}
                currentStep={tshirtSteps.length - 1}
                isCompleted={true}
              />

              {/* Confetti overlay */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {Array.from({ length: 16 }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{
                      x: `${10 + Math.random() * 80}vw`,
                      y: -20,
                      rotate: Math.random() * 360,
                      opacity: 1,
                    }}
                    animate={{
                      y: '110vh',
                      rotate: Math.random() * 720,
                      opacity: [1, 1, 0],
                    }}
                    transition={{
                      duration: 2.5 + Math.random() * 2,
                      delay: Math.random() * 1.5,
                      ease: 'easeIn',
                    }}
                    className="absolute w-2.5 h-2.5 rounded-sm"
                    style={{
                      backgroundColor: ['#BF8B5E', '#4E7D4F', '#D4903A', '#C5574A', '#C4A882'][i % 5],
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="px-6 pt-6 pb-safe flex-1">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h1 className="text-display font-bold text-ink mb-2">You made this. 🎉</h1>
                <p className="text-body text-ink-2 mb-8">Add it to your wardrobe.</p>
              </motion.div>

              {/* Photo upload */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mb-6"
              >
                <h2 className="text-heading font-semibold text-ink mb-3">Show it off</h2>
                <button className="w-full border-2 border-dashed border-rim rounded-3xl h-48 flex flex-col items-center justify-center gap-3 bg-surface">
                  <span className="text-4xl">📸</span>
                  <div className="text-center">
                    <p className="text-label font-semibold text-ink">Upload a photo</p>
                    <p className="text-caption text-ink-3">Show the community your creation</p>
                  </div>
                </button>
              </motion.div>

              {/* Rating */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mb-8"
              >
                <h2 className="text-heading font-semibold text-ink mb-3">How did it go?</h2>
                <div className="flex gap-3 justify-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <motion.button
                      key={star}
                      whileTap={{ scale: 0.85 }}
                      onMouseEnter={() => setHoveredStar(star)}
                      onMouseLeave={() => setHoveredStar(0)}
                      onClick={() => setRating(star)}
                      className="text-4xl leading-none"
                    >
                      <motion.span
                        animate={{
                          scale: star <= (hoveredStar || rating) ? 1.15 : 1,
                        }}
                        transition={{ duration: 0.15 }}
                        className="block"
                      >
                        {star <= (hoveredStar || rating) ? '⭐' : '☆'}
                      </motion.span>
                    </motion.button>
                  ))}
                </div>
                {rating > 0 && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center mt-3 text-label text-ink-2"
                  >
                    {['', "That's a start!", "Getting there!", 'Good work!', 'Brilliant!', 'Perfect result!'][rating]}
                  </motion.p>
                )}
              </motion.div>

              {/* Actions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex flex-col gap-3 pb-8"
              >
                <button className="w-full flex items-center justify-center gap-2 bg-surface border border-rim py-4 rounded-full text-label font-semibold text-ink shadow-soft">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M4 12V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M16 6L12 2L8 6M12 2V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Share your creation
                </button>

                <Link href="/home">
                  <PrimaryButton>Start your next project</PrimaryButton>
                </Link>

                <button
                  onClick={() => router.push('/home')}
                  className="w-full py-4 text-label font-medium text-ink-3"
                >
                  Back to home
                </button>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
