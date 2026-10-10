import { IconClock } from '@tabler/icons-react'

import { DifficultyBadge } from '@/components/patterns/difficulty-badge'
import { GarmentImage } from '@/components/garment/GarmentArt'
import { getGarmentById } from '@/lib/data'

/** Static look-alike of the garment page, shown (inert) behind the sewing guide sheet. */
export default function GarmentDetailBg({ garmentId }: { garmentId: string }) {
  const garment = getGarmentById(garmentId)

  return (
    <div aria-hidden inert className="min-h-svh md:grid md:grid-cols-2">
      <div className="md:flex md:h-svh md:flex-col">
        <div className="px-4 pt-4 sm:px-6 md:pt-6">
          <div className="size-9 rounded-lg" />
        </div>
        <GarmentImage
          name={garment.name}
          className="mx-4 mt-4 aspect-[4/5] p-10 sm:mx-6 md:m-0 md:mt-6 md:aspect-auto md:flex-1 md:p-16"
          artClassName="max-w-72 md:max-w-sm"
        />
      </div>
      <div className="mx-auto flex w-full max-w-xl flex-col gap-3 px-4 pt-6 sm:px-6 md:pt-16">
        <h1 className="text-2xl font-semibold tracking-tight">{garment.name}</h1>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <DifficultyBadge difficulty={garment.difficulty} />
          <span className="inline-flex items-center gap-1">
            <IconClock className="size-4" />
            {garment.estimatedTime}
          </span>
        </div>
        <p className="text-base leading-relaxed text-muted-foreground">{garment.description}</p>
      </div>
    </div>
  )
}
