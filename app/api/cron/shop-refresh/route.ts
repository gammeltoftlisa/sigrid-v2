import type { NextRequest } from 'next/server'

import { refreshCatalogue } from '@/lib/shop/refresh'

/** Vercel Cron, daily: reads what the shops sell. See vercel.json. Vercel sends CRON_SECRET as a bearer token. */
export const maxDuration = 300

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) return Response.json({ error: 'Not allowed' }, { status: 401 })
  return Response.json(await refreshCatalogue(), { headers: { 'Cache-Control': 'no-store' } })
}
