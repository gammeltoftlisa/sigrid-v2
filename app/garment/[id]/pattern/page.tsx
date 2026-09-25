'use client'

import { use, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { tshirtPatternPieces, getGarmentById } from '@/lib/data'
import IconButton from '@/components/ui/IconButton'
import { IconChevronLeft } from '@tabler/icons-react'

const pieceColors: Record<string, string> = {
  A: 'var(--sig-primary-soft)',
  B: 'var(--sig-surface-2)',
  C: 'var(--sig-success-soft)',
  D: 'var(--sig-warn-soft)',
}

function PatternPieceCard({ piece, index }: { piece: typeof tshirtPatternPieces[0]; index: number }) {
  const aspectRatio = piece.width / piece.height
  const displayW = Math.min(piece.width * 1.8, 130)
  const displayH = displayW / aspectRatio

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="bg-surface rounded-3xl p-4 shadow-soft border border-rim-soft"
    >
      <div
        className="rounded-2xl mb-3 flex items-center justify-center relative"
        style={{ backgroundColor: pieceColors[piece.label], minHeight: 100, maxHeight: 140 }}
      >
        <svg width={displayW} height={displayH} viewBox={`0 0 ${displayW} ${displayH}`} fill="none">
          <rect x={2} y={2} width={displayW - 4} height={displayH - 4} rx={6} fill="none"
            stroke="var(--sig-primary)" strokeWidth={1.5} strokeDasharray="6 4" />
          <text x={displayW / 2} y={displayH / 2 + 5} textAnchor="middle"
            fill="var(--sig-primary)" fontSize={28} fontWeight="bold">
            {piece.label}
          </text>
        </svg>
      </div>
      <h3 className="text-label font-semibold text-ink mb-1">{piece.name}</h3>
      <div className="flex justify-between items-center">
        <p className="text-caption text-ink-3">{piece.width} × {piece.height} cm</p>
        <span className="text-[11px] bg-surface-2 text-ink-2 px-2 py-0.5 rounded-full font-medium">
          × {piece.quantity}
        </span>
      </div>
    </motion.div>
  )
}

export default function PatternPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const garment = getGarmentById(id)

  // Auto-trigger print dialog when opened with ?print=true
  useEffect(() => {
    if (searchParams.get('print') === 'true') {
      window.print()
    }
  }, [searchParams])

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Simple header — this is now a standalone printable view, not a flow step */}
      <div className="shrink-0 bg-bg border-b border-rim px-5 py-4 flex items-center gap-3 print:hidden">
        <IconButton label="Back" onClick={() => router.back()}>
          <IconChevronLeft size={16} />
        </IconButton>
        <p className="text-label font-bold text-ink">{garment.name} — Pattern pieces</p>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-5 pt-5 pb-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-4 w-12 h-12 rounded-full bg-success-soft flex items-center justify-center print:hidden"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M20 7L9 18L4 13" stroke="var(--sig-success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-display font-bold text-ink mb-2">
            Your pattern pieces.
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="text-body text-ink-2">
            {tshirtPatternPieces.length} pieces, graded to your size.
          </motion.p>
        </div>

        <div className="px-5 mb-8">
          <div className="grid grid-cols-2 gap-3">
            {tshirtPatternPieces.map((piece, i) => (
              <PatternPieceCard key={piece.id} piece={piece} index={i} />
            ))}
          </div>
        </div>

        <div className="px-5 mb-6 print:hidden">
          <div className="bg-surface rounded-3xl p-5 shadow-soft">
            <h3 className="text-heading font-semibold text-ink mb-3">Printing guide</h3>
            <div className="space-y-2.5">
              {[
                { step: '1', text: 'Print all pieces at 100% scale — do not fit to page' },
                { step: '2', text: 'Verify: the 10 cm test square on piece A should measure 10 cm' },
                { step: '3', text: 'Cut pieces out along the solid line' },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary text-surface text-[12px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {item.step}
                  </span>
                  <p className="text-label text-ink-2">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-5 mb-8 print:hidden">
          <button
            onClick={() => window.print()}
            className="w-full flex items-center justify-center gap-2 bg-surface border border-rim py-4 rounded-full text-label font-semibold text-ink shadow-soft hover:bg-surface-2 active:scale-[0.97] transition duration-150"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M6 9V2H18V9M6 18H4C2.9 18 2 17.1 2 16V11C2 9.9 2.9 9 4 9H20C21.1 9 22 9.9 22 11V16C22 17.1 21.1 18 20 18H18M6 14H18V22H6V14Z"
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Print / save as PDF
          </button>
        </div>
      </div>
    </div>
  )
}
