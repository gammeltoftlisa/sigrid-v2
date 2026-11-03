import type { NextRequest } from 'next/server'

import { applyRetention } from '@/lib/account-data'

/** Vercel Cron, daily: deletes data that's past its keeping time (lib/account-data.ts). Vercel sends CRON_SECRET. */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) return Response.json({ error: 'Not allowed' }, { status: 401 })
  try {
    const deleted = await applyRetention()
    console.info('Retention', deleted)
    return Response.json(deleted, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('Retention failed', error)
    return Response.json({ error: 'Retention failed' }, { status: 500 })
  }
}
