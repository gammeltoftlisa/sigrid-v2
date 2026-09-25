'use client'

import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { GuidePiece, SewingStep2D } from '@/lib/types'

interface Props {
  pieces: GuidePiece[]
  steps: SewingStep2D[]
  completedUntil: number
  garmentId: string
  onPieceClick: (stepIdx: number) => void
}

export default function PatternPieceTracker({ pieces, steps, completedUntil, garmentId, onPieceClick }: Props) {
  const lastStepForPiece = useMemo(() =>
    steps.reduce((acc, step, i) => {
      if (step.pieceId) acc[step.pieceId] = i
      return acc
    }, {} as Record<string, number>),
    [steps]
  )

  const isPieceDone = (pieceId: string) => {
    const last = lastStepForPiece[pieceId]
    return last !== undefined && completedUntil > last
  }

  return (
    <div className="w-[88px] shrink-0 border-l border-rim bg-surface flex flex-col overflow-hidden">

      {/* Print / download button */}
      <button
        onClick={() => window.open(`/garment/${garmentId}/pattern?print=true`, '_blank')}
        className="shrink-0 px-2 pt-3 pb-2.5 flex flex-col items-center gap-1.5 border-b border-rim hover:bg-surface-2 active:bg-rim transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M6 9V2H18V9" stroke="var(--sig-ink-2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6 18H4C2.9 18 2 17.1 2 16V11C2 9.9 2.9 9 4 9H20C21.1 9 22 9.9 22 11V16C22 17.1 21.1 18 20 18H18" stroke="var(--sig-ink-2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6 14H18V22H6V14Z" stroke="var(--sig-ink-2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="text-[10px] font-semibold text-ink-3 leading-tight text-center">Print PDF</span>
      </button>

      {/* Piece list */}
      <div className="flex-1 overflow-y-auto py-3 flex flex-col gap-3 px-2">
        {pieces.map((piece) => {
          const done = isPieceDone(piece.id)
          const lastIdx = lastStepForPiece[piece.id]
          const clickable = lastIdx !== undefined

          return (
            <button
              key={piece.id}
              onClick={() => clickable && onPieceClick(lastIdx)}
              disabled={!clickable}
              className={`flex flex-col items-center gap-1.5 rounded-xl p-1.5 transition-colors ${
                clickable ? 'hover:bg-surface-2 active:bg-rim cursor-pointer' : 'cursor-default'
              }`}
            >
              {/* Circle: label or checkmark */}
              <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition-colors duration-300 ${
                done ? 'bg-primary border-primary' : 'bg-surface-2 border-rim'
              }`}>
                <AnimatePresence mode="wait" initial={false}>
                  {done ? (
                    <motion.svg
                      key="check"
                      width="14" height="14" viewBox="0 0 24 24" fill="none"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 24 }}
                    >
                      <path d="M20 6L9 17L4 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </motion.svg>
                  ) : (
                    <motion.span
                      key="label"
                      className="text-xs font-bold text-ink-3"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 24 }}
                    >
                      {piece.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>

              {/* Name */}
              {piece.name && (
                <span className={`text-[10px] font-medium text-center leading-tight ${
                  done ? 'text-ink-3 line-through' : 'text-ink-2'
                }`}>
                  {piece.name}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
