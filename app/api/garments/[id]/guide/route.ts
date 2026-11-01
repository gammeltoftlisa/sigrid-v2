import { auth } from '@clerk/nextjs/server'

import { getCatalogItem } from '@/lib/data'
import { packGuide } from '@/lib/guide-wire'
import { findGuide } from '@/lib/guides'
import { paymentsEnabled } from '@/lib/payments'
import { clientIp, rateLimit } from '@/lib/rate-limit'
import { hasEntitlement } from '@/lib/server/entitlements'
import { errorMessage, logEvent } from '@/lib/server/log'

const NO_STORE = { 'Cache-Control': 'no-store' }

/** A guide's instructions and measurements. While payments are on, only for whoever has bought it. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const limited = rateLimit(`guide:${clientIp(request.headers)}`, 120, 60_000)
  if (!limited.ok) return Response.json({ error: 'Too many tries' }, { status: 429, headers: { ...NO_STORE, 'Retry-After': String(limited.retryAfter) } })

  const { id } = await params
  const guide = findGuide(id)
  if (!guide) return Response.json({ error: 'No guide yet' }, { status: 404, headers: NO_STORE })

  if (paymentsEnabled && getCatalogItem(id)) {
    const { userId } = await auth()
    if (!userId) return Response.json({ error: 'Log in first' }, { status: 401, headers: NO_STORE })
    try {
      if (!(await hasEntitlement(userId, id))) return Response.json({ error: 'Not bought' }, { status: 403, headers: NO_STORE })
    } catch (error) {
      // Can't tell who owns what, so nothing paid goes out. Saying so lets the page offer another try.
      logEvent('error', 'guide.check', { garmentId: id, error: errorMessage(error) })
      return Response.json({ error: 'Could not check your purchase' }, { status: 503, headers: NO_STORE })
    }
  }
  return Response.json(packGuide(guide), { headers: NO_STORE })
}
