import { auth } from '@clerk/nextjs/server'

import { paymentsEnabled } from '@/lib/payments'
import { rateLimit } from '@/lib/rate-limit'
import { listPurchases } from '@/lib/server/entitlements'
import { errorMessage, logEvent } from '@/lib/server/log'

const NO_STORE = { 'Cache-Control': 'no-store' }

/** The patterns the logged-in user has paid for, and nobody else's: the user comes from the session. */
export async function GET() {
  if (!paymentsEnabled) return Response.json({ garmentIds: [] })
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Log in first' }, { status: 401, headers: NO_STORE })
  const limited = rateLimit(`purchases:${userId}`, 120, 60_000)
  if (!limited.ok) return Response.json({ error: 'Too many tries' }, { status: 429, headers: { ...NO_STORE, 'Retry-After': String(limited.retryAfter) } })
  try {
    return Response.json({ garmentIds: await listPurchases(userId) }, { headers: NO_STORE })
  } catch (error) {
    logEvent('error', 'purchases.read', { error: errorMessage(error) })
    return Response.json({ error: 'Could not read purchases' }, { status: 502, headers: NO_STORE })
  }
}
