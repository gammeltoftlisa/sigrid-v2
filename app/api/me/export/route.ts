import { auth } from '@clerk/nextjs/server'

import { exportAccount } from '@/lib/account-data'
import { limitShared } from '@/lib/server/rate-limit'

/** Download my data: everything held about the logged-in person, as JSON */
export async function GET() {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Log in first' }, { status: 401 })
  const limit = await limitShared(`export:${userId}`, 5, 60_000)
  if (!limit.ok) return Response.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } })
  try {
    return Response.json(await exportAccount(userId), { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('Could not export account', error)
    return Response.json({ error: 'Could not export' }, { status: 502 })
  }
}
