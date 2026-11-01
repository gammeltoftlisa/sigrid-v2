import type { Instrumentation } from 'next'

/** Every error the server catches ends up as one structured log line, findable by the digest the error page shows. */
export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return
  const { errorMessage, logEvent } = await import('@/lib/server/log')
  logEvent('error', 'request.failed', {
    // The path only: query strings can hold what someone typed
    path: request.path.split('?')[0],
    method: request.method,
    routePath: context.routePath,
    routeType: context.routeType,
    digest: typeof err === 'object' && err !== null && 'digest' in err ? String(err.digest) : undefined,
    error: errorMessage(err),
  })
}
