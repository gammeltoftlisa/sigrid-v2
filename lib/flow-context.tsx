'use client'

import { createContext, useContext, useState, useCallback } from 'react'

export type FlowStep = 'measurements' | 'pattern' | 'materials' | 'guide' | 'complete'

interface FlowContextValue {
  garmentId: string | null
  step: FlowStep
  openFlow: (garmentId: string, step?: FlowStep) => void
  closeFlow: () => void
  goToStep: (step: FlowStep) => void
}

const FlowContext = createContext<FlowContextValue | null>(null)

export function FlowProvider({ children }: { children: React.ReactNode }) {
  const [garmentId, setGarmentId] = useState<string | null>(null)
  const [step, setStep] = useState<FlowStep>('measurements')

  const openFlow = useCallback((id: string, s: FlowStep = 'measurements') => {
    setStep(s)
    setGarmentId(id)
  }, [])

  const closeFlow = useCallback(() => setGarmentId(null), [])
  const goToStep = useCallback((s: FlowStep) => setStep(s), [])

  return (
    <FlowContext.Provider value={{ garmentId, step, openFlow, closeFlow, goToStep }}>
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
