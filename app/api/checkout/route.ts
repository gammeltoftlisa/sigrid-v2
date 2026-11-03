import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'

import { getCatalogItem, getGuideOutline } from '@/lib/data'
import { paymentsEnabled } from '@/lib/payments'
import { rateLimit } from '@/lib/rate-limit'
import { hasEntitlement } from '@/lib/server/entitlements'
import { errorMessage, logEvent } from '@/lib/server/log'
import { acceptWaiver, createCheckout } from '@/lib/stripe'

const bodySchema = z.object({ garmentId: z.string().min(1).max(100) })

const waiverSchema = z.object({
  sessionId: z.string().regex(/^cs_[a-zA-Z0-9_]{1,200}$/),
  /** The buyer asked to start straight away and knows they lose the right to cancel once they open it */
  acceptWithdrawalWaiver: z.literal(true),
})

/** Starts paying for one pattern. The price is looked up here; the browser only says which pattern. */
export async function POST(request: Request) {
  if (!paymentsEnabled) return Response.json({ error: 'Payments are off' }, { status: 404 })
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Log in first' }, { status: 401 })

  const limited = rateLimit(`checkout:${userId}`, 10, 60_000)
  if (!limited.ok) return Response.json({ error: 'Too many tries' }, { status: 429, headers: { 'Retry-After': String(limited.retryAfter) } })

  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return Response.json({ error: 'That request could not be read' }, { status: 400 })
  const { garmentId } = parsed.data
  const item = getCatalogItem(garmentId)
  if (!item) return Response.json({ error: 'Unknown pattern' }, { status: 404 })
  // Never charge for a pattern that can't be sewn yet
  if (!getGuideOutline(garmentId)?.steps.length) return Response.json({ error: 'This guide isn’t ready yet' }, { status: 409 })

  try {
    if (await hasEntitlement(userId, garmentId)) return Response.json({ error: 'Already yours' }, { status: 409 })
    const checkout = await createCheckout({ userId, garmentId, name: item.name, price: item.price, origin: new URL(request.url).origin })
    return Response.json(checkout, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    logEvent('error', 'checkout.start', { garmentId, error: errorMessage(error) })
    return Response.json({ error: 'Could not start checkout' }, { status: 502 })
  }
}

/** Pressing Pay: records that the buyer asked to start straight away, just before Stripe takes the payment */
export async function PATCH(request: Request) {
  if (!paymentsEnabled) return Response.json({ error: 'Payments are off' }, { status: 404 })
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Log in first' }, { status: 401 })

  const parsed = waiverSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return Response.json({ error: 'That request could not be read' }, { status: 400 })

  try {
    if (!(await acceptWaiver({ userId, sessionId: parsed.data.sessionId }))) return Response.json({ error: 'Unknown payment' }, { status: 404 })
    return Response.json({ ok: true })
  } catch (error) {
    logEvent('error', 'checkout.waiver', { error: errorMessage(error) })
    return Response.json({ error: 'Could not save that' }, { status: 502 })
  }
}
