import 'server-only'

import { getDb } from './db'
import { logEvent } from './log'

export type EntitlementStatus = 'active' | 'processing' | 'revoked'

export interface EntitlementChange {
  userId: string
  garmentId: string
  status: EntitlementStatus
  paymentIntentId: string | null
  checkoutSessionId?: string | null
  withdrawalWaiver?: boolean
  /** The Stripe event's time, in seconds. Only something newer can change the row. */
  at: number
}

/**
 * Records what happened to a purchase, in one atomic statement, safe to run twice and in any order:
 * - the primary key means one row per person and pattern, however many webhooks arrive
 * - an older event never overwrites a newer one; in the same second, a revocation wins
 * - revoking one payment never touches a newer purchase of the same pattern
 */
export async function recordEntitlement(change: EntitlementChange) {
  const { userId, garmentId, status, paymentIntentId, checkoutSessionId = null, withdrawalWaiver = false, at } = change
  const db = getDb()

  if (status === 'active' && paymentIntentId) {
    const [held] = await db(`SELECT payment_intent_id FROM entitlements WHERE user_id = $1 AND garment_id = $2 AND status = 'active'`, [userId, garmentId])
    if (held?.payment_intent_id && held.payment_intent_id !== paymentIntentId) {
      // Everything else tries to prevent this. If it still happens, someone needs to refund the second payment.
      logEvent('error', 'payment.duplicate', { garmentId, paymentIntentId, heldPaymentIntentId: held.payment_intent_id })
    }
  }

  await db(
    `INSERT INTO entitlements (user_id, garment_id, status, checkout_session_id, payment_intent_id, withdrawal_waiver, last_event_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (user_id, garment_id) DO UPDATE SET
       status = EXCLUDED.status,
       checkout_session_id = COALESCE(EXCLUDED.checkout_session_id, entitlements.checkout_session_id),
       payment_intent_id = COALESCE(EXCLUDED.payment_intent_id, entitlements.payment_intent_id),
       withdrawal_waiver = EXCLUDED.withdrawal_waiver OR entitlements.withdrawal_waiver,
       last_event_at = EXCLUDED.last_event_at,
       updated_at = now()
     WHERE (entitlements.last_event_at < EXCLUDED.last_event_at
            OR (entitlements.last_event_at = EXCLUDED.last_event_at AND (EXCLUDED.status = 'revoked' OR entitlements.status <> 'revoked')))
       AND (EXCLUDED.status <> 'revoked' OR entitlements.payment_intent_id IS NULL OR entitlements.payment_intent_id = EXCLUDED.payment_intent_id)`,
    [userId, garmentId, status, checkoutSessionId, paymentIntentId, withdrawalWaiver, at],
  )
}

export async function entitlementStatus(userId: string, garmentId: string): Promise<EntitlementStatus | null> {
  const [row] = await getDb()(`SELECT status FROM entitlements WHERE user_id = $1 AND garment_id = $2`, [userId, garmentId])
  return (row?.status as EntitlementStatus | undefined) ?? null
}

export const hasEntitlement = async (userId: string, garmentId: string) => (await entitlementStatus(userId, garmentId)) === 'active'

/** The patterns this person owns */
export async function listPurchases(userId: string): Promise<string[]> {
  const rows = await getDb()(`SELECT garment_id FROM entitlements WHERE user_id = $1 AND status = 'active'`, [userId])
  return rows.map((r) => String(r.garment_id))
}

export async function eventAlreadyHandled(eventId: string): Promise<boolean> {
  return (await getDb()(`SELECT 1 FROM stripe_events WHERE event_id = $1`, [eventId])).length > 0
}

/** Marked after the work, not before: if the work fails, Stripe's retry must be able to do it again */
export async function markEventHandled(eventId: string, type: string) {
  await getDb()(`INSERT INTO stripe_events (event_id, type) VALUES ($1, $2) ON CONFLICT (event_id) DO NOTHING`, [eventId, type])
}
