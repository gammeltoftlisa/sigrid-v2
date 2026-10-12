/**
 * A small fixed-window rate limiter, kept in this server instance's memory.
 * It stops one visitor from hammering an endpoint (each fabric search calls every shop).
 * On a host that runs several instances, each counts separately, so pair it with the
 * host's own firewall rule (e.g. a Vercel WAF rate limit) for a hard global cap.
 */
const windows = new Map<string, { start: number; count: number }>()
const MAX_KEYS = 10_000

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfter: number } {
  const now = Date.now()
  const w = windows.get(key)
  if (!w || now - w.start >= windowMs) {
    // Forget old visitors so the map can't grow without bound
    if (windows.size >= MAX_KEYS) {
      for (const [k, v] of windows) if (now - v.start >= windowMs) windows.delete(k)
      if (windows.size >= MAX_KEYS) windows.clear()
    }
    windows.set(key, { start: now, count: 1 })
    return { ok: true, retryAfter: 0 }
  }
  w.count++
  return w.count <= limit ? { ok: true, retryAfter: 0 } : { ok: false, retryAfter: Math.ceil((w.start + windowMs - now) / 1000) }
}

/** The visitor's IP as reported by the hosting proxy (Vercel sets x-forwarded-for itself). */
export function clientIp(headers: Headers): string {
  return headers.get('x-forwarded-for')?.split(',')[0]?.trim() || headers.get('x-real-ip') || 'unknown'
}
