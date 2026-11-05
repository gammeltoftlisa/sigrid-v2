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
  methodSetup = null
}

/** What Sigrid's checkout offers. Apple Pay and Google Pay show only on devices that have them. */
const METHOD_SETUP = 'Sigrid checkout'
const OFFERED = new Set(['card', 'apple_pay', 'google_pay'])
let methodSetup: Promise<string> | null = null

/**
 * The id of Sigrid's own payment method setup in Stripe: cards and phone wallets, nothing else,
 * not even Link's "save my info" form. The account's default offers every method Stripe has turned
 * on, and this Stripe version no longer takes a list of methods per checkout, so a named setup is
 * the only way. Made on the first checkout in test and in live mode alike, then found by name.
 */
function paymentMethodSetup(): Promise<string> {
  methodSetup ??= (async () => {
    const stripe = getStripe()
    const setups = await stripe.paymentMethodConfigurations.list({ limit: 100 })
    const ours = setups.data.find((c) => c.name === METHOD_SETUP && c.active)
    if (ours) return ours.id
    // Every method the account knows, so the ones not offered are switched off rather than left to Stripe
    const base = setups.data.find((c) => c.is_default && !c.parent) ?? setups.data[0]
    const known = Object.keys(base ?? {}).filter((k) => {
      const v = (base as unknown as Record<string, unknown>)[k]
      return !!v && typeof v === 'object' && 'display_preference' in v
    })
    const params: Record<string, unknown> = { name: METHOD_SETUP }
    for (const m of new Set([...known, ...OFFERED])) params[m] = { display_preference: { preference: OFFERED.has(m) ? 'on' : 'off' } }
    const made = await stripe.paymentMethodConfigurations.create(params as Stripe.PaymentMethodConfigurationCreateParams, { idempotencyKey: 'payment-method-setup-v1' })
    return made.id
  })().catch((err) => {
    // Try again on the next checkout
    methodSetup = null
    throw err
  })
  return methodSetup
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

/**
 * A finished, paid checkout for this person and pattern, if Stripe has one. Normally the webhook has
 * already recorded it; this catches the gap before it arrives, so nobody is offered the same pattern twice.
 */
export async function findPaidCheckout(userId: string, garmentId: string): Promise<Stripe.Checkout.Session | null> {
  const user = await (await clerkClient()).users.getUser(userId)
  const customer = user.privateMetadata.stripeCustomerId
  if (typeof customer !== 'string') return null
  const done = await getStripe().checkout.sessions.list({ customer, status: 'complete', limit: 100 })
  return done.data.find((s) => s.metadata?.garmentId === garmentId && s.metadata?.userId === userId && (s.payment_status === 'paid' || s.payment_status === 'no_payment_required')) ?? null
}

/** A checkout stays payable for at least an hour; two tabs within the same hour share one */
const HOUR = 3600

/**
 * Starts paying for one pattern, on Sigrid's own checkout page. The card is typed into Stripe's
 * fields in that page and never reaches Sigrid. One open checkout per person and pattern, so two tabs
 * or a double click can't lead to paying twice. Returns what the page needs to show Stripe's fields.
 */
export async function createCheckout({ userId, garmentId, name, price, origin }: { userId: string; garmentId: string; name: string; price: number; origin: string }) {
  const stripe = getStripe()
  const { customerId, email } = await customerFor(userId)

  const open = await stripe.checkout.sessions.list({ customer: customerId, status: 'open', limit: 100 })
  const existing = open.data.find((s) => s.metadata?.garmentId === garmentId && s.metadata?.userId === userId && s.ui_mode === 'elements')
  if (existing) {
    // A list leaves the secret out, so ask for this one
    const again = existing.client_secret ? existing : await stripe.checkout.sessions.retrieve(existing.id)
    if (again.client_secret) return { sessionId: again.id, clientSecret: again.client_secret, email }
  }

  // The waiver is asked for on the checkout page and added when the person presses Pay
  const metadata = { garmentId, userId, withdrawalWaiver: 'pending' }
  // Fixed within the hour, because Stripe refuses a repeated key with different values
  const bucket = Math.floor(Date.now() / 1000 / HOUR) * HOUR
  const session = await stripe.checkout.sessions.create(
    {
      mode: 'payment',
      ui_mode: 'elements',
      payment_method_configuration: await paymentMethodSetup(),
      customer: customerId,
      line_items: [{ quantity: 1, price_data: { currency: 'eur', unit_amount: Math.round(price * 100), product_data: { name } } }],
      metadata,
      // Refunds and disputes only mention the payment, so it carries who and what as well
      payment_intent_data: { metadata: { garmentId, userId }, receipt_email: email, description: `Sigrid pattern: ${name}` },
      expires_at: bucket + 2 * HOUR,
      // Only used when the bank asks for a check on its own page; otherwise the checkout page carries on
      return_url: `${origin}/garment/${garmentId}?checkout_session={CHECKOUT_SESSION_ID}`,
    },
    { idempotencyKey: `checkout-cards-${userId}-${garmentId}-${bucket}` },
  )
  if (!session.client_secret) throw new Error('Stripe returned no client secret')
  return { sessionId: session.id, clientSecret: session.client_secret, email }
}

/**
 * The buyer ticked "start straight away" and pressed Pay. Only their own, still open checkout can be
 * marked, and the mark is what the webhook stores with the purchase.
 */
export async function acceptWaiver({ userId, sessionId }: { userId: string; sessionId: string }) {
  const stripe = getStripe()
  const session = await stripe.checkout.sessions.retrieve(sessionId)
  if (session.metadata?.userId !== userId || session.status !== 'open') return false
  await stripe.checkout.sessions.update(sessionId, { metadata: { ...session.metadata, withdrawalWaiver: 'accepted', withdrawalWaiverAt: new Date().toISOString() } })
  return true
}
