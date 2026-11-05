import { auth } from '@clerk/nextjs/server'

import { deleteAccount } from '@/lib/account-data'
import { limitShared } from '@/lib/server/rate-limit'

/** Delete my account: the login and everything about it, except purchases, which bookkeeping law keeps 7 years */
export async function DELETE() {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Log in first' }, { status: 401 })
  const limit = await limitShared(`delete-account:${userId}`, 5, 60_000)
  if (!limit.ok) return Response.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } })
  try {
    await deleteAccount(userId)
    return Response.json({ ok: true })
  } catch (error) {
    console.error('Could not delete account', error)
    return Response.json({ error: 'Could not delete' }, { status: 502 })
  }
}
