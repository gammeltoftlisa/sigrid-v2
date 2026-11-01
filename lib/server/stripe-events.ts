import 'server-only'

import type Stripe from 'stripe'

import { getStripe } from '@/lib/stripe'

import { recordEntitlement, type EntitlementStatus } from './entitlements'
import { logEvent } from './log'

const paymentIntentId = (pi: string | { id: string } | null | undefined) => (typeof pi === 'string' ? pi : (pi?.id ?? null))

/** Records what a finished checkout means. Used by the webhook and by the page the buyer returns to. */
export async function applyCheckoutSession(session: Stripe.Checkout.Session, at: number, failed = false) {
  const { garmentId, userId, withdrawalWaiver } = session.metadata ?? {}
  if (!garmentId || !userId) {
    logEvent('warn', 'stripe.session.unknown', { sessionId: session.id })
    return
  }
  const paid = session.payment_status === 'paid' || session.payment_status === 'no_payment_required'
  const status: EntitlementStatus = failed ? 'revoked' : paid ? 'active' : 'processing'
  await recordEntitlement({
    userId,
    garmentId,
    status,
    paymentIntentId: paymentIntentId(session.payment_intent),
    checkoutSessionId: session.id,
    withdrawalWaiver: withdrawalWaiver === 'accepted',
    at,
  })
}

/** Refunds and disputes only name the payment; it was given the buyer and pattern at checkout */
async function changeByPayment(pi: string | { id: string } | null, status: EntitlementStatus, at: number) {
  const id = paymentIntentId(pi)
  if (!id) return
  const { metadata } = await getStripe().paymentIntents.retrieve(id)
  if (!metadata.garmentId || !metadata.userId) return
  await recordEntitlement({ userId: metadata.userId, garmentId: metadata.garmentId, status, paymentIntentId: id, at })
}

export async function handleStripeEvent(event: Stripe.Event) {
  switch (event.type) {
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded':
      return applyCheckoutSession(event.data.object, event.created)
    case 'checkout.session.async_payment_failed':
      return applyCheckoutSession(event.data.object, event.created, true)
    case 'charge.refunded': {
      const charge = event.data.object
      // A partial refund is a goodwill gesture: the buyer keeps the pattern
      if (charge.refunded) await changeByPayment(charge.payment_intent, 'revoked', event.created)
      return
    }
    case 'charge.dispute.created':
      return changeByPayment(event.data.object.payment_intent, 'revoked', event.created)
    case 'charge.dispute.closed':
      if (event.data.object.status === 'won') await changeByPayment(event.data.object.payment_intent, 'active', event.created)
      return
    default:
      logEvent('info', 'stripe.event.ignored', { type: event.type })
  }
}
