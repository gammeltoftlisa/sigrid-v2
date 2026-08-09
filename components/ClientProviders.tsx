'use client'

import { FlowProvider } from '@/lib/flow-context'
import FlowModal from '@/components/flow/FlowModal'

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <FlowProvider>
      {children}
      <FlowModal />
    </FlowProvider>
  )
}
