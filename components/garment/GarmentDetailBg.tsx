import { getGarmentById } from '@/lib/data'
import GarmentIllustration from '@/components/ui/GarmentIllustration'
import DifficultyBadge from '@/components/ui/DifficultyBadge'

export default function GarmentDetailBg({ garmentId }: { garmentId: string }) {
  const garment = getGarmentById(garmentId)

  return (
    <div className="bg-bg md:flex md:h-screen md:overflow-hidden min-h-screen">
      {/* Mobile: stacked */}
      <div className="md:hidden px-5 pt-14 pb-4">
        <div className="w-10 h-10 rounded-full bg-surface shadow-soft" />
      </div>
      <div className="md:hidden mx-5 mb-6 bg-surface rounded-3xl overflow-hidden shadow-soft p-8 aspect-square flex items-center justify-center">
        <GarmentIllustration name={garment.name} className="w-full h-full max-w-56" />
      </div>
      <div className="md:hidden px-5">
        <h1 className="text-title font-bold text-ink mb-2">{garment.name}</h1>
        <div className="flex items-center gap-2 mb-3">
          <DifficultyBadge difficulty={garment.difficulty} size="md" />
        </div>
        <p className="text-body text-ink-2 leading-relaxed">{garment.description}</p>
      </div>

      {/* Desktop: two-column */}
      <div className="hidden md:flex md:w-1/2 md:h-screen md:flex-col md:bg-surface md:border-r md:border-rim">
        <div className="px-6 pt-8 pb-4">
          <div className="w-10 h-10 rounded-full bg-bg shadow-soft" />
        </div>
        <div className="flex-1 flex items-center justify-center p-10">
          <GarmentIllustration name={garment.name} className="w-full max-w-xs" />
        </div>
      </div>
      <div className="hidden md:flex md:w-1/2 md:flex-col md:overflow-hidden">
        <div className="px-8 pt-10">
          <p className="text-caption text-ink-3 mb-6">All garments › {garment.name}</p>
          <h1 className="text-title font-bold text-ink mb-2">{garment.name}</h1>
          <div className="flex items-center gap-2 mb-4">
            <DifficultyBadge difficulty={garment.difficulty} size="md" />
            <span className="text-caption text-ink-3">⏱ {garment.estimatedTime}</span>
          </div>
          <p className="text-body text-ink-2 leading-relaxed">{garment.description}</p>
        </div>
      </div>
    </div>
  )
}
