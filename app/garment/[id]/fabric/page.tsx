import { redirect } from 'next/navigation'

// Find fabric is its own page in the main navigation; this keeps old links working.
export default async function GarmentFabric({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  redirect(`/fabric?garment=${id}`)
}
