import type { ErrorEvent } from '@sentry/nextjs'

/**
 * Error tracking (Sentry), shared by the server, the edge and the browser. It's off until SENTRY_DSN or
 * NEXT_PUBLIC_SENTRY_DSN is set. Only what a bug needs goes to Sentry: the error, the page path and the
 * code that failed. Never who it was, what they typed or anything in a cookie, header or query string.
 * No session replay and no cookies, so it needs no consent. Listed as a sub-processor (lib/sub-processors.ts).
 */
export const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN

const pathOnly = (url?: string) => url?.split(/[?#]/)[0]

/** Strips anything personal an event could carry, as a last line before it leaves */
export function scrub(event: ErrorEvent): ErrorEvent {
  delete event.user
  if (event.request) {
    event.request = { method: event.request.method, url: pathOnly(event.request.url) }
  }
  for (const crumb of event.breadcrumbs ?? []) {
    if (crumb.data?.url) crumb.data.url = pathOnly(String(crumb.data.url))
    if (crumb.category === 'ui.input' || crumb.category === 'console') crumb.message = undefined
  }
  return event
}

export const sentryOptions = {
  dsn: sentryDsn,
  enabled: !!sentryDsn,
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  sendDefaultPii: false,
  // Errors only: no performance tracing, which would send every page view
  tracesSampleRate: 0,
  beforeSend: scrub,
}
