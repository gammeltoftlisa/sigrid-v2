'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { IconCompass, IconHome, IconShoppingBag, IconUser, type Icon } from '@tabler/icons-react'
import { motion } from 'motion/react'
import { cn } from 'cn'

import { Logomark } from '@/components/patterns/wordmark'
import { UserAvatar } from '@/components/patterns/profile-photo'


import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const items: { href: string; label: string; /** Tab bar label, when the name is too long for a phone */ short?: string; icon: Icon }[] = [
  { href: '/home', label: 'Home', icon: IconHome },
  { href: '/explore', label: 'Explore', icon: IconCompass },
  { href: '/fabric', label: 'Shop', icon: IconShoppingBag },
  { href: '/profile', label: 'You', icon: IconUser },
]

function useActive() {
  const pathname = usePathname()
  return (href: string) => pathname === href || pathname.startsWith(href + '/')
}

/** Phones: a floating glass tab bar, like iOS. Thin icons, short labels, a round pill marks the current tab. */
export function AppTabBar() {
  const isActive = useActive()
  return (
    <nav
      aria-label="Main"
      className="glass fixed inset-x-3 bottom-tabbar z-40 mx-auto max-w-md rounded-full p-1 text-foreground md:hidden"
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
                  'nav-link rail-link relative flex h-13 flex-col items-center justify-center gap-0.5 rounded-full text-2xs font-medium outline-none transition-colors',
                  active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {active && (
                  <motion.span
                    layoutId="tabbar-marker"
                    aria-hidden
                    className="control-thumb absolute inset-0 rounded-full"
                    transition={{ type: 'spring', bounce: 0.22, duration: 0.5 }}
                  />
                )}
                {href === '/profile' ? (
                  <UserAvatar className="relative size-5" />
                ) : (
                  <ItemIcon className="relative size-5" stroke={active ? 1.75 : 1.4} aria-hidden />
                )}
                <span className="relative">{short ?? label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

/**
 * The rail's mark for the current page: one round stitched bubble that glides to whichever destination is open,
 * the avatar included. Round like the hover under it and the avatar, so nothing changes shape. A soft spring with a
 * little give, so it settles rather than snaps. Its layoutId is shared app-wide (MotionProvider's LayoutGroup),
 * so it glides even when the page's frame changes.
 */
function RailMarker() {
  return (
    <motion.span
      layoutId="sidebar-marker"
      aria-hidden
      className="control-thumb absolute inset-0 rounded-full"
      transition={{ type: 'spring', bounce: 0.22, duration: 0.5 }}
    />
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
          {/* You is the avatar at the bottom of the rail, so it isn't repeated here */}
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
                          'nav-link rail-link relative flex size-11 items-center justify-center rounded-full outline-none',
                          active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                        )}
                      />
                    }
                  >
                    {active && <RailMarker />}
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
              aria-label="You"
              aria-current={isActive('/profile') ? 'page' : undefined}
              className="nav-link rail-link relative mt-auto flex size-11 items-center justify-center rounded-full outline-none"
            />
          }
        >
          {/* The same marker slides down here, instead of a ring of its own */}
          {isActive('/profile') && <RailMarker />}
          <UserAvatar className="relative size-9" />
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={10}>
          You
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
