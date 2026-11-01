import { clerkMiddleware } from '@clerk/nextjs/server'

// Makes the login session available to the app. Browsing stays open to everyone: anything private
// checks the login itself on the server (see app/api/checkout and app/api/purchases).
export default clerkMiddleware()

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
