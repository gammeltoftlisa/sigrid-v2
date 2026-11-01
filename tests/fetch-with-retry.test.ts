import { afterEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import { backoffDelay, fetchJson, UpstreamError, withRetry } from '@/lib/server/fetch-with-retry'
import { createLimiter } from '@/lib/server/limit'

const schema = z.object({ ok: z.boolean() })
const noSleep = { sleep: async () => {} }
const json = (body: unknown, init?: ResponseInit) => new Response(JSON.stringify(body), init)

function stubFetch(...responses: (Response | Error)[]) {
  const mock = vi.fn(async () => {
    const next = responses.shift()!
    if (next instanceof Error) throw next
    return next
  })
  vi.stubGlobal('fetch', mock)
  return mock
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('fetchJson', () => {
  it('retries a server error, then succeeds', async () => {
    const f = stubFetch(new Response('', { status: 503 }), json({ ok: true }))
    await expect(fetchJson('https://x.test', {}, schema, { op: 't', ...noSleep })).resolves.toEqual({ ok: true })
    expect(f).toHaveBeenCalledTimes(2)
  })

  it('does not retry a client error', async () => {
    const f = stubFetch(new Response('', { status: 404 }))
    await expect(fetchJson('https://x.test', {}, schema, { op: 't', ...noSleep })).rejects.toMatchObject({ reason: 'http_404', status: 404 })
    expect(f).toHaveBeenCalledTimes(1)
  })

  it('does not repeat a POST by default', async () => {
    const f = stubFetch(new Response('', { status: 503 }))
    await expect(fetchJson('https://x.test', { method: 'POST' }, schema, { op: 't', ...noSleep })).rejects.toBeInstanceOf(UpstreamError)
    expect(f).toHaveBeenCalledTimes(1)
  })

  it('repeats a POST with an idempotency key, and sends the key', async () => {
    const f = stubFetch(new Response('', { status: 503 }), json({ ok: true }))
    await fetchJson('https://x.test', { method: 'POST' }, schema, { op: 't', idempotencyKey: 'k1', ...noSleep })
    expect(f).toHaveBeenCalledTimes(2)
    const init = (f.mock.calls[0] as unknown[])[1] as RequestInit
    expect(new Headers(init.headers).get('Idempotency-Key')).toBe('k1')
  })

  it('names a block page and a changed API, and repeats neither', async () => {
    const f = stubFetch(new Response('<html>blocked</html>'), json({ nope: 1 }))
    await expect(fetchJson('https://x.test', {}, schema, { op: 't', ...noSleep })).rejects.toMatchObject({ reason: 'bad_json' })
    await expect(fetchJson('https://x.test', {}, schema, { op: 't', ...noSleep })).rejects.toMatchObject({ reason: 'bad_shape' })
    expect(f).toHaveBeenCalledTimes(2)
  })

  it('waits as long as Retry-After asks', async () => {
    stubFetch(new Response('', { status: 429, headers: { 'Retry-After': '2' } }), json({ ok: true }))
    const sleep = vi.fn(async () => {})
    await fetchJson('https://x.test', {}, schema, { op: 't', sleep })
    expect(sleep).toHaveBeenCalledWith(2000)
  })

  it('gives up when Retry-After asks for too long', async () => {
    const f = stubFetch(new Response('', { status: 429, headers: { 'Retry-After': '60' } }))
    await expect(fetchJson('https://x.test', {}, schema, { op: 't', ...noSleep })).rejects.toMatchObject({ status: 429 })
    expect(f).toHaveBeenCalledTimes(1)
  })

  it('a network failure is a network failure, not a timeout', async () => {
    stubFetch(new TypeError('fetch failed'), new TypeError('fetch failed'))
    await expect(fetchJson('https://x.test', {}, schema, { op: 't', ...noSleep })).rejects.toMatchObject({ reason: 'network' })
  })
})

describe('withRetry', () => {
  it('stops an attempt at its timeout', async () => {
    const hang = (signal: AbortSignal) => new Promise<never>((_, reject) => signal.addEventListener('abort', () => reject(signal.reason)))
    await expect(withRetry(hang, { op: 't', timeoutMs: 10, retries: 0 })).rejects.toMatchObject({ reason: 'timeout' })
  })

  it('does not start after the deadline', async () => {
    const attempt = vi.fn(async () => 1)
    await expect(withRetry(attempt, { op: 't', deadlineAt: Date.now() - 1 })).rejects.toMatchObject({ reason: 'deadline' })
    expect(attempt).not.toHaveBeenCalled()
  })

  it('does not retry when the wait would pass the deadline', async () => {
    const attempt = vi.fn(async () => {
      throw new UpstreamError('t', 'http_503', { status: 503, retryAfterMs: 1000 })
    })
    await expect(withRetry(attempt, { op: 't', deadlineAt: Date.now() + 100, ...noSleep })).rejects.toMatchObject({ status: 503 })
    expect(attempt).toHaveBeenCalledTimes(1)
  })

  it('does not retry after the caller cancels', async () => {
    const attempt = vi.fn(async () => {
      throw Object.assign(new Error('x'), { name: 'AbortError' })
    })
    await expect(withRetry(attempt, { op: 't', ...noSleep })).rejects.toMatchObject({ reason: 'aborted' })
    expect(attempt).toHaveBeenCalledTimes(1)
  })
})

describe('backoffDelay', () => {
  it('grows with each attempt and has a ceiling', () => {
    expect(backoffDelay(0, () => 1)).toBe(300)
    expect(backoffDelay(1, () => 1)).toBe(600)
    expect(backoffDelay(9, () => 1)).toBe(2000)
    expect(backoffDelay(1, () => 0)).toBe(300)
  })
})

describe('createLimiter', () => {
  it('never runs more than the limit at once, and runs everything', async () => {
    const limit = createLimiter(2)
    let running = 0
    let peak = 0
    const results = await Promise.all(
      [1, 2, 3, 4, 5].map((n) =>
        limit(async () => {
          peak = Math.max(peak, ++running)
          await new Promise((r) => setTimeout(r, 5))
          running--
          return n
        }),
      ),
    )
    expect(results).toEqual([1, 2, 3, 4, 5])
    expect(peak).toBe(2)
  })

  it('a failed task frees its place', async () => {
    const limit = createLimiter(1)
    await expect(limit(async () => Promise.reject(new Error('x')))).rejects.toThrow()
    await expect(limit(async () => 'next')).resolves.toBe('next')
  })
})
