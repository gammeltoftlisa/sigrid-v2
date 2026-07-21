'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'

const tabs = [
  {
    href: '/home',
    label: 'Home',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M3 10.5L12 3L21 10.5V20C21 20.55 20.55 21 20 21H15V16H9V21H4C3.45 21 3 20.55 3 20V10.5Z"
          fill={active ? 'var(--sig-primary)' : 'none'}
          stroke={active ? 'var(--sig-primary)' : 'var(--sig-ink-3)'}
          strokeWidth="1.75"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: '/explore',
    label: 'Explore',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle
          cx="12"
          cy="12"
          r="9"
          stroke={active ? 'var(--sig-primary)' : 'var(--sig-ink-3)'}
          strokeWidth="1.75"
        />
        <path
          d="M16.5 7.5L14 12.5L9 15L11.5 10L16.5 7.5Z"
          fill={active ? 'var(--sig-primary)' : 'var(--sig-ink-3)'}
          stroke={active ? 'var(--sig-primary)' : 'var(--sig-ink-3)'}
          strokeWidth="0.5"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: '/projects',
    label: 'Projects',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect
          x="3"
          y="5"
          width="18"
          height="15"
          rx="2"
          fill={active ? 'var(--sig-primary-soft)' : 'none'}
          stroke={active ? 'var(--sig-primary)' : 'var(--sig-ink-3)'}
          strokeWidth="1.75"
        />
        <path
          d="M8 5V4C8 3.45 8.45 3 9 3H15C15.55 3 16 3.45 16 4V5"
          stroke={active ? 'var(--sig-primary)' : 'var(--sig-ink-3)'}
          strokeWidth="1.75"
          strokeLinecap="round"
        />
        <path
          d="M8 12L10.5 14.5L16 9"
          stroke={active ? 'var(--sig-primary)' : 'var(--sig-ink-3)'}
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: '/profile',
    label: 'Profile',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle
          cx="12"
          cy="8"
          r="4"
          fill={active ? 'var(--sig-primary)' : 'none'}
          stroke={active ? 'var(--sig-primary)' : 'var(--sig-ink-3)'}
          strokeWidth="1.75"
        />
        <path
          d="M4 20C4 17.24 7.58 15 12 15C16.42 15 20 17.24 20 20"
          stroke={active ? 'var(--sig-primary)' : 'var(--sig-ink-3)'}
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
]

export default function TabBar() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-surface border-t border-rim-soft safe-bottom">
      <div className="flex items-center justify-around px-2 pb-safe pt-2 pb-3">
        {tabs.map((tab) => {
          const active = pathname === tab.href || pathname.startsWith(tab.href + '/')
          return (
            <Link key={tab.href} href={tab.href} className="flex flex-col items-center gap-1 flex-1 py-1">
              <motion.div
                animate={{ scale: active ? 1.08 : 1 }}
                transition={{ duration: 0.2 }}
              >
                {tab.icon(active)}
              </motion.div>
              <span
                className="text-[11px] font-medium leading-none"
                style={{ color: active ? 'var(--sig-primary)' : 'var(--sig-ink-3)' }}
              >
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
