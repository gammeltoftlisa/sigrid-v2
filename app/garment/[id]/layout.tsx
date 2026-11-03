import type { Metadata } from 'next'

import { GarmentFrame } from '@/components/garment/garment-frame'
import { catalogGarments } from '@/lib/data'

// The pattern's own name in the browser tab. Patterns published from the studio live in one browser,
// so the server doesn't know their names and the tab says "Pattern".
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  return { title: catalogGarments.find((g) => g.id === id)?.name ?? 'Pattern' }
}

export default function GarmentIdLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  return <GarmentFrame params={params}>{children}</GarmentFrame>
}
