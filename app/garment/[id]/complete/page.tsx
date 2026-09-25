import { redirect } from 'next/navigation'

// "Done" used to be a flow step; finishing now opens a dialog over the guide.
export default async function OldDoneStep({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  redirect(`/garment/${id}`)
}
