import type { Metadata } from 'next'

import { findCreator } from '@/lib/data'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  return { title: findCreator(id)?.name ?? 'Maker not found' }
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
