/**
 * Marks traffic Sigrid sends to a shop, so partner shops can attribute orders
 * (the concept's 10–15% shop commission). Shops with a signed affiliate deal can
 * swap this for their network's tracking link later.
 */
export function withReferral(url: string): string {
  const u = new URL(url)
  u.searchParams.set('utm_source', 'sigrid')
  u.searchParams.set('utm_medium', 'referral')
  u.searchParams.set('utm_campaign', 'fabric')
  return u.toString()
}
