import type { Metadata, Viewport } from 'next'
import { Be_Vietnam_Pro, Fraunces, JetBrains_Mono } from 'next/font/google'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'
import { MotionProvider } from '@/components/motion-provider'
import { ThemeProvider } from '@/components/theme-provider'
import { Atmosphere } from '@/components/patterns/atmosphere'
import './globals.css'

// Display: an expressive serif with optical sizing and the WONK/SOFT axes for italic accents.
// Text: a clean humanist sans. Mono: kickers, labels and code.
const display = Fraunces({ variable: '--font-fraunces', subsets: ['latin', 'latin-ext'], axes: ['SOFT', 'WONK', 'opsz'], display: 'swap' })
const body = Be_Vietnam_Pro({ variable: '--font-vietnam', subsets: ['latin', 'latin-ext'], weight: ['300', '400', '500', '600'], display: 'swap' })
const mono = JetBrains_Mono({ variable: '--font-jetbrains', subsets: ['latin'], weight: ['400', '500'], display: 'swap' })

export const metadata: Metadata = {
  title: 'Sigrid – Sewing for everyone',
  description: 'Sew your own clothes, one calm step at a time. Patterns in your size, with every step explained.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#EFEADE' },
    { media: '(prefers-color-scheme: dark)', color: '#15110D' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${display.variable} ${body.variable} ${mono.variable} h-full antialiased`}>
      <body className="min-h-full bg-background font-sans text-foreground">
        <ThemeProvider>
          <MotionProvider>
            <TooltipProvider>
              <Atmosphere />
              {children}
              <Toaster position="bottom-center" />
            </TooltipProvider>
          </MotionProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
