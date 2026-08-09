'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useFlow } from '@/lib/flow-context'
import MeasurementsStep from './steps/MeasurementsStep'
import PatternStep from './steps/PatternStep'
import MaterialsStep from './steps/MaterialsStep'
import GuideStep from './steps/GuideStep'
import CompleteStep from './steps/CompleteStep'

export default function FlowModal() {
  const { garmentId, step, closeFlow } = useFlow()
  const [isOpen, setIsOpen] = useState(false)
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    if (garmentId && !isOpen) {
      setExiting(false)
      setIsOpen(true)
    }
  }, [garmentId, isOpen])

  if (!isOpen) return null

  const handleClose = () => setExiting(true)

  return (
    <motion.div
      className="fixed inset-x-0 bottom-0 top-3 z-50 flex flex-col bg-bg rounded-t-3xl overflow-hidden shadow-modal"
      initial={{ y: '100%' }}
      animate={{ y: exiting ? '100%' : 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 32 }}
      onAnimationComplete={() => {
        if (exiting) {
          closeFlow()
          setIsOpen(false)
          setExiting(false)
        }
      }}
    >
      {garmentId && step === 'measurements' && <MeasurementsStep garmentId={garmentId} onClose={handleClose} />}
      {garmentId && step === 'pattern'      && <PatternStep      garmentId={garmentId} onClose={handleClose} />}
      {garmentId && step === 'materials'    && <MaterialsStep    garmentId={garmentId} onClose={handleClose} />}
      {garmentId && step === 'guide'        && <GuideStep        garmentId={garmentId} onClose={handleClose} />}
      {garmentId && step === 'complete'     && <CompleteStep     garmentId={garmentId} onClose={handleClose} />}
    </motion.div>
  )
}
