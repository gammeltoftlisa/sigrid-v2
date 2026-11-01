import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Sigrid needs an account. Open to everyone: the address itself (it sends you on), logging in, the legal
// pages people must be able to read before they agree to them, and Stripe's webhook, which proves itself with a signature.
const isPublic = createRouteMatcher(['/', '/sign-in(.*)', '/sign-up(.*)', '/legal(.*)', '/api/webhooks(.*)'])
const isApi = createRouteMatcher(['/api(.*)', '/trpc(.*)'])

export default clerkMiddleware(
  async (auth, req) => {
    if (isPublic(req)) return
    if (isApi(req)) {
      const { userId } = await auth()
      if (!userId) return Response.json({ error: 'Log in first' }, { status: 401 })
      return
    }
    await auth.protect()
  },
  { signInUrl: '/sign-in', signUpUrl: '/sign-up' },
)

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
