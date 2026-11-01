import { auth } from '@clerk/nextjs/server'

import { paymentsEnabled } from '@/lib/payments'
import { listPurchases } from '@/lib/stripe'

/** The patterns the logged-in user has paid for, and nobody else's: the user comes from the session. */
export async function GET() {
  if (!paymentsEnabled) return Response.json({ garmentIds: [] })
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Log in first' }, { status: 401 })
  try {
    return Response.json({ garmentIds: await listPurchases(userId) })
  } catch (error) {
    console.error('Could not read purchases', error)
    return Response.json({ error: 'Could not read purchases' }, { status: 502 })
  }
}
