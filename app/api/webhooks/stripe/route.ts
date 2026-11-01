import { errorMessage, logEvent, withRequestId } from '@/lib/server/log'
import { eventAlreadyHandled, markEventHandled } from '@/lib/server/entitlements'
import { handleStripeEvent } from '@/lib/server/stripe-events'
import { getStripe } from '@/lib/stripe'

/**
 * Stripe's word on what happened to a payment. It can arrive twice or out of order; see
 * recordEntitlement. Answering 500 makes Stripe send the event again, for up to three days.
 */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  const signature = request.headers.get('stripe-signature')
  if (!secret) {
    logEvent('error', 'stripe.webhook', { reason: 'missing_secret' })
    return Response.json({ error: 'Not set up' }, { status: 500 })
  }
  if (!signature) return Response.json({ error: 'No signature' }, { status: 400 })

  const body = await request.text()
  let event
  try {
    event = getStripe().webhooks.constructEvent(body, signature, secret)
  } catch (error) {
    logEvent('warn', 'stripe.webhook', { reason: 'bad_signature', error: errorMessage(error) })
    return Response.json({ error: 'Bad signature' }, { status: 400 })
  }

  const verified = event
  return withRequestId(verified.id, async () => {
    try {
      if (await eventAlreadyHandled(verified.id)) return Response.json({ received: true, repeat: true })
      await handleStripeEvent(verified)
      await markEventHandled(verified.id, verified.type)
      logEvent('info', 'stripe.webhook', { type: verified.type })
      return Response.json({ received: true })
    } catch (error) {
      logEvent('error', 'stripe.webhook', { type: verified.type, reason: 'handler_failed', error: errorMessage(error) })
      return Response.json({ error: 'Try again' }, { status: 500 })
    }
  })
}
