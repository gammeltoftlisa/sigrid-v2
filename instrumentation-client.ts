import * as Sentry from '@sentry/nextjs'

import { sentryOptions } from '@/lib/sentry-options'

// Errors in the browser, without session replay or anything typed (lib/sentry-options.ts)
Sentry.init(sentryOptions)

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
