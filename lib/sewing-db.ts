import { getSql } from './db'
import type { SewingState } from './sewing-types'

// One account can't fill the database, however it calls the API
const MAX_PROJECTS = 500
const MAX_STEPS = 10_000

export class TooMuchData extends Error {}

type Row = Record<string, unknown>
const iso = (value: unknown) => new Date(value as string).toISOString()

export async function readState(userId: string): Promise<SewingState> {
  const sql = getSql()
  const [projects, steps, profiles] = (await Promise.all([
    sql`SELECT garment_id, size, completed_until, updated_at FROM sewing_projects WHERE user_id = ${userId}`,
    sql`SELECT garment_id, step, action, done_at FROM sewing_steps WHERE user_id = ${userId} ORDER BY done_at DESC LIMIT 2000`,
    sql`SELECT size, size_updated_at FROM sewing_profiles WHERE user_id = ${userId}`,
  ])) as Row[][]
  const profile = profiles[0]
  return {
    projects: projects.map((p) => ({
      garmentId: p.garment_id as string,
      size: p.size as SewingState['projects'][number]['size'],
      completedUntil: p.completed_until as number,
      updatedAt: iso(p.updated_at),
    })),
    activity: steps.reverse().map((s) => ({
      garmentId: s.garment_id as string,
      step: s.step as number,
      action: s.action as string,
      at: iso(s.done_at),
    })),
    size: profile?.size
      ? { size: profile.size as NonNullable<SewingState['size']>['size'], updatedAt: iso(profile.size_updated_at) }
      : null,
  }
}

/**
 * Adds what this device has to the account and returns the combined result. The newest change to each
 * item wins, whichever device made it. Anything older than a data deletion is dropped, so another
 * device can't bring deleted data back.
 */
export async function mergeSewing(userId: string, incoming: SewingState): Promise<SewingState> {
  const sql = getSql()
  const now = Date.now()
  // A device whose clock runs fast mustn't win every later change
  const stamp = (at: string) => new Date(Math.min(new Date(at).getTime(), now)).toISOString()

  const [counts] = (await sql`SELECT
    (SELECT count(*) FROM sewing_projects WHERE user_id = ${userId})::int AS projects,
    (SELECT count(*) FROM sewing_steps WHERE user_id = ${userId})::int AS steps,
    (SELECT erased_at FROM sewing_profiles WHERE user_id = ${userId}) AS erased_at`) as Row[]
  if ((counts.projects as number) > MAX_PROJECTS || (counts.steps as number) > MAX_STEPS) throw new TooMuchData()

  // Never erased: keep everything, including data saved before accounts existed, which has no real date
  const erasedAt = counts.erased_at ? new Date(counts.erased_at as string).getTime() : null
  const afterErase = (at: string) => erasedAt === null || new Date(at).getTime() > erasedAt
  const projects = incoming.projects.filter((p) => afterErase(p.updatedAt))
  const steps = incoming.activity.filter((s) => afterErase(s.at))
  const size = incoming.size && afterErase(incoming.size.updatedAt) ? incoming.size : null

  if (projects.length > 0) {
    await sql`INSERT INTO sewing_projects (user_id, garment_id, size, completed_until, updated_at)
      SELECT ${userId}, * FROM unnest(
        ${projects.map((p) => p.garmentId)}::text[],
        ${projects.map((p) => p.size)}::text[],
        ${projects.map((p) => p.completedUntil)}::int[],
        ${projects.map((p) => stamp(p.updatedAt))}::timestamptz[]
      )
      ON CONFLICT (user_id, garment_id) DO UPDATE
      SET size = excluded.size, completed_until = excluded.completed_until, updated_at = excluded.updated_at
      WHERE excluded.updated_at > sewing_projects.updated_at`
  }
  if (steps.length > 0) {
    await sql`INSERT INTO sewing_steps (user_id, garment_id, step, action, done_at)
      SELECT ${userId}, * FROM unnest(
        ${steps.map((s) => s.garmentId)}::text[],
        ${steps.map((s) => s.step)}::int[],
        ${steps.map((s) => s.action)}::text[],
        ${steps.map((s) => stamp(s.at))}::timestamptz[]
      )
      ON CONFLICT (user_id, garment_id, step) DO UPDATE
      SET action = excluded.action, done_at = excluded.done_at
      WHERE excluded.done_at > sewing_steps.done_at`
  }
  if (size) {
    await sql`INSERT INTO sewing_profiles (user_id, size, size_updated_at)
      VALUES (${userId}, ${size.size}, ${stamp(size.updatedAt)})
      ON CONFLICT (user_id) DO UPDATE
      SET size = excluded.size, size_updated_at = excluded.size_updated_at
      WHERE sewing_profiles.size_updated_at IS NULL OR excluded.size_updated_at > sewing_profiles.size_updated_at`
  }
  // For automatic deletion: this account is in use (app/api/cron/retention)
  await sql`INSERT INTO sewing_profiles (user_id, last_seen_at) VALUES (${userId}, now())
    ON CONFLICT (user_id) DO UPDATE SET last_seen_at = now()`
  return readState(userId)
}

/** Deletes everything saved for this account, keeping only the moment it happened (see mergeSewing) */
export async function eraseSewing(userId: string) {
  const sql = getSql()
  await sql`DELETE FROM sewing_projects WHERE user_id = ${userId}`
  await sql`DELETE FROM sewing_steps WHERE user_id = ${userId}`
  await sql`INSERT INTO sewing_profiles (user_id, erased_at) VALUES (${userId}, now())
    ON CONFLICT (user_id) DO UPDATE SET size = NULL, size_updated_at = NULL, erased_at = now()`
}
