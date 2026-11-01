/**
 * The switch for charging for patterns. Off by default: Sigrid is free during the beta, and the Pricing
 * page promises to say so before that changes. Turn it on with NEXT_PUBLIC_PAYMENTS_ENABLED=true.
 */
export const paymentsEnabled = process.env.NEXT_PUBLIC_PAYMENTS_ENABLED === 'true'
