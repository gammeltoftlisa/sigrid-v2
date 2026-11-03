/**
 * Every company that processes personal data for Sigrid, shown in the privacy policy.
 * Add one here, with a signed data processing agreement, BEFORE it receives any data (see COMPLIANCE.md).
 */
export const subProcessors = [
  { name: 'Vercel Inc.', purpose: 'Hosting and technical logs; usage statistics, only with your consent', location: 'USA and EU' },
  { name: 'Clerk, Inc.', purpose: 'Accounts and login (with Cloudflare, Inc. checking for bots at login)', location: 'USA' },
  { name: 'Neon, Inc.', purpose: 'The database for your sewing, purchases and answers', location: 'EU (Frankfurt, Germany)' },
  { name: 'Stripe Payments Europe, Ltd.', purpose: 'Payments', location: 'EU (Ireland), with Stripe, Inc. in the USA' },
] as const
