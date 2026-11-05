import 'server-only'

import { rateLimit } from '@/lib/rate-limit'

import { getDb } from './db'
import { errorMessage, logEvent } from './log'

/**
 * A request limit shared by every server instance, for endpoints that cost money or call other companies:
 * checkout, the shops, the AI writer, exporting and deleting an account. The in-memory limit answers first
 * (no database trip for an obvious flood); this one is the hard cap, since Vercel runs many instances.
 * Counted and checked in one statement, so two requests at the same moment can't both slip under it.
 * If the database can't be reached, the request is let through: a limit must never become an outage.
 */
export async function limitShared(key: string, limit: number, windowMs: number): Promise<{ ok: boolean; retryAfter: number }> {
  const local = rateLimit(key, limit, windowMs)
  if (!local.ok) return local
  try {
    const [row] = await getDb()(
      `INSERT INTO rate_limits (key, window_start, count) VALUES ($1, now(), 1)
       ON CONFLICT (key) DO UPDATE SET
         count = CASE WHEN rate_limits.window_start <= now() - make_interval(secs => $2) THEN 1 ELSE rate_limits.count + 1 END,
         window_start = CASE WHEN rate_limits.window_start <= now() - make_interval(secs => $2) THEN now() ELSE rate_limits.window_start END
       RETURNING count, extract(epoch FROM (window_start + make_interval(secs => $2) - now())) AS left`,
      [key, windowMs / 1000],
      { timeoutMs: 2000 },
    )
    const count = Number(row?.count ?? 0)
    return count <= limit ? { ok: true, retryAfter: 0 } : { ok: false, retryAfter: Math.max(1, Math.ceil(Number(row?.left ?? 1))) }
  } catch (error) {
    logEvent('warn', 'rate_limit.shared', { error: errorMessage(error) })
    return { ok: true, retryAfter: 0 }
  }
}

/** Old counters, for the daily cleanup */
export async function forgetOldLimits() {
  await getDb()(`DELETE FROM rate_limits WHERE window_start < now() - interval '1 day'`)
}
