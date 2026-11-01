import type { z } from 'zod'

import { errorMessage, logEvent } from './log'

/**
 * Timeout, retry and validation for calls to other companies' APIs.
 *
 * Only what is safe to repeat is repeated: GET and HEAD by default. Anything else runs once unless
 * it has an `idempotencyKey` or the caller states `safeToRetry`. SDKs with their own retries (Stripe,
 * the AI SDK) shouldn't be wrapped in this, or the retries multiply.
 */

export type FailureReason = 'timeout' | 'deadline' | 'network' | 'aborted' | 'bad_json' | 'bad_shape' | `http_${number}`

export class UpstreamError extends Error {
  readonly op: string
  readonly reason: FailureReason
  readonly status?: number
  /** How long the server asked us to wait, from Retry-After */
  readonly retryAfterMs?: number

  constructor(op: string, reason: FailureReason, options: { status?: number; retryAfterMs?: number; cause?: unknown } = {}) {
    super(`${op} failed: ${reason}`, { cause: options.cause })
    this.name = 'UpstreamError'
    this.op = op
    this.reason = reason
    this.status = options.status
    this.retryAfterMs = options.retryAfterMs
  }
}

export interface RetryOptions {
  /** Where this call belongs, for the logs: "fabric.shopify.search" */
  op: string
  /** Which shop or service, for the logs */
  source?: string
  /** Limit for one attempt, including reading the body */
  timeoutMs?: number
  /** Extra attempts after the first */
  retries?: number
  /** A moment in time (Date.now() scale) the whole operation must finish by, retries included */
  deadlineAt?: number
  /** Lets the caller cancel, for example when the visitor has left */
  signal?: AbortSignal
  /** Test seam */
  sleep?: (ms: number) => Promise<void>
}

const DEFAULT_TIMEOUT_MS = 6000
const BASE_DELAY_MS = 300
const MAX_DELAY_MS = 2000
/** Waiting longer than this for a Retry-After isn't worth it: fail and let the caller decide */
const MAX_RETRY_AFTER_MS = 5000

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

/** Exponential backoff with jitter, so visitors who fail together don't retry together */
export const backoffDelay = (attempt: number, random = Math.random) => {
  const ceiling = Math.min(MAX_DELAY_MS, BASE_DELAY_MS * 2 ** attempt)
  return Math.round(ceiling / 2 + random() * (ceiling / 2))
}

export const isRetryable = (error: UpstreamError) =>
  error.reason === 'timeout' ||
  error.reason === 'network' ||
  (error.status !== undefined && (error.status === 408 || error.status === 429 || error.status >= 500))

/** Turns whatever fetch threw into a reason. A timeout and a cancel are both aborts, told apart by name. */
function classify(op: string, error: unknown): UpstreamError {
  if (error instanceof UpstreamError) return error
  const name = (error as { name?: string } | null)?.name
  if (name === 'TimeoutError') return new UpstreamError(op, 'timeout', { cause: error })
  if (name === 'AbortError') return new UpstreamError(op, 'aborted', { cause: error })
  return new UpstreamError(op, 'network', { cause: error })
}

/** Runs `attempt` until it succeeds, fails for good, or runs out of tries or time. */
export async function withRetry<T>(attempt: (signal: AbortSignal) => Promise<T>, options: RetryOptions): Promise<T> {
  const { op, source, timeoutMs = DEFAULT_TIMEOUT_MS, retries = 1, deadlineAt, signal, sleep = wait } = options

  for (let tried = 0; ; tried++) {
    const remaining = deadlineAt === undefined ? Infinity : deadlineAt - Date.now()
    if (remaining <= 0) throw new UpstreamError(op, 'deadline')
    const timeout = AbortSignal.timeout(Math.min(timeoutMs, remaining))
    try {
      return await attempt(signal ? AbortSignal.any([signal, timeout]) : timeout)
    } catch (e) {
      const error = classify(op, e)
      if (tried >= retries || !isRetryable(error)) throw error
      if (error.retryAfterMs !== undefined && error.retryAfterMs > MAX_RETRY_AFTER_MS) throw error
      const delayMs = error.retryAfterMs ?? backoffDelay(tried)
      if (deadlineAt !== undefined && Date.now() + delayMs >= deadlineAt) throw error
      logEvent('warn', 'upstream.retry', { upstream: op, source, attempt: tried + 1, reason: error.reason, status: error.status, delayMs })
      await sleep(delayMs)
    }
  }
}

/** Seconds, or an HTTP date */
function parseRetryAfter(value: string | null): number | undefined {
  if (!value) return undefined
  const seconds = Number(value)
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000)
  const date = Date.parse(value)
  return Number.isNaN(date) ? undefined : Math.max(0, date - Date.now())
}

export interface FetchJsonOptions extends RetryOptions {
  /** Sent as the Idempotency-Key header, which makes a POST safe to repeat where the API supports it */
  idempotencyKey?: string
  /** The caller knows repeating this request does no harm, for example asking for a new token */
  safeToRetry?: boolean
}

/** Fetches JSON and checks it against `schema`: what comes back has the promised shape, or this throws. */
export function fetchJson<S extends z.ZodType>(url: string, init: RequestInit, schema: S, options: FetchJsonOptions): Promise<z.output<S>> {
  const { op, idempotencyKey, safeToRetry } = options
  const method = (init.method ?? 'GET').toUpperCase()
  const repeatable = method === 'GET' || method === 'HEAD' || safeToRetry === true || idempotencyKey !== undefined
  const headers = new Headers(init.headers)
  if (idempotencyKey) headers.set('Idempotency-Key', idempotencyKey)

  return withRetry(
    async (signal) => {
      const res = await fetch(url, { ...init, headers, signal })
      if (!res.ok) {
        throw new UpstreamError(op, `http_${res.status}`, { status: res.status, retryAfterMs: parseRetryAfter(res.headers.get('retry-after')) })
      }
      // Read inside the attempt: a body that stalls counts against this attempt's timeout
      const text = await res.text()
      let json: unknown
      try {
        json = JSON.parse(text)
      } catch (cause) {
        // A shop's block page or a maintenance page: repeating it won't help
        throw new UpstreamError(op, 'bad_json', { status: res.status, cause })
      }
      const parsed = schema.safeParse(json)
      if (!parsed.success) throw new UpstreamError(op, 'bad_shape', { status: res.status, cause: parsed.error })
      return parsed.data as z.output<S>
    },
    { ...options, retries: repeatable ? options.retries : 0 },
  )
}

/** The reason to log for any thrown value */
export const failureOf = (error: unknown): { reason: string; status?: number; retryAfterMs?: number; error?: string } =>
  error instanceof UpstreamError
    ? { reason: error.reason, status: error.status, retryAfterMs: error.retryAfterMs }
    : { reason: 'unexpected', error: errorMessage(error) }
