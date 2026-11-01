import { auth } from '@clerk/nextjs/server'

import { rateLimit } from '@/lib/rate-limit'
import { eraseSewing, mergeSewing, TooMuchData } from '@/lib/sewing-db'
import { sewingStateSchema } from '@/lib/sewing-types'

const tooMany = (retryAfter: number) =>
  Response.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(retryAfter) } })

/** Saves this device's sewing to the logged-in account and returns the combined result */
export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Log in first' }, { status: 401 })
  const limit = rateLimit(`sewing:${userId}`, 60, 60_000)
  if (!limit.ok) return tooMany(limit.retryAfter)

  const body = await request.json().catch(() => null)
  const parsed = sewingStateSchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: 'That data isn’t valid' }, { status: 400 })

  try {
    return Response.json(await mergeSewing(userId, parsed.data))
  } catch (error) {
    if (error instanceof TooMuchData) return Response.json({ error: 'Too much saved data' }, { status: 413 })
    console.error('Could not save sewing', error)
    return Response.json({ error: 'Could not save' }, { status: 502 })
  }
}

/** Right to erasure: deletes everything saved for the logged-in account */
export async function DELETE() {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Log in first' }, { status: 401 })
  const limit = rateLimit(`sewing-erase:${userId}`, 10, 60_000)
  if (!limit.ok) return tooMany(limit.retryAfter)
  try {
    await eraseSewing(userId)
    return Response.json({ ok: true })
  } catch (error) {
    console.error('Could not delete sewing', error)
    return Response.json({ error: 'Could not delete' }, { status: 502 })
  }
}
