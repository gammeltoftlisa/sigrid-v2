import { auth } from '@clerk/nextjs/server'

import { getCatalogItem } from '@/lib/data'
import { paymentsEnabled } from '@/lib/payments'
import { createCheckout, listPurchases } from '@/lib/stripe'

/** Starts paying for one pattern. Only the garment id comes from the browser: the price is looked up here. */
export async function POST(request: Request) {
  if (!paymentsEnabled) return Response.json({ error: 'Payments are off' }, { status: 404 })
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Log in first' }, { status: 401 })

  const body: unknown = await request.json().catch(() => null)
  const garmentId = (body as { garmentId?: unknown } | null)?.garmentId
  const item = typeof garmentId === 'string' ? getCatalogItem(garmentId) : null
  if (typeof garmentId !== 'string' || !item) return Response.json({ error: 'Unknown pattern' }, { status: 404 })

  try {
    if ((await listPurchases(userId)).includes(garmentId)) return Response.json({ error: 'Already yours' }, { status: 409 })
    const url = await createCheckout({ userId, garmentId, name: item.name, price: item.price, origin: new URL(request.url).origin })
    return Response.json({ url })
  } catch (error) {
    console.error('Checkout failed', error)
    return Response.json({ error: 'Could not start checkout' }, { status: 502 })
  }
}
