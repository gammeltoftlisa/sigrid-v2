'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { loadStripe, type Appearance } from '@stripe/stripe-js'
import { CheckoutElementsProvider, PaymentElement, useCheckoutElements } from '@stripe/react-stripe-js/checkout'
import { IconLock, IconShieldLock } from '@tabler/icons-react'
import { toast } from 'sonner'

import { Panel } from '@/components/patterns/panel'
import { StatusMessage } from '@/components/patterns/status-message'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'

// Loaded once, and only on the checkout page
// in English, like the rest of Sigrid
const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, { locale: 'en' }) : null

/** A design token as a colour Stripe understands. Its fields live in a frame that can't read our CSS. */
function tokenColor(name: string) {
  const probe = document.createElement('span')
  probe.style.color = `var(${name})`
  document.body.appendChild(probe)
  const color = getComputedStyle(probe).color
  probe.remove()
  return color
}

/** Stripe's card fields drawn like Sigrid's own: fully rounded, no ring, a crisp ink edge while typing */
function appearance(): Appearance {
  const text = tokenColor('--app-text')
  const soft = tokenColor('--app-text-soft')
  const edge = tokenColor('--app-border-strong')
  const hover = tokenColor('--control-border-hover')
  const danger = tokenColor('--destructive')
  const fill = tokenColor('--app-elev')
  const chosen = tokenColor('--control-active')
  const chosenEdge = tokenColor('--control-border-active')
  return {
    theme: 'flat',
    variables: {
      fontFamily: '"Be Vietnam Pro", ui-sans-serif, sans-serif',
      fontSizeBase: '15px',
      fontWeightNormal: '400',
      fontWeightMedium: '500',
      fontWeightBold: '500',
      colorPrimary: text,
      colorText: text,
      colorTextSecondary: soft,
      colorTextPlaceholder: soft,
      colorIcon: soft,
      colorDanger: danger,
      colorBackground: fill,
      borderRadius: '14px',
      spacingUnit: '4px',
      gridRowSpacing: '16px',
      gridColumnSpacing: '12px',
      focusBoxShadow: 'none',
      focusOutline: 'none',
    },
    rules: {
      '.Label': { fontSize: '13px', fontWeight: '500', color: text, marginBottom: '8px' },
      '.Input': { border: `1px dashed ${edge}`, borderRadius: '22px', boxShadow: 'none', padding: '10px 14px' },
      '.Input:hover': { border: `1px dashed ${hover}` },
      '.Input:focus': { border: `1px solid ${text}`, boxShadow: 'none' },
      '.Input--invalid': { border: `1px solid ${danger}`, boxShadow: 'none' },
      '.Error': { fontSize: '13px', marginTop: '6px' },
      // A chosen method is the lighter control state with a firmer stitch, never ink
      '.AccordionItem': { border: `1px dashed ${edge}`, boxShadow: 'none', backgroundColor: 'transparent', padding: '14px 16px' },
      '.AccordionItem:hover': { border: `1px dashed ${hover}`, color: text },
      '.AccordionItem--selected': { border: `1.5px dashed ${chosenEdge}`, backgroundColor: chosen, color: text },
      '.RadioIcon': { width: '18px' },
      '.RadioIconOuter': { stroke: edge },
      '.RadioIconInner': { fill: text },
    },
  }
}

const fonts = [{ cssSrc: 'https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500&display=swap' }]

/**
 * Paying for one pattern, on Sigrid's own page. Stripe's fields sit inside it, so the card goes
 * straight to Stripe and never reaches Sigrid. Starts the checkout on the server, which looks up
 * the price and refuses a pattern you already own.
 */
export function CheckoutForm({ garmentId, price }: { garmentId: string; price: number }) {
  const router = useRouter()
  const { resolvedTheme } = useTheme()
  const [session, setSession] = useState<{ sessionId: string; clientSecret: string; email?: string } | null>(null)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let live = true
    fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ garmentId }) })
      .then(async (res) => {
        // Bought in another tab or on another device, or a payment for it is still clearing
        if (res.status === 409) {
          const { error } = (await res.json().catch(() => ({}))) as { error?: string }
          if (error?.includes('processed')) toast.info('Your payment for this pattern is still being processed, so you can’t be charged twice. It opens as soon as it clears.', { duration: 10_000 })
          return router.replace(`/garment/${garmentId}`)
        }
        if (!res.ok) throw new Error(String(res.status))
        const next = (await res.json()) as { sessionId: string; clientSecret: string; email?: string }
        if (live) setSession(next)
      })
      .catch(() => live && setFailed(true))
    return () => {
      live = false
    }
  }, [garmentId, router, attempt])

  // Read once the theme is known, so the fields match light or dark
  const options = useMemo(
    () => (session && resolvedTheme ? { clientSecret: session.clientSecret, elementsOptions: { appearance: appearance(), fonts, loader: 'never' as const } } : null),
    [session, resolvedTheme],
  )

  if (failed || !stripePromise) {
    return (
      <Panel glass label="Payment">
        <StatusMessage
          status="error"
          title="The payment form didn’t load"
          action={
            <Button size="sm" variant="outline" onClick={() => { setFailed(false); setAttempt((n) => n + 1) }}>
              Try again
            </Button>
          }
        >
          Nothing was charged. This is usually a connection problem.
        </StatusMessage>
      </Panel>
    )
  }

  return (
    <Panel glass label="Payment" meta={<SecureMark />}>
      {options && session ? (
        // A new theme redraws Stripe's fields in its colours
        <CheckoutElementsProvider key={resolvedTheme} stripe={stripePromise} options={options}>
          <PayForm garmentId={garmentId} price={price} sessionId={session.sessionId} email={session.email} />
        </CheckoutElementsProvider>
      ) : (
        <FormSkeleton />
      )}
    </Panel>
  )
}

