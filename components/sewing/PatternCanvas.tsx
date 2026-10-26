'use client'

import { useMemo } from 'react'
import { IconYarn, IconScissors } from '@tabler/icons-react'
import { buildScene } from '@/lib/guide-scene'
import type { Assembly } from '@/lib/assembly'
import type { GuidePiece, StepAction, StepAnnotation, FabricSide, UserMeasurements } from '@/lib/types'
import GuideScene from './GuideScene'

interface Props {
  piece: GuidePiece | null
  action: StepAction
  annotation?: StepAnnotation
  fabricSide?: FabricSide
  measurements: UserMeasurements
  /** Shown when the step has no pattern piece to draw */
  title?: string
  /**
   * For steps about pieces that are (being) sewn together: the set already joined and the pieces
   * joining it now, by id ("<id>#2" is a piece's second cut).
   */
  assembly?: Assembly | null
  /** Every piece of the pattern, to look the assembly's pieces up in */
  pieces?: GuidePiece[]
}

/**
 * The step's picture. A step with pattern pieces plays out like an instruction video
 * (`GuideScene`): what's on the table at this point, and the step being done to it. A step
 * without one (getting ready) shows an illustration.
 */
export default function PatternCanvas({ piece, action, annotation, fabricSide, measurements, title, assembly, pieces }: Props) {
  const all = pieces ?? (piece ? [piece] : [])
  // The guide rebuilds the assembly and pieces on every render: compare them by content
  const key = JSON.stringify([action, annotation, fabricSide, piece?.id, title, assembly, all.map((p) => p.id), measurements])
  const scene = useMemo(
    () => (piece || assembly ? buildScene({ action, annotation, fabricSide, pieceId: piece?.id, title: title ?? '' }, assembly ?? null, all, measurements) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key],
  )

  if (!scene) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-surface-2 rounded-3xl">
        {action === 'prepare' ? <IconYarn size={56} className="text-ink-3" stroke={1.5} /> : <IconScissors size={56} className="text-ink-3" stroke={1.5} />}
        <p className="text-label text-ink-2 font-medium text-center px-6">{title ?? 'Get ready'}</p>
      </div>
    )
  }
  return <GuideScene scene={scene} label={title ? `${title}, shown on the pattern pieces` : 'The step, shown on the pattern pieces'} />
}
