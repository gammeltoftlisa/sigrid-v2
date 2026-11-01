import 'server-only'

import { clerkClient } from '@clerk/nextjs/server'
import Stripe from 'stripe'

/** Stripe's SDK retries by itself, with idempotency keys, so it isn't wrapped in lib/server/fetch-with-retry */
const TIMEOUT_MS = 10_000
const MAX_RETRIES = 2

let client: Stripe | null = null

/** Connects on first use, because `next build` runs this file without keys */
export function getStripe(): Stripe {
  if (client) return client
  if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY is not set')
  client = new Stripe(process.env.STRIPE_SECRET_KEY, { timeout: TIMEOUT_MS, maxNetworkRetries: MAX_RETRIES })
  return client
}

/** Test seam */
export function setStripeForTests(fake: Stripe | null) {
  client = fake
}

/** The Stripe customer of a logged-in user, kept on their Clerk account where only the server can read it. */
async function customerFor(userId: string) {
  const user = await (await clerkClient()).users.getUser(userId)
  const email = user.primaryEmailAddress?.emailAddress
  const stored = user.privateMetadata.stripeCustomerId
  if (typeof stored === 'string') return { customerId: stored, email }
  const customer = await getStripe().customers.create(
    { email, metadata: { clerkUserId: userId } },
    // Two tabs at once still make one customer
    { idempotencyKey: `customer-${userId}` },
  )
  await (await clerkClient()).users.updateUserMetadata(userId, { privateMetadata: { stripeCustomerId: customer.id } })
  return { customerId: customer.id, email }
}

/** A checkout page stays payable for at least an hour; two tabs within the same hour share one */
const HOUR = 3600

/**
 * Stripe's own payment page for one pattern. The card is typed there and never reaches Sigrid.
 * One open page per person and pattern, so two tabs or a double click can't lead to paying twice.
 */
export async function createCheckout({ userId, garmentId, name, price, origin }: { userId: string; garmentId: string; name: string; price: number; origin: string }) {
  const stripe = getStripe()
  const { customerId, email } = await customerFor(userId)

  const open = await stripe.checkout.sessions.list({ customer: customerId, status: 'open', limit: 100 })
  const existing = open.data.find((s) => s.metadata?.garmentId === garmentId && s.metadata?.userId === userId && s.url)
  if (existing) return existing.url

  const metadata = { garmentId, userId, withdrawalWaiver: 'accepted' }
  // Fixed within the hour, because Stripe refuses a repeated key with different values
  const bucket = Math.floor(Date.now() / 1000 / HOUR) * HOUR
  const session = await stripe.checkout.sessions.create(
    {
      mode: 'payment',
      customer: customerId,
      line_items: [{ quantity: 1, price_data: { currency: 'eur', unit_amount: Math.round(price * 100), product_data: { name } } }],
      metadata,
      // Refunds and disputes only mention the payment, so it carries who and what as well
      payment_intent_data: {
        metadata,
        receipt_email: email,
        description: `${name}. You asked to start straight away and confirmed that you lose the right to cancel once you open the pattern or guide.`,
      },
      expires_at: bucket + 2 * HOUR,
      success_url: `${origin}/garment/${garmentId}?checkout_session={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/garment/${garmentId}`,
    },
    { idempotencyKey: `checkout-${userId}-${garmentId}-${bucket}` },
  )
  return session.url
}
