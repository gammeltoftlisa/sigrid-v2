import { auth } from '@clerk/nextjs/server'

import { paymentsEnabled } from '@/lib/payments'
import { entitlementStatus } from '@/lib/server/entitlements'
import { errorMessage, logEvent } from '@/lib/server/log'
import { applyCheckoutSession } from '@/lib/server/stripe-events'
import { getStripe } from '@/lib/stripe'

const NO_STORE = { 'Cache-Control': 'no-store' }

/**
 * The buyer has come back from Stripe. A link can be typed by anyone, so this asks Stripe itself
 * whether this session belongs to this person and is paid, rather than trust that they came back.
 */
export async function GET(request: Request) {
  if (!paymentsEnabled) return Response.json({ error: 'Payments are off' }, { status: 404 })
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Log in first' }, { status: 401, headers: NO_STORE })

  const sessionId = new URL(request.url).searchParams.get('session_id') ?? ''
  if (!/^cs_[a-zA-Z0-9_]{1,200}$/.test(sessionId)) return Response.json({ error: 'Unknown payment' }, { status: 404, headers: NO_STORE })

  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId)
    const garmentId = session.metadata?.garmentId
    if (!garmentId || session.metadata?.userId !== userId) return Response.json({ error: 'Unknown payment' }, { status: 404, headers: NO_STORE })
    if (session.status === 'complete') await applyCheckoutSession(session, session.created)
    return Response.json({ garmentId, status: (await entitlementStatus(userId, garmentId)) ?? 'none' }, { headers: NO_STORE })
  } catch (error) {
    logEvent('error', 'checkout.confirm', { error: errorMessage(error) })
    return Response.json({ error: 'Could not check the payment' }, { status: 502, headers: NO_STORE })
  }
}
