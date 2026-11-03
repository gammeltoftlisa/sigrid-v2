import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Pattern studio' }

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
