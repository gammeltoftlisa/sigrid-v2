/**
 * The production database's Neon endpoint. Development, previews and tests must never connect to it:
 * an experiment on a laptop would happen in front of real users. Not a secret; the password is.
 */
export const PRODUCTION_DB_ENDPOINT = 'ep-blue-dream-ba3apjp5'

/** @param {string} url */
export const isProductionDatabase = (url) => url.includes(PRODUCTION_DB_ENDPOINT)

/**
 * Throws when anything but production itself is about to use the production database.
 * `ALLOW_PRODUCTION_DATABASE=1` is the deliberate way past it, for a one-off fix.
 * @param {string} url
 */
export function assertDatabaseAllowed(url) {
  if (!isProductionDatabase(url)) return
  if (process.env.VERCEL_ENV === 'production' || process.env.ALLOW_PRODUCTION_DATABASE === '1') return
  // On Vercel without its system variables exposed, VERCEL_ENV is missing: don't take production down over it
  if (process.env.VERCEL === '1' && !process.env.VERCEL_ENV) return
  throw new Error('This is the production database, and this is not production. Point DATABASE_URL at the dev branch (see OPERATIONS.md).')
}
