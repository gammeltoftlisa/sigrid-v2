'use client'

import { createContext, useContext, useState, useCallback } from 'react'

export type FlowStep = 'measurements' | 'pattern' | 'materials' | 'guide' | 'complete'

const STEP_ORDER: FlowStep[] = ['measurements', 'pattern', 'materials', 'guide', 'complete']

interface FlowContextValue {
  garmentId: string | null
  step: FlowStep
  /** Furthest step the user has ever reached — only moves forward. Drives progress UI so viewing an earlier step doesn't undo it. */
  furthestStep: FlowStep
  openFlow: (garmentId: string, step?: FlowStep) => void
  closeFlow: () => void
  /** Pure navigation — view a step (e.g. tracker clicks, "back" arrows). Never marks a step done. */
  goToStep: (step: FlowStep) => void
  /** Finishing the current step via its own continue/finish action. Navigates AND advances furthestStep. */
  completeStep: (nextStep: FlowStep) => void
}

const FlowContext = createContext<FlowContextValue | null>(null)

export function FlowProvider({ children }: { children: React.ReactNode }) {
  const [garmentId, setGarmentId] = useState<string | null>(null)
  const [step, setStep] = useState<FlowStep>('measurements')
  const [furthestStep, setFurthestStep] = useState<FlowStep>('measurements')

  const openFlow = useCallback((id: string, s: FlowStep = 'measurements') => {
    setStep(s)
    setFurthestStep(s)
    setGarmentId(id)
  }, [])

  const closeFlow = useCallback(() => setGarmentId(null), [])
  const goToStep = useCallback((s: FlowStep) => setStep(s), [])
  const completeStep = useCallback((s: FlowStep) => {
    setStep(s)
    setFurthestStep((prev) => (STEP_ORDER.indexOf(s) > STEP_ORDER.indexOf(prev) ? s : prev))
  }, [])

  return (
    <FlowContext.Provider value={{ garmentId, step, furthestStep, openFlow, closeFlow, goToStep, completeStep }}>
      {children}
    </FlowContext.Provider>
  )
}

export function useFlow() {
  const ctx = useContext(FlowContext)
  if (!ctx) throw new Error('useFlow must be inside FlowProvider')
  return ctx
}

export function useFlowOptional() {
  return useContext(FlowContext)
}
