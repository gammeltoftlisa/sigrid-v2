'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { IconCompass, IconHome, IconNeedleThread, IconUser, type Icon } from '@tabler/icons-react'
import { motion } from 'framer-motion'
import { cn } from 'cn'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'

import { Wordmark } from '@/components/patterns/wordmark'

const items: { href: string; label: string; icon: Icon }[] = [
  { href: '/home', label: 'Home', icon: IconHome },
  { href: '/explore', label: 'Explore', icon: IconCompass },
  { href: '/projects', label: 'Projects', icon: IconNeedleThread },
  { href: '/profile', label: 'Profile', icon: IconUser },
]

function useActive() {
  const pathname = usePathname()
  return (href: string) => pathname === href || pathname.startsWith(href + '/')
}

/** Phones: fixed bottom tab bar. Thin icons, small caps labels, a hairline marks the current tab. */
export function AppTabBar() {
  const isActive = useActive()
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-backdrop-filter:bg-background/85 md:hidden"
    >
      <ul className="mx-auto flex max-w-md">
        {items.map(({ href, label, icon: ItemIcon }) => {
          const active = isActive(href)
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex h-16 flex-col items-center justify-center gap-1.5 text-xs font-medium tracking-[0.08em] uppercase outline-none transition-colors focus-visible:bg-muted',
                  active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {active && (
                  <motion.span
                    layoutId="tabbar-marker"
                    aria-hidden
                    className="absolute inset-x-6 top-0 h-px bg-foreground"
                    transition={{ type: 'spring', stiffness: 420, damping: 38 }}
                  />
                )}
                <ItemIcon className="size-5" stroke={1.25} aria-hidden />
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

/** md and up: left sidebar with the same destinations. */
export function AppSidebar() {
  const isActive = useActive()
  return (
    <aside className="sticky top-0 hidden h-svh w-60 shrink-0 flex-col gap-6 border-r px-3 py-6 md:flex">
      <Link href="/home" aria-label="Sigrid home" className="self-start rounded-md px-3 outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
        <Wordmark />
      </Link>
      <nav aria-label="Main">
        <ul className="flex flex-col gap-1">
          {items.map(({ href, label, icon: ItemIcon }) => {
            const active = isActive(href)
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'nav-link flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50',
                    active ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                  )}
                >
                  <ItemIcon className="nav-icon size-5" aria-hidden />
                  <span className="relative">
                    {label}
                    {active && (
                      <motion.span
                        layoutId="sidebar-marker"
                        aria-hidden
                        className="absolute inset-x-0 -bottom-1.5 h-px bg-foreground"
                        transition={{ type: 'spring', stiffness: 420, damping: 38 }}
                      />
                    )}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
      <Link
        href="/profile"
        className="mt-auto flex items-center gap-3 border-t px-3 pt-5 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <Avatar className="size-9">
          <AvatarFallback>E</AvatarFallback>
        </Avatar>
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-medium">Emma</span>
          <span className="eyebrow text-muted-foreground">Free beta</span>
        </span>
      </Link>
    </aside>
  )
}
