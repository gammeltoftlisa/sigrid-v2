'use client'

import { use, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { IconChevronLeft, IconPrinter } from '@tabler/icons-react'
import { getGarmentById, getGarmentGuide, standardSizes } from '@/lib/data'
import { loadProject } from '@/lib/projects'
import { allSizes, sizeLabel } from '@/lib/sizes'
import IconButton from '@/components/ui/IconButton'
import PrimaryButton from '@/components/ui/PrimaryButton'
import { textLink } from '@/components/ui/interaction'
import type { GuidePiece, PieceDims, StandardSize } from '@/lib/types'

// ── Geometry (all in cm) ──────────────────────────────────────────────────────

/** Printable area of an A4 page with 10 mm margins */
const PAGE_W = 19
const PAGE_H = 27.7
/** Blank space around each piece so the cut line never sits on a page edge */
const PAD = 1

const pieceName = (p: GuidePiece) =>
  p.name ?? p.id.charAt(0).toUpperCase() + p.id.slice(1).replace(/-/g, ' ')

interface Layout {
  piece: GuidePiece
  dims: PieceDims
  /** Size of the drawing area including padding */
  w: number
  h: number
  cols: number
  rows: number
}

function layoutPiece(piece: GuidePiece, size: StandardSize): Layout {
  const dims = typeof piece.dims === 'function' ? piece.dims(standardSizes[size]) : piece.dims
  const w = Math.max(dims.topWidth, dims.bottomWidth) + PAD * 2
  const h = dims.height + PAD * 2
  return { piece, dims, w, h, cols: Math.ceil(w / PAGE_W), rows: Math.ceil(h / PAGE_H) }
}

/** Corner points of the piece outline, inset by `inset` cm (for the stitch line) */
function outline({ dims, w }: Layout, inset = 0) {
  const widest = Math.max(dims.topWidth, dims.bottomWidth)
  const left = (w - widest) / 2
  const topOff = left + (widest - dims.topWidth) / 2
  const botOff = left + (widest - dims.bottomWidth) / 2
  const pts = [
    [topOff + inset, PAD + inset],
    [topOff + dims.topWidth - inset, PAD + inset],
    [botOff + dims.bottomWidth - inset, PAD + dims.height - inset],
    [botOff + inset, PAD + dims.height - inset],
  ]
  return pts.map(([x, y]) => `${x},${y}`).join(' ')
}

/** The full piece drawn in cm units — reused for the preview and every printed tile */
function PieceDrawing({ layout, preview = false }: { layout: Layout; preview?: boolean }) {
  // Print lines are real-world widths in cm; small on-screen previews use fixed pixel widths instead
  const line = (cm: number, px: number) =>
    preview ? { strokeWidth: px, vectorEffect: 'non-scaling-stroke' as const } : { strokeWidth: cm }
  const { piece, dims, w } = layout
  const sa = piece.seamAllowance ?? 1.5
  const cx = w / 2
  const cy = PAD + dims.height / 2
  const vertical = (piece.grainLine ?? 'vertical') === 'vertical'
  const span = vertical ? dims.height : Math.min(dims.topWidth, dims.bottomWidth)
  const arrow = Math.min(span, 30) * 0.35
  const labelSize = Math.min(2.4, dims.height * 0.35)
  return (
    <g>
      {/* Cut line */}
      <polygon points={outline(layout)} fill={preview ? 'var(--sig-primary-soft)' : 'none'} stroke="#1C1B19" {...line(0.06, 1.25)} />
      {/* Stitch line */}
      <polygon points={outline(layout, sa)} fill="none" stroke="#9A6E45" {...line(0.04, 1)} strokeDasharray={preview ? '3 2' : '0.4 0.3'} />
      {/* Grain line */}
      <g stroke="#1C1B19" fill="none" {...line(0.05, 1)}>
        {vertical ? (
          <>
            <line x1={cx} y1={cy - arrow} x2={cx} y2={cy + arrow} />
            <polyline points={`${cx - 0.5},${cy - arrow + 0.8} ${cx},${cy - arrow} ${cx + 0.5},${cy - arrow + 0.8}`} />
            <polyline points={`${cx - 0.5},${cy + arrow - 0.8} ${cx},${cy + arrow} ${cx + 0.5},${cy + arrow - 0.8}`} />
          </>
        ) : (
          <>
            <line x1={cx - arrow} y1={cy} x2={cx + arrow} y2={cy} />
            <polyline points={`${cx - arrow + 0.8},${cy - 0.5} ${cx - arrow},${cy} ${cx - arrow + 0.8},${cy + 0.5}`} />
            <polyline points={`${cx + arrow - 0.8},${cy - 0.5} ${cx + arrow},${cy} ${cx + arrow - 0.8},${cy + 0.5}`} />
          </>
        )}
      </g>
      {/* Label */}
      <text x={cx} y={PAD + sa + labelSize} textAnchor="middle" fontSize={labelSize} fontWeight={700} fill="#9A6E45">
        {piece.label}
      </text>
      {dims.height > 12 && (
        <text x={cx} y={PAD + sa + labelSize + 1.2} textAnchor="middle" fontSize={0.7} fill="#6B6660">
          {pieceName(piece)}
        </text>
      )}
    </g>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PatternPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const garment = getGarmentById(id)
  const guide = getGarmentGuide(id)

  // Size comes from the link (so the right size always prints), else the saved project
  const [size, setSize] = useState<StandardSize | null>(null)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const fromLink = searchParams.get('size')
    const valid = fromLink && (allSizes as string[]).includes(fromLink) ? (fromLink as StandardSize) : null
    setSize(valid ?? loadProject(id)?.size ?? null)
    setReady(true)
  }, [id, searchParams])

  const layouts = size && guide ? guide.pieces.map((p) => layoutPiece(p, size)) : []
  const totalPages = 1 + layouts.reduce((n, l) => n + l.cols * l.rows, 0)

  // Open the print dialog once the pieces are drawn, when asked to
  useEffect(() => {
    if (!ready || !size || searchParams.get('print') !== 'true') return
    const t = setTimeout(() => window.print(), 300)
    return () => clearTimeout(t)
  }, [ready, size, searchParams])

  const header = (
    <div className="shrink-0 bg-bg border-b border-rim px-5 py-4 flex items-center gap-3 print:hidden">
      <IconButton label="Back" onClick={() => router.back()}>
        <IconChevronLeft size={16} />
      </IconButton>
      <p className="text-label font-bold text-ink">{garment.name} — Pattern</p>
    </div>
  )

  if (!ready) return <div className="min-h-screen bg-bg">{header}</div>

  if (!guide || guide.pieces.length === 0) {
    return (
      <div className="min-h-screen bg-bg">
        {header}
        <div className="px-5 py-16 text-center">
          <p className="text-heading font-bold text-ink mb-2">Pattern coming soon</p>
          <p className="text-body text-ink-2">The printable pattern for {garment.name} isn&apos;t ready yet.</p>
        </div>
      </div>
    )
  }

  if (!size) {
    return (
      <div className="min-h-screen bg-bg">
        {header}
        <div className="px-5 py-16 text-center max-w-sm mx-auto">
          <p className="text-heading font-bold text-ink mb-2">Choose a size first</p>
          <p className="text-body text-ink-2 mb-6">Your pattern is printed in the size you choose when you start the project.</p>
          <a href={`/garment/${id}`} className={`text-label ${textLink}`}>Go to {garment.name}</a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg print:bg-white print:min-h-0">
      {/* A4 with 10 mm margins; each tile below fills exactly one printable page */}
      <style>{`@page { size: A4 portrait; margin: 10mm; }`}</style>

      {header}

      {/* ── Screen view ── */}
      <div className="print:hidden max-w-3xl mx-auto px-5 pt-6 pb-10">
        <h1 className="text-title font-bold text-ink mb-1">Your pattern, {sizeLabel(size)}</h1>
        <p className="text-body text-ink-2 mb-6">
          {layouts.length} pieces at full size, spread over {totalPages} A4 pages.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          {layouts.map((l) => (
            <div key={l.piece.id} className="bg-surface rounded-3xl p-4 shadow-soft border border-rim-soft">
              <div className="h-32 mb-3 rounded-2xl bg-surface-2/60 flex items-center justify-center p-3">
                <svg viewBox={`0 0 ${l.w} ${l.h}`} className="h-full max-w-full">
                  <PieceDrawing layout={l} preview />
                </svg>
              </div>
              <p className="text-label font-semibold text-ink">{l.piece.label} · {pieceName(l.piece)}</p>
              <p className="text-caption text-ink-3">
                {Math.max(l.dims.topWidth, l.dims.bottomWidth)} × {l.dims.height} cm · {l.cols * l.rows} page{l.cols * l.rows > 1 ? 's' : ''}
              </p>
            </div>
          ))}
        </div>

        <div className="bg-surface rounded-3xl p-5 shadow-soft mb-6">
          <h2 className="text-heading font-semibold text-ink mb-3">How to print</h2>
          <ol className="space-y-2.5">
            {[
              'Print at 100% / "Actual size" — turn off "Fit to page".',
              'Measure the 10 cm square on the first page. If it isn\'t 10 cm, check your print settings.',
              'Lay the pages out by their labels (row and column) and tape them edge to edge.',
              'Cut along the solid line. The dashed line is where you stitch.',
            ].map((text, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary-soft text-primary text-[12px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <p className="text-label text-ink-2">{text}</p>
              </li>
            ))}
          </ol>
        </div>

        <PrimaryButton onClick={() => window.print()}>
          <IconPrinter size={18} />
          Print / save as PDF
        </PrimaryButton>
      </div>

      {/* ── Print view: cover page + true-scale tiles ── */}
      <div className="hidden print:block text-black">
        <div style={{ width: `${PAGE_W}cm`, height: `${PAGE_H}cm`, fontFamily: 'system-ui, sans-serif' }}>
          <p style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{garment.name} — pattern</p>
          <p style={{ fontSize: 13, margin: '4px 0 18px', color: '#555' }}>
            Size {sizeLabel(size)} · {layouts.length} pieces · {totalPages} pages · Print at 100%, not &quot;fit to page&quot;
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <div style={{ width: '10cm', height: '10cm', border: '1px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
              10 × 10 cm
            </div>
            <p style={{ fontSize: 12, color: '#333' }}>
              Measure this square before cutting. If it isn&apos;t exactly 10 cm, your printer scaled the pages.
            </p>
          </div>
          <p style={{ fontSize: 13, fontWeight: 700, margin: '0 0 6px' }}>Pages</p>
          <table style={{ fontSize: 12, borderCollapse: 'collapse' }}>
            <tbody>
              {layouts.map((l) => (
                <tr key={l.piece.id}>
                  <td style={{ padding: '2px 12px 2px 0', fontWeight: 700 }}>{l.piece.label}</td>
                  <td style={{ padding: '2px 12px 2px 0' }}>{pieceName(l.piece)}</td>
                  <td style={{ padding: '2px 12px 2px 0' }}>{Math.max(l.dims.topWidth, l.dims.bottomWidth)} × {l.dims.height} cm</td>
                  <td style={{ padding: '2px 0' }}>{l.rows} row{l.rows > 1 ? 's' : ''} × {l.cols} column{l.cols > 1 ? 's' : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {layouts.flatMap((l) =>
          Array.from({ length: l.rows * l.cols }, (_, t) => {
            const row = Math.floor(t / l.cols)
            const col = t % l.cols
            return (
              <div key={`${l.piece.id}-${t}`} style={{ width: `${PAGE_W}cm`, height: `${PAGE_H}cm`, breakBefore: 'page', position: 'relative', overflow: 'hidden' }}>
                <svg
                  width={`${PAGE_W}cm`}
                  height={`${PAGE_H}cm`}
                  viewBox={`${col * PAGE_W} ${row * PAGE_H} ${PAGE_W} ${PAGE_H}`}
                  style={{ display: 'block' }}
                >
                  <PieceDrawing layout={l} />
                </svg>
                {/* Page edge + where it sits, so pages can be taped together in order */}
                <div style={{ position: 'absolute', inset: 0, border: '0.3mm dashed #999' }} />
                <p style={{ position: 'absolute', top: 4, left: 6, margin: 0, fontSize: 10, color: '#555', fontFamily: 'system-ui, sans-serif' }}>
                  {l.piece.label} {pieceName(l.piece)} · row {row + 1} / {l.rows}, column {col + 1} / {l.cols} · {sizeLabel(size)}
                </p>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
