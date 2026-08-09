import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { ClientProviders } from '@/components/ClientProviders'

const geist = Geist({
  variable: '--font-geist',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Sigrid – Sewing for everyone',
  description: 'A digital sewing platform that guides you from inspiration to finished garment, step by step.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#F9F7F4',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geist.variable} h-full`}>
      <body className="h-full bg-bg font-[var(--font-geist)] antialiased">
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  )
}
