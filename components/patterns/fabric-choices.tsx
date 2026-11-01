'use client'

import Link from 'next/link'

import { GarmentImage } from '@/components/garment/GarmentImage'

/** A small photo of the garment, linking back to its page. Sits in front of the garment field. */
export function GarmentThumb({ id, name, photoSrc }: { id: string; name: string; photoSrc?: string | null }) {
  return (
    <Link href={`/garment/${id}`} aria-label={`${name}: open the pattern`} className="group/tile shrink-0 rounded-(--image-radius) outline-none">
      <GarmentImage name={name} photoSrc={photoSrc} sizes="64px" className="garment-thumb rounded-(--image-radius)" imageClassName="max-w-8 hover-zoom" />
    </Link>
  )
}
