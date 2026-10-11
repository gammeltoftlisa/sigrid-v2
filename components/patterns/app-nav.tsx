'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { IconCompass, IconHome, IconNeedleThread, IconUser, type Icon } from '@tabler/icons-react'
import { motion } from 'framer-motion'
import { cn } from 'cn'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

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
      className="fixed inset-x-0 bottom-0 z-40 bg-inverse pb-[env(safe-area-inset-bottom)] text-inverse-foreground md:hidden"
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
                  'relative flex h-16 flex-col items-center justify-center gap-1.5 text-xs font-medium tracking-[0.08em] uppercase outline-none transition-colors focus-visible:bg-inverse-foreground/10',
                  active ? 'text-inverse-foreground' : 'text-inverse-muted hover:text-inverse-foreground',
                )}
              >
                {active && (
                  <motion.span
                    layoutId="tabbar-marker"
                    aria-hidden
                    className="absolute inset-x-6 top-0 h-0.5 bg-brand-on-dark"
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

/** md and up: a slim icon rail with the same destinations; names show as tooltips. */
export function AppSidebar() {
  const isActive = useActive()
  return (
    <aside className="sticky top-0 hidden h-svh w-18 shrink-0 flex-col items-center gap-8 bg-inverse py-6 text-inverse-foreground md:flex">
      <Link href="/home" aria-label="Sigrid home" className="rounded-md px-1 outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
        <span aria-hidden className="relative inline-block font-heading text-[1.6rem] leading-none tracking-[-0.02em]">
          s
          <span className="absolute -top-0.5 -right-1.5 size-1.5 rounded-full bg-brand-on-dark" />
        </span>
      </Link>
      <nav aria-label="Main">
        <ul className="flex flex-col items-center gap-2">
          {items.map(({ href, label, icon: ItemIcon }) => {
            const active = isActive(href)
            return (
              <li key={href}>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Link
                        href={href}
                        aria-label={label}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                          'nav-link relative flex size-11 items-center justify-center rounded-(--radius) outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50',
                          active ? 'text-inverse-foreground' : 'text-inverse-muted hover:bg-inverse-foreground/8 hover:text-inverse-foreground',
                        )}
                      />
                    }
                  >
                    {active && (
                      <motion.span
                        layoutId="sidebar-marker"
                        aria-hidden
                        className="absolute inset-0 rounded-(--radius) bg-inverse-foreground/12"
                        transition={{ type: 'spring', stiffness: 420, damping: 38 }}
                      />
                    )}
                    <ItemIcon className="relative size-5" stroke={active ? 1.75 : 1.4} aria-hidden />
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={10}>
                    {label}
                  </TooltipContent>
                </Tooltip>
              </li>
            )
          })}
        </ul>
      </nav>
      <Tooltip>
        <TooltipTrigger
          render={
            <Link
              href="/profile"
              aria-label="Emma, free beta"
              className="mt-auto rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          }
        >
          <Avatar className="size-9 after:border-inverse-foreground/20">
            <AvatarFallback className="bg-inverse-foreground/10 text-inverse-foreground">E</AvatarFallback>
          </Avatar>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={10}>
          Emma · Free beta
        </TooltipContent>
      </Tooltip>
    </aside>
  )
}
