'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { IconCompass, IconHome, IconNeedleThread, IconShoppingBag, IconUser, type Icon } from '@tabler/icons-react'
import { motion } from 'framer-motion'
import { cn } from 'cn'

import { Logomark } from '@/components/patterns/wordmark'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const items: { href: string; label: string; /** Tab bar label, when the name is too long for a phone */ short?: string; icon: Icon }[] = [
  { href: '/home', label: 'Home', icon: IconHome },
  { href: '/explore', label: 'Explore', icon: IconCompass },
  { href: '/projects', label: 'Projects', icon: IconNeedleThread },
  { href: '/fabric', label: 'Find fabric', short: 'Fabric', icon: IconShoppingBag },
  { href: '/profile', label: 'Profile', icon: IconUser },
]

function useActive() {
  const pathname = usePathname()
  return (href: string) => pathname === href || pathname.startsWith(href + '/')
}

/** Phones: a floating glass tab bar, like iOS. Thin icons, short labels, a soft pill marks the current tab. */
export function AppTabBar() {
  const isActive = useActive()
  return (
    <nav
      aria-label="Main"
      className="glass fixed inset-x-3 bottom-tabbar z-40 mx-auto max-w-md rounded-pane-lg p-1 text-foreground md:hidden"
    >
      <ul className="flex">
        {items.map(({ href, label, short, icon: ItemIcon }) => {
          const active = isActive(href)
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex h-13 flex-col items-center justify-center gap-0.5 rounded-pane-inner text-2xs font-medium outline-none transition-colors',
                  active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {active && (
                  <motion.span
                    layoutId="tabbar-marker"
                    aria-hidden
                    className="absolute inset-0 rounded-pane-inner bg-foreground/7"
                    transition={{ type: 'spring', stiffness: 420, damping: 38 }}
                  />
                )}
                <ItemIcon className="relative size-5" stroke={active ? 1.75 : 1.4} aria-hidden />
                <span className="relative">{short ?? label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

/** md and up: a slim floating glass rail with the same destinations; names show as tooltips. */
export function AppSidebar() {
  const isActive = useActive()
  return (
    <aside className="sticky top-0 hidden h-svh w-20 shrink-0 p-2 md:block">
      <div className="glass flex h-full flex-col items-center gap-8 rounded-pane py-5 text-foreground">
      <Link href="/home" aria-label="Sigrid home" className="rounded-md px-1 outline-none">
        <Logomark />
      </Link>
      <nav aria-label="Main">
        <ul className="flex flex-col items-center gap-2">
          {/* Profile is the avatar at the bottom of the rail, so it isn't repeated here */}
          {items.filter((i) => i.href !== '/profile').map(({ href, label, icon: ItemIcon }) => {
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
                          'nav-link relative flex size-11 items-center justify-center rounded-xl outline-none transition-colors',
                          active ? 'text-foreground' : 'text-muted-foreground hover:bg-foreground/5 hover:text-foreground',
                        )}
                      />
                    }
                  >
                    {active && (
                      <motion.span
                        layoutId="sidebar-marker"
                        aria-hidden
                        className="absolute inset-0 rounded-xl bg-foreground/7"
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
              aria-label="Profile"
              aria-current={isActive('/profile') ? 'page' : undefined}
              className={cn(
                'mt-auto rounded-full outline-none',
                isActive('/profile') && 'outline-2 outline-offset-2 outline-foreground/70',
              )}
            />
          }
        >
          <Avatar className="size-9">
            <AvatarFallback className="bg-foreground/7 text-foreground"><IconUser className="size-4" aria-hidden /></AvatarFallback>
          </Avatar>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={10}>
          Profile
        </TooltipContent>
      </Tooltip>
      </div>
    </aside>
  )
}

/**
 * The app frame: icon rail on md+, tab bar on phones, content in between.
 * Every screen sits in it except the sewing guide, which takes the whole screen.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh">
      <AppSidebar />
      {/* Phones: room for the floating tab bar (52px + 8px padding + its gap from the edge) */}
      <div className="min-w-0 flex-1 pb-tabbar md:pb-0">
        {children}
      </div>
      <AppTabBar />
    </div>
  )
}
