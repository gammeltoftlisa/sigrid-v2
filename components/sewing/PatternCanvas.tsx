'use client'

import { useMemo } from 'react'
import { IconYarn, IconScissors } from '@tabler/icons-react'
import { buildStepScene } from '@/lib/guide-animation/scenes'
import type { GuidePiece, SewingStep2D, UserMeasurements } from '@/lib/types'
import GuideScene from './GuideScene'

interface Props {
  /** All the guide's steps: a scene shows what earlier steps left on the cloth */
  steps: SewingStep2D[]
  index: number
  pieces: GuidePiece[]
  measurements: UserMeasurements
}

/**
 * The step's picture. The rules in lib/guide-animation/rules.ts decide what it shows, from the step
 * alone. A step with nothing to show (getting ready) has an illustration.
 */
export default function PatternCanvas({ steps, index, pieces, measurements }: Props) {
  const step = steps[index]
  // The guide rebuilds these on every render: compare them by content
  const key = JSON.stringify([steps, index, pieces.map((p) => [p.id, p.outline, p.quantity]), measurements])
  const scene = useMemo(
    () => buildStepScene(steps, index, pieces, measurements),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key],
  )

  if (!scene) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-muted rounded-3xl">
        {step?.action === 'prepare' ? <IconYarn size={56} className="text-muted-foreground" stroke={1.5} /> : <IconScissors size={56} className="text-muted-foreground" stroke={1.5} />}
        <p className="text-sm text-muted-foreground font-medium text-center px-6">{step?.title ?? 'Get ready'}</p>
      </div>
    )
  }
  return <GuideScene scene={scene} label={step?.title ? `${step.title}, shown on the pattern pieces` : 'The step, shown on the pattern pieces'} />
}