function SecureMark() {
  return (
    <span className="flex items-center gap-1 text-muted-foreground">
      <IconLock aria-hidden className="size-3.5" />
      Encrypted
    </span>
  )
}

function FormSkeleton() {
  return (
    <div className="flex flex-col gap-4 px-1 py-1" aria-busy aria-label="Loading the payment form">
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-14 rounded-(--control-radius)" />
        <Skeleton className="h-14 rounded-(--control-radius)" />
      </div>
      <Skeleton className="h-10 rounded-full" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-10 rounded-full" />
        <Skeleton className="h-10 rounded-full" />
      </div>
      <Skeleton className="h-11 rounded-full" />
    </div>
  )
}

function PayForm({ garmentId, price, sessionId, email }: { garmentId: string; price: number; sessionId: string; email?: string }) {
  const router = useRouter()
  const state = useCheckoutElements()
  const [agreed, setAgreed] = useState(false)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (state.type === 'loading') return <FormSkeleton />
  if (state.type === 'error') {
    return (
      <StatusMessage status="error" title="The payment form didn’t load">
        Nothing was charged. Reload the page to try again.
      </StatusMessage>
    )
  }
  const { checkout } = state

  const pay = async () => {
    setPaying(true)
    setError(null)
    try {
      // The waiver goes on the payment before Stripe takes it, so it's kept with the purchase
      const res = await fetch('/api/checkout', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId, acceptWithdrawalWaiver: true }) })
      if (!res.ok) throw new Error('waiver')
    } catch {
      setPaying(false)
      setError('We couldn’t reach Sigrid, so nothing was charged. Check your connection, then press Pay again.')
      return
    }
    const result = await checkout.confirm({ redirect: 'if_required' })
    if (result.type === 'error') {
      setPaying(false)
      setError(result.error.message)
      return
    }
    // The pattern page asks Stripe once more, unlocks it and opens the size choice
    router.replace(`/garment/${garmentId}?checkout_session=${sessionId}`)
  }

  const disabled = !agreed || paying || !checkout.canConfirm

  return (
    <div className="flex flex-col gap-4 px-1 pt-1">
      {/* Card first, one method open at a time. Which methods show is set by paymentMethodSetup in lib/stripe.ts */}
      <PaymentElement
        options={{
          layout: { type: 'accordion', defaultCollapsed: false, radios: 'if_multiple', spacedAccordionItems: true },
          paymentMethodOrder: ['card', 'apple_pay', 'google_pay'],
          wallets: { applePay: 'auto', googlePay: 'auto' },
        }}
      />

      <label className="flex items-start gap-3 rounded-(--control-radius) bg-card p-3 text-sm">
        <Checkbox checked={agreed} onCheckedChange={setAgreed} className="mt-0.5" />
        <span>
          Start straight away. I understand I can’t cancel once I open the pattern or the guide. Until then, I can cancel within 14 days.{' '}
          <Link href="/legal/refunds" target="_blank" rel="noopener" className="text-muted-foreground underline underline-offset-4">
            Refund policy
          </Link>
        </span>
      </label>

      {error && (
        <StatusMessage status="error" title="The payment didn’t go through">
          {error}
        </StatusMessage>
      )}

      <div className="flex flex-col gap-2">
        <Button size="lg" className="w-full" disabled={disabled} onClick={pay}>
          {paying ? <Spinner data-icon="inline-start" /> : <IconLock data-icon="inline-start" />}
          {paying ? 'Paying…' : `Pay €${price}`}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          {!agreed
            ? 'Tick the box above to pay.'
            : !checkout.canConfirm
              ? 'Fill in your payment details to pay.'
              : email
                ? `Your receipt goes to ${email}.`
                : 'You’ll get a receipt by email.'}
        </p>
      </div>

      <p className="flex items-start gap-2 border-t pt-3 text-xs text-muted-foreground">
        <IconShieldLock aria-hidden className="size-4 shrink-0" />
        <span>
          Payments are encrypted and handled by Stripe. Your card details go straight to Stripe and never reach Sigrid. By paying you agree to the{' '}
          <Link href="/legal/terms" target="_blank" rel="noopener" className="underline underline-offset-4">
            terms
          </Link>
          .
        </span>
      </p>
    </div>
  )
}
