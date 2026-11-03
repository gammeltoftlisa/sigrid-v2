import 'server-only'

import { clerkClient } from '@clerk/nextjs/server'

import { consentHistory } from './consent-db'
import { getSql } from './db'
import { readState } from './sewing-db'

type Row = Record<string, unknown>
const iso = (v: unknown) => (v ? new Date(v as string).toISOString() : null)

/**
 * Right of access and portability (GDPR art. 15 and 20): everything Sigrid holds about a person, as one
 * machine-readable file. The browser adds what's kept only on the device (app/(main)/profile/settings).
 */
export async function exportAccount(userId: string) {
  const sql = getSql()
  const user = await (await clerkClient()).users.getUser(userId)
  const [sewing, purchases, consents] = await Promise.all([
    readState(userId),
    sql`SELECT garment_id, status, withdrawal_waiver, updated_at FROM entitlements WHERE user_id = ${userId} ORDER BY updated_at` as Promise<Row[]>,
    consentHistory(userId),
  ])
  return {
    exportedAt: new Date().toISOString(),
    about: 'Everything Sigrid holds about you. Card details are kept by Stripe, never by Sigrid.',
    account: {
      id: user.id,
      emails: user.emailAddresses.map((e) => e.emailAddress),
      name: user.fullName,
      createdAt: iso(user.createdAt),
      lastSignInAt: iso(user.lastSignInAt),
      accountType: user.unsafeMetadata.accountType ?? null,
    },
    sewing,
    purchases: purchases.map((p) => ({
      pattern: p.garment_id as string,
      status: p.status as string,
      waivedWithdrawalRight: p.withdrawal_waiver as boolean,
      updatedAt: iso(p.updated_at),
    })),
    consents,
  }
}

/**
 * Right to erasure (GDPR art. 17): deletes the account and everything about it. Purchases are the one
 * exception: Swedish bookkeeping law keeps them 7 years, so they're marked and go then (retention below).
 * The login itself is deleted at Clerk last, so a failure on the way leaves an account that can try again.
 */
export async function deleteAccount(userId: string) {
  const sql = getSql()
  await sql`DELETE FROM sewing_projects WHERE user_id = ${userId}`
  await sql`DELETE FROM sewing_steps WHERE user_id = ${userId}`
  await sql`DELETE FROM sewing_profiles WHERE user_id = ${userId}`
  await sql`DELETE FROM consents WHERE user_id = ${userId}`
  await sql`UPDATE entitlements SET account_deleted_at = now() WHERE user_id = ${userId} AND account_deleted_at IS NULL`
  await (await clerkClient()).users.deleteUser(userId)
}

/** How long things are kept. Shown in the privacy policy, so change both together. */
export const retention = {
  inactiveSewing: '24 months',
  stripeEvents: '90 days',
  purchasesAfterAccountDeleted: '7 years',
} as const

/**
 * Storage limitation (GDPR art. 5.1 e), daily: deletes what's no longer needed.
 *   - sewing of accounts unused for 24 months (last sync, or the newest project or step when older)
 *   - the log of Stripe events after 90 days, once repeats can't arrive any more
 *   - purchases 7 years after their account was deleted
 */
export async function applyRetention() {
  const sql = getSql()
  const inactive = (await sql`WITH seen AS (
      SELECT user_id, max(at) AS at FROM (
        SELECT user_id, last_seen_at AS at FROM sewing_profiles
        UNION ALL SELECT user_id, updated_at FROM sewing_projects
        UNION ALL SELECT user_id, done_at FROM sewing_steps
      ) all_use GROUP BY user_id
    )
    SELECT user_id FROM seen WHERE at < now() - interval '24 months'`) as Row[]
  const ids = inactive.map((r) => r.user_id as string)
  if (ids.length > 0) {
    await sql`DELETE FROM sewing_projects WHERE user_id = ANY(${ids}::text[])`
    await sql`DELETE FROM sewing_steps WHERE user_id = ANY(${ids}::text[])`
    await sql`DELETE FROM sewing_profiles WHERE user_id = ANY(${ids}::text[])`
  }
  const events = (await sql`DELETE FROM stripe_events WHERE handled_at < now() - interval '90 days' RETURNING 1`) as Row[]
  const purchases = (await sql`DELETE FROM entitlements WHERE account_deleted_at < now() - interval '7 years' RETURNING 1`) as Row[]
  return { inactiveAccounts: ids.length, stripeEvents: events.length, purchases: purchases.length }
}
