import { auth } from '@clerk/nextjs/server'

import { consentRequestSchema } from '@/lib/consent'
import { currentConsents, recordConsents } from '@/lib/consent-db'
import { rateLimit } from '@/lib/rate-limit'

/** The logged-in person's current answers */
export async function GET() {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Log in first' }, { status: 401 })
  try {
    return Response.json(await currentConsents(userId), { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('Could not read consents', error)
    return Response.json({ error: 'Could not read' }, { status: 502 })
  }
}

/** Records answers. The version of the text is set here, from lib/consent.ts, never taken from the browser. */
export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Log in first' }, { status: 401 })
  const limit = rateLimit(`consent:${userId}`, 30, 60_000)
  if (!limit.ok) return Response.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } })
  const parsed = consentRequestSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return Response.json({ error: 'That isn’t valid' }, { status: 400 })
  try {
    await recordConsents(userId, parsed.data.entries)
    return Response.json(await currentConsents(userId))
  } catch (error) {
    console.error('Could not record consent', error)
    return Response.json({ error: 'Could not save' }, { status: 502 })
  }
}
