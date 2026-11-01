import 'server-only'

import { clerkClient } from '@clerk/nextjs/server'
import Stripe from 'stripe'

// Made on first use, so a build without the key doesn't fail
let client: Stripe | null = null
const getStripe = () => (client ??= new Stripe(process.env.STRIPE_SECRET_KEY ?? ''))

/** The Stripe customer of a logged-in user, kept on their Clerk account where only the server can read it. */
async function storedCustomerId(userId: string) {
  const user = await (await clerkClient()).users.getUser(userId)
  const id = user.privateMetadata.stripeCustomerId
  return { user, customerId: typeof id === 'string' ? id : null }
}

async function customerFor(userId: string) {
  const { user, customerId } = await storedCustomerId(userId)
  if (customerId) return customerId
  const customer = await getStripe().customers.create(
    { email: user.primaryEmailAddress?.emailAddress, metadata: { clerkUserId: userId } },
    // Two tabs at once still make one customer
    { idempotencyKey: `customer-${userId}` },
  )
  await (await clerkClient()).users.updateUserMetadata(userId, { privateMetadata: { stripeCustomerId: customer.id } })
  return customer.id
}

/** Stripe's own payment page for one pattern. The card is typed there and never reaches Sigrid. */
export async function createCheckout({ userId, garmentId, name, price, origin }: { userId: string; garmentId: string; name: string; price: number; origin: string }) {
  const session = await getStripe().checkout.sessions.create({
    mode: 'payment',
    customer: await customerFor(userId),
    line_items: [{ quantity: 1, price_data: { currency: 'eur', unit_amount: Math.round(price * 100), product_data: { name } } }],
    metadata: { garmentId, userId },
    success_url: `${origin}/garment/${garmentId}?checkout=done`,
    cancel_url: `${origin}/garment/${garmentId}`,
  })
  return session.url
}

/**
 * The garments this user has paid for. Stripe is the record, so there's no database to fall out of step,
 * a purchase counts even if the tab was closed before coming back, and a full refund removes it.
 */
export async function listPurchases(userId: string): Promise<string[]> {
  const { customerId } = await storedCustomerId(userId)
  if (!customerId) return []
  const owned = new Set<string>()
  const sessions = getStripe().checkout.sessions.list({ customer: customerId, status: 'complete', limit: 100, expand: ['data.payment_intent.latest_charge'] })
  for await (const s of sessions) {
    const garmentId = s.metadata?.garmentId
    if (!garmentId || s.metadata?.userId !== userId || s.payment_status !== 'paid') continue
    const intent = s.payment_intent
    const charge = intent && typeof intent !== 'string' ? intent.latest_charge : null
    if (charge && typeof charge !== 'string' && charge.refunded) continue
    owned.add(garmentId)
  }
  return [...owned]
}
