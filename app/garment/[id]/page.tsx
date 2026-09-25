'use client'

import { useState, useEffect, useMemo, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { IconColorSwatch, IconLeaf, IconPrinter, IconRoute, IconClock, IconShirt, IconCircleCheck, IconNeedleThread } from '@tabler/icons-react'
import { getGarmentById, getGarmentGuide, creators, standardSizes, tshirtFabrics } from '@/lib/data'
import { groupIntoJourneys } from '@/lib/journeys'
import { loadProject, saveProject, type ProjectState } from '@/lib/projects'
import { loadSavedSize, sizeLabel } from '@/lib/sizes'
import { TOOLS } from '@/components/sewing/tools'
import SizeSheet from '@/components/garment/SizeSheet'
import DifficultyBadge from '@/components/ui/DifficultyBadge'
import PrimaryButton from '@/components/ui/PrimaryButton'
import GarmentIllustration from '@/components/ui/GarmentIllustration'
import type { GuidePiece, StandardSize, UserMeasurements } from '@/lib/types'
import IconButton from '@/components/ui/IconButton'
import { IconChevronLeft } from '@tabler/icons-react'
import { TAP } from '@/components/ui/interaction'

const pieceName = (p: GuidePiece) =>
  p.name ?? p.id.charAt(0).toUpperCase() + p.id.slice(1).replace(/-/g, ' ')

const pieceDims = (p: GuidePiece, m: UserMeasurements) => {
  const d = typeof p.dims === 'function' ? p.dims(m) : p.dims
  return `${Math.max(d.topWidth, d.bottomWidth)} × ${d.height} cm`
}

export default function GarmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const garment = getGarmentById(id)
  const recommendedFabric = tshirtFabrics[0]
  const creator = garment.isCreator && garment.creatorId ? creators.find((c) => c.id === garment.creatorId) : null
  const [following, setFollowing] = useState(false)
  const router = useRouter()
  const guide = getGarmentGuide(id)
  const journeys = useMemo(() => (guide ? groupIntoJourneys(guide.steps) : []), [guide])
  const tools = useMemo(
    () => (guide ? [...new Set(guide.steps.flatMap((s) => (s.tool ? [s.tool] : [])))] : []),
    [guide],
  )
  const totalSteps = guide?.steps.length ?? 0

  // Project state lives in the browser, so read it after mount
  const [project, setProject] = useState<ProjectState | null>(null)
  const [profileSize, setProfileSize] = useState<StandardSize | null>(null)
  const [sizeSheetOpen, setSizeSheetOpen] = useState(false)
  useEffect(() => {
    setProject(loadProject(id))
    setProfileSize(loadSavedSize())
  }, [id])

  const nextJourney = project ? journeys.find((j) => j.stepIndices.includes(project.completedUntil)) : undefined
  const finished = !!project && totalSteps > 0 && project.completedUntil >= totalSteps
  const inProgress = !!project && !finished

  const enterGuide = () => {
    sessionStorage.setItem('sigrid_flow_enter', '1')
    router.push(`/garment/${id}/guide`)
  }

  const startProject = (size: StandardSize) => {
    const next = { size, completedUntil: 0 }
    saveProject(id, next)
    setProject(next)
    setSizeSheetOpen(false)
    enterGuide()
  }

  const onCta = () => (inProgress ? enterGuide() : setSizeSheetOpen(true))
  const ctaLabel = inProgress
    ? `Continue sewing · ${sizeLabel(project!.size)}`
    : finished
      ? 'Sew it again'
      : `Start this project — €${garment.price}`

  const printPattern = () => window.open(`/garment/${id}/pattern?print=true`, '_blank')

  const backButton = (
    <IconButton label="Back" variant="raised" size="md" onClick={() => router.back()}>
          <IconChevronLeft size={18} />
        </IconButton>
  )

  const infoContent = (
    <>
      {/* Name + badges */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h1 className="text-title font-bold text-ink mb-2">{garment.name}</h1>
          <div className="flex items-center gap-2 flex-wrap">
            <DifficultyBadge difficulty={garment.difficulty} size="md" />
            <span className="flex items-center gap-1 text-caption text-ink-3">
              <IconClock size={14} />
              {garment.estimatedTime}
            </span>
            <span className="flex items-center gap-1 text-caption text-ink-3">
              <IconShirt size={14} />
              {garment.sizes[0]}–{garment.sizes[garment.sizes.length - 1]}
            </span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-title font-bold text-primary">€{garment.price}</span>
        </div>
      </div>

      <p className="text-body text-ink-2 mb-6 leading-relaxed">{garment.description}</p>

      {/* Your project: size and progress once started */}
      {project && (
        <div className="bg-surface rounded-3xl p-5 mb-6 shadow-soft border border-primary/30">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              {finished
                ? <IconCircleCheck size={20} className="text-success" />
                : <IconNeedleThread size={20} className="text-primary" />}
              <h3 className="text-heading font-semibold text-ink">{finished ? 'Finished' : 'Your project'}</h3>
            </div>
            <span className="text-caption font-semibold text-ink-2 bg-surface-2 border border-rim rounded-full px-2.5 py-0.5">
              {sizeLabel(project.size)}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-rim overflow-hidden mb-2">
            <div
              className={`h-full rounded-full ${finished ? 'bg-success' : 'bg-primary'}`}
              style={{ width: `${totalSteps ? (Math.min(project.completedUntil, totalSteps) / totalSteps) * 100 : 0}%` }}
            />
          </div>
          <p className="text-caption text-ink-2">
            {finished
              ? `All ${totalSteps} steps done. Nice work!`
              : `${project.completedUntil} of ${totalSteps} steps done${nextJourney ? ` · Next up: ${nextJourney.title}` : ''}`}
          </p>
        </div>
      )}

      {/* Creator section */}
      {creator && (
        <div className="bg-surface rounded-3xl p-5 mb-6 shadow-soft flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-surface text-xl font-bold flex-shrink-0"
            style={{ backgroundColor: creator.avatarColor }}
          >
            {creator.name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-label font-semibold text-ink">{creator.handle}</p>
              {creator.isCertified && (
                <span className="text-[10px] font-semibold bg-primary-soft text-primary px-2 py-0.5 rounded-full">
                  ✓ Certified
                </span>
              )}
            </div>
            <p className="text-caption text-ink-3">{creator.followerCount} followers</p>
          </div>
          <motion.button
            whileTap={TAP}
            onClick={() => setFollowing((f) => !f)}
            className={`px-4 py-2 rounded-full text-label font-semibold transition-colors duration-200 ${
              following ? 'bg-surface-2 text-ink-2' : 'bg-primary text-surface'
            }`}
          >
            {following ? 'Following' : 'Follow'}
          </motion.button>
        </div>
      )}

      {/* Materials */}
      <div className="bg-surface rounded-3xl p-5 mb-6 shadow-soft">
        <div className="flex items-center gap-2 mb-3">
          <IconColorSwatch size={20} className="text-primary" />
          <h3 className="text-heading font-semibold text-ink">Materials</h3>
        </div>
        <div className="flex items-start justify-between gap-3 mb-1">
          <p className="text-label font-semibold text-ink">{recommendedFabric.name}</p>
          {recommendedFabric.isEco && (
            <span className="flex items-center gap-1 text-[11px] font-semibold bg-success-soft text-success px-2 py-0.5 rounded-full shrink-0">
              <IconLeaf size={12} />
              Eco
            </span>
          )}
        </div>
        <p className="text-caption text-ink-2 mb-2">{recommendedFabric.description}</p>
        <p className="text-caption text-ink-3">
          {recommendedFabric.quantityMeters} m needed{project ? ` for ${sizeLabel(project.size)}` : ' · varies slightly by size'}
        </p>

        {tools.length > 0 && (
          <>
            <h4 className="text-label font-semibold text-ink mt-5 mb-3">What you&apos;ll need</h4>
            <ul className="grid grid-cols-2 gap-2">
              {tools.map((t) => {
                const { label, Icon } = TOOLS[t]
                return (
                  <li key={t} className="flex items-center gap-2 bg-surface-2 rounded-xl px-3 py-2">
                    <Icon size={16} className="text-ink-3 shrink-0" />
                    <span className="text-caption text-ink-2">{label}</span>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </div>
      {/* Pattern */}
      <div className="bg-surface rounded-3xl p-5 mb-6 shadow-soft">
        <div className="flex items-center justify-between gap-3 mb-1">
          <div className="flex items-center gap-2">
            <IconPrinter size={20} className="text-primary" />
            <h3 className="text-heading font-semibold text-ink">Pattern</h3>
          </div>
          {project && (
            <span className="text-caption font-semibold text-ink-2 bg-surface-2 border border-rim rounded-full px-2.5 py-0.5">
              {sizeLabel(project.size)}
            </span>
          )}
        </div>
        <p className="text-caption text-ink-3 mb-3">
          Available in sizes {garment.sizes[0]}–{garment.sizes[garment.sizes.length - 1]}
        </p>
        {guide && guide.pieces.length > 0 && (
          <ul className="flex flex-col divide-y divide-rim-soft mb-4">
            {guide.pieces.map((p) => (
              <li key={p.id} className="flex items-center gap-3 py-2">
                <span className="w-7 h-7 rounded-full bg-primary-soft text-primary text-caption font-bold flex items-center justify-center shrink-0">
                  {p.label}
                </span>
                <span className="flex-1 text-label text-ink">{pieceName(p)}</span>
                {project && (
                  <span className="text-caption text-ink-3 tabular-nums">{pieceDims(p, standardSizes[project.size])}</span>
                )}
              </li>
            ))}
          </ul>
        )}
        {project ? (
          <>
            <p className="text-caption text-ink-2 mb-3">Print at 100% scale so the pieces come out the right size.</p>
            <button
              onClick={printPattern}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-rim text-label font-semibold text-ink-2 hover:bg-surface-2 active:scale-[0.97] transition"
            >
              <IconPrinter size={16} />
              Print PDF in {sizeLabel(project.size)}
            </button>
          </>
        ) : (
          <p className="text-caption text-ink-3">The printable PDF unlocks when you start the project and choose your size.</p>
        )}
      </div>

      {/* Journey preview */}
      {journeys.length > 0 && (
        <div className="bg-surface rounded-3xl p-5 mb-6 shadow-soft">
          <div className="flex items-center gap-2 mb-1">
            <IconRoute size={20} className="text-primary" />
            <h3 className="text-heading font-semibold text-ink">Your journey</h3>
          </div>
          <p className="text-caption text-ink-3 mb-4">{totalSteps} steps in {journeys.length} short journeys</p>
          <ol className="flex flex-col gap-2">
            {journeys.map((j, i) => (
              <li key={j.key} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-surface-2 border border-rim text-[11px] font-bold text-ink-3 flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <span className="flex-1 text-label text-ink-2">{j.title}</span>
                <span className="text-caption text-ink-3 tabular-nums">{j.stepIndices.length} steps</span>
              </li>
            ))}
          </ol>
        </div>
      )}

    </>
  )

  return (
    <div className="bg-bg md:flex md:h-screen md:overflow-hidden">

      {/* ── Mobile layout ── */}
      <div className="md:hidden min-h-screen pb-24">
        <div className="px-5 pt-14 pb-4 flex items-center gap-3">
          {backButton}
          <nav className="flex items-center gap-1 text-caption text-ink-3">
            <Link href="/home" className="hover:text-ink transition-colors">All garments</Link>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-ink font-medium">{garment.name}</span>
          </nav>
        </div>
        <div className="mx-5 mb-6 bg-surface rounded-3xl overflow-hidden shadow-soft p-8 aspect-[4/3] flex items-center justify-center">
          <GarmentIllustration name={garment.name} className="w-full h-full max-w-56" />
        </div>
        <div className="px-5">{infoContent}</div>
        <div className="fixed bottom-0 left-0 right-0 px-5 pb-8 pt-4 bg-gradient-to-t from-bg via-bg to-transparent">
          <PrimaryButton onClick={onCta}>{ctaLabel}</PrimaryButton>
          {inProgress && (
            <p className="text-caption text-ink-3 text-center mt-2">
              {project!.completedUntil} of {totalSteps} steps done
            </p>
          )}
        </div>
      </div>

      {/* ── Desktop layout ── */}
      {/* Left: sticky image panel */}
      <div className="hidden md:flex md:w-1/2 md:h-screen md:flex-col md:bg-surface md:border-r md:border-rim">
        <div className="px-6 pt-8 pb-4 flex items-center">{backButton}</div>
        <div className="flex-1 flex items-center justify-center p-10">
          <GarmentIllustration name={garment.name} className="w-full max-w-xs" />
        </div>
      </div>

      {/* Right: scrollable info + pinned CTA */}
      <div className="hidden md:flex md:w-1/2 md:h-screen md:flex-col">
        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-8 pt-10 pb-4">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-caption text-ink-3 mb-6">
            <Link href="/home" className="hover:text-ink transition-colors">All garments</Link>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-ink font-medium">{garment.name}</span>
          </nav>
          {infoContent}
        </div>
        {/* Pinned button — never scrolls away */}
        <div className="shrink-0 px-8 py-6 border-t border-rim">
          <PrimaryButton onClick={onCta}>{ctaLabel}</PrimaryButton>
          {inProgress && (
            <p className="text-caption text-ink-3 text-center mt-2">
              {project!.completedUntil} of {totalSteps} steps done
            </p>
          )}
        </div>
      </div>


      <SizeSheet
        garment={garment}
        open={sizeSheetOpen}
        onClose={() => setSizeSheetOpen(false)}
        initialSize={project?.size ?? profileSize}
        onConfirm={startProject}
      />
    </div>
  )
}
