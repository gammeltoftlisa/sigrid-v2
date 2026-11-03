'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { Analytics } from '@vercel/analytics/next'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { consentVersions, hasGranted, isCurrent, type ConsentKind, type ConsentState, type consentSources } from '@/lib/consent'
import { readRaw, writeRaw } from '@/lib/local-store'

type Source = (typeof consentSources)[number]

/**
 * The analytics answer, kept in this browser too: strictly necessary, to remember the answer before login and
 * to load nothing until it's known. Its account copy (lib/consent-db) is the record; this is only a memory.
 */
const LOCAL_KEY = 'sigrid_consent'
type LocalAnswer = { analytics: boolean; version: string; at: string }

function readLocal(): LocalAnswer | null {
  try {
    const raw = readRaw(LOCAL_KEY)
    const parsed = raw ? (JSON.parse(raw) as LocalAnswer) : null
    return parsed?.version === consentVersions.analytics ? parsed : null
  } catch {
    return null
  }
}

interface ConsentContextValue {
  /** Answers on the account; null until known (or when they couldn't be read) */
  state: ConsentState | null
  /** The analytics answer as this page uses it: from the account, else this browser; null means not asked yet */
  analytics: boolean | null
  /** Records an answer on the account (and in this browser for analytics). Throws when it couldn't be saved. */
  answer: (entries: { kind: ConsentKind; granted: boolean }[], source: Source) => Promise<void>
}

const ConsentContext = createContext<ConsentContextValue | null>(null)

export function useConsent() {
  const value = useContext(ConsentContext)
  if (!value) throw new Error('useConsent needs ConsentProvider')
  return value
}

async function post(entries: { kind: ConsentKind; granted: boolean; source: Source }[]): Promise<ConsentState> {
  const res = await fetch('/api/consent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entries }) })
  if (!res.ok) throw new Error('Could not save consent')
  return (await res.json()) as ConsentState
}

// Pages someone can be on before agreeing to the terms
const OPEN = /^\/(onboarding|legal|sign-in|sign-up)(\/|$)/

/**
 * Consent for the whole app. Analytics loads only once someone has said yes, and never before the answer is
 * known. Anyone logged in who hasn't agreed to the current terms and age check is sent to the welcome to do so.
 */
export function ConsentProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded, userId } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [state, setState] = useState<ConsentState | null>(null)
  const [local, setLocal] = useState<LocalAnswer | null>(null)
  const [localRead, setLocalRead] = useState(false)

  // This browser's answer, once mounted
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocal(readLocal())
    setLocalRead(true)
  }, [])

  // The account's answers. An answer given in the banner before login goes to the account now, as the record.
  useEffect(() => {
    if (!isLoaded || !userId) return
    let stale = false
    fetch('/api/consent', { cache: 'no-store' })
      .then((r) => (r.ok ? (r.json() as Promise<ConsentState>) : Promise.reject(new Error(String(r.status)))))
      .then(async (server) => {
        const before = readLocal()
        if (!isCurrent(server, 'analytics') && before) server = await post([{ kind: 'analytics', granted: before.analytics, source: 'banner' }])
        if (!stale) setState(server)
      })
      // Unknown answers mean nothing optional loads, and nobody is sent anywhere
      .catch((e) => console.warn(e))
    return () => {
      stale = true
    }
  }, [isLoaded, userId])

  // Terms and age: required before using Sigrid, and again when their text changes
  useEffect(() => {
    if (!state || OPEN.test(pathname)) return
    if (!hasGranted(state, 'terms') || !hasGranted(state, 'age')) router.replace('/onboarding?agree=1')
  }, [state, pathname, router])

  const answer = useCallback(
    async (entries: { kind: ConsentKind; granted: boolean }[], source: Source) => {
      const analytics = entries.find((e) => e.kind === 'analytics')
      if (analytics) {
        const next = { analytics: analytics.granted, version: consentVersions.analytics, at: new Date().toISOString() }
        writeRaw(LOCAL_KEY, JSON.stringify(next))
        setLocal(next)
      }
      if (userId) setState(await post(entries.map((e) => ({ ...e, source }))))
    },
    [userId],
  )

  const fromAccount = state && isCurrent(state, 'analytics') ? state.analytics!.granted : null
  const analytics = fromAccount ?? local?.analytics ?? null

  return (
    <ConsentContext.Provider value={{ state, analytics, answer }}>
      {children}
      {/* Nothing is measured before a yes, and a no is respected straight away */}
      {analytics === true && <Analytics />}
      {localRead && analytics === null && !pathname.startsWith('/onboarding') && <ConsentBanner />}
    </ConsentContext.Provider>
  )
}

/**
 * Asks once, plainly. Rejecting is exactly as easy as accepting: the same kind of button, side by side,
 * with nothing chosen in advance. Closing isn't a yes: the banner stays until there's an answer.
 */
function ConsentBanner() {
  const { answer } = useConsent()
  const [busy, setBusy] = useState(false)
  const choose = async (granted: boolean) => {
    setBusy(true)
    try {
      await answer([{ kind: 'analytics', granted }], 'banner')
    } catch {
      // The choice still holds in this browser; only the account's copy is missing, and it's sent again next visit
      toast.error('Your choice is saved on this device, but we couldn’t add it to your account. We’ll try again next time you open Sigrid.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <section
      role="region"
      aria-label="Measuring how Sigrid is used"
      className="glass fixed inset-x-3 bottom-above-tabbar z-50 mx-auto flex max-w-xl flex-col gap-3 rounded-pane p-4 md:bottom-4"
    >
      <div className="flex flex-col gap-1">
        <p className="title-sm">Can we measure how Sigrid is used?</p>
        <p className="text-sm text-muted-foreground">
          Only which pages and features are used, counted without cookies and never sold, to make Sigrid better. Nothing is measured unless you say yes.
          You can change your mind in Settings. <Link href="/legal/privacy" className="underline underline-offset-4">Privacy policy</Link>
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" size="lg" disabled={busy} onClick={() => choose(false)}>
          Reject
        </Button>
        <Button variant="outline" size="lg" disabled={busy} onClick={() => choose(true)}>
          Accept
        </Button>
      </div>
    </section>
  )
}
