import { redirect } from 'next/navigation'

// Size used to be a flow step; it's now chosen in a sheet on the garment page.
export default async function OldSizeStep({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  redirect(`/garment/${id}`)
}
