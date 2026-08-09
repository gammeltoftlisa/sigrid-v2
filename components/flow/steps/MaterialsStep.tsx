'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { tshirtFabrics, getGarmentById } from '@/lib/data'
import PrimaryButton from '@/components/ui/PrimaryButton'
import StepTracker from '@/components/ui/StepTracker'
import SubStepPanel from '@/components/ui/SubStepPanel'
import { useFlow } from '@/lib/flow-context'

const difficultyColors = {
  Easy:   { bg: 'bg-success-soft', text: 'text-success' },
  Medium: { bg: 'bg-warn-soft',    text: 'text-warn'    },
  Harder: { bg: 'bg-danger-soft',  text: 'text-danger'  },
}

const shopCategories = [
  { icon: '🏪', name: 'Local fabric shops', count: 3  },
  { icon: '🌐', name: 'Online shops',        count: 12 },
  { icon: '♻️', name: 'Secondhand stores',  count: 5  },
]

export default function MaterialsStep({ garmentId, onClose }: { garmentId: string; onClose: () => void }) {
  const { goToStep } = useFlow()
  const garment = getGarmentById(garmentId)
  const [selectedFabric, setSelectedFabric] = useState(0)

  const mainFabrics = tshirtFabrics.filter((f) => !f.isSecondhand)
  const ecoOptions  = tshirtFabrics.filter((f) => f.isEco)
  const activeSubStep = selectedFabric >= 0 ? 1 : 0

  return (
    <>
      <StepTracker
        current="materials"
        garmentId={garmentId}
        garmentName={garment.name}
        stepProgress={selectedFabric >= 0 ? 1 / 3 : 0}
        onClose={onClose}
      />

      <div className="flex-1 flex flex-row overflow-hidden">
        <SubStepPanel
          current="materials"
          activeSubStep={activeSubStep}
          onNext={() => goToStep('guide')}
          onPrev={() => goToStep('pattern')}
          onExit={onClose}
          garmentName={garment.name}
        />

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <div className="px-5 pt-5 pb-6">
              <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="text-display font-bold text-ink mb-2">
                What you&apos;ll need.
              </motion.h1>
              <p className="text-body text-ink-2">Everything for your {garment.name}.</p>
            </div>

            <div className="px-5 mb-8">
              <h2 className="text-heading font-semibold text-ink mb-4">Recommended fabrics</h2>
              <div className="flex flex-col gap-3">
                {mainFabrics.map((fabric, i) => {
                  const { bg, text } = difficultyColors[fabric.difficulty]
                  const isSelected = selectedFabric === i
                  return (
                    <motion.button
                      key={fabric.name}
                      onClick={() => setSelectedFabric(i)}
                      whileTap={{ scale: 0.98 }}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className={`text-left bg-surface rounded-3xl p-5 shadow-soft border-2 transition-all duration-200 ${
                        isSelected ? 'border-primary' : 'border-transparent'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <h3 className="text-label font-semibold text-ink">{fabric.name}</h3>
                          {fabric.isEco && (
                            <span className="text-[11px] font-semibold bg-success-soft text-success px-2 py-0.5 rounded-full">
                              🌱 Eco
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${bg} ${text}`}>
                            {fabric.difficulty}
                          </span>
                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                                <path d="M20 7L9 18L4 13" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </div>
                      <p className="text-caption text-ink-2 mb-3">{fabric.description}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-caption font-semibold text-ink">{fabric.quantityMeters}m needed</span>
                        <span className="text-caption text-ink-3">· Based on your measurements</span>
                      </div>
                    </motion.button>
                  )
                })}
              </div>
            </div>

            {ecoOptions.length > 0 && (
              <div className="px-5 mb-8">
                <h2 className="text-heading font-semibold text-ink mb-2">Eco-friendly alternatives</h2>
                <p className="text-caption text-ink-3 mb-4">Better for the planet, great results.</p>
                <div className="bg-success-soft rounded-3xl p-5">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">🌱</span>
                    <div>
                      <h3 className="text-label font-semibold text-ink mb-1">Organic Cotton Jersey</h3>
                      <p className="text-caption text-ink-2">GOTS certified. Slightly stiffer than conventional cotton — pre-wash before cutting.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="px-5 mb-8">
              <h2 className="text-heading font-semibold text-ink mb-2">Buying secondhand</h2>
              <p className="text-caption text-ink-3 mb-4">Stretch your budget and reduce waste.</p>
              <div className="bg-surface rounded-3xl p-5 shadow-soft space-y-3">
                {[
                  'Look for oversized t-shirts to upcycle — the fabric is often perfect quality',
                  'Charity shops and vintage markets are great for jersey fabrics',
                  'Online: Vinted, Depop, and eBay have fabric lots at great prices',
                ].map((tip, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-primary mt-0.5">♻️</span>
                    <p className="text-caption text-ink-2">{tip}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-5 mb-8">
              <h2 className="text-heading font-semibold text-ink mb-4">Where to shop</h2>
              <div className="flex flex-col gap-3">
                {shopCategories.map((cat) => (
                  <motion.div key={cat.name} whileTap={{ scale: 0.98 }}
                    className="bg-surface rounded-2xl p-4 shadow-soft flex items-center gap-4 cursor-pointer"
                    style={{ borderLeft: '4px solid var(--sig-primary)' }}>
                    <span className="text-2xl">{cat.icon}</span>
                    <div className="flex-1">
                      <p className="text-label font-semibold text-ink">{cat.name}</p>
                      <p className="text-caption text-ink-3">{cat.count} nearby</p>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M9 18L15 12L9 6" stroke="var(--sig-ink-3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </motion.div>
                ))}
              </div>
              <div className="mt-4 bg-surface-2 rounded-3xl h-44 flex items-center justify-center border-2 border-dashed border-rim shadow-soft">
                <div className="text-center">
                  <span className="text-3xl mb-2 block">🗺</span>
                  <p className="text-caption text-ink-3">Interactive map coming soon</p>
                  <p className="text-caption text-ink-3">Showing fabric shops near you</p>
                </div>
              </div>
            </div>

            <div className="px-5 pb-8 pt-2">
              <PrimaryButton onClick={() => goToStep('guide')}>I have my materials — start sewing</PrimaryButton>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
