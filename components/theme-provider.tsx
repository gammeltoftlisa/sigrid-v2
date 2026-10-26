'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'

/** Light and dark themes on `<html data-theme>`. Follows the system until the user picks one in Profile. */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="data-theme" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
    </NextThemesProvider>
  )
}
