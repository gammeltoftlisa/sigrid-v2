import 'server-only'

import { consentVersions, type ConsentKind, type ConsentState, type consentSources } from './consent'
import { getSql } from './db'

type Row = Record<string, unknown>

/** Adds answers to the person's consent history. Rows are never changed, only added, so the history is proof. */
export async function recordConsents(
  userId: string,
  entries: { kind: ConsentKind; granted: boolean; source: (typeof consentSources)[number] }[],
) {
  const sql = getSql()
  await sql`INSERT INTO consents (user_id, kind, granted, version, source)
    SELECT ${userId}, * FROM unnest(
      ${entries.map((e) => e.kind)}::text[],
      ${entries.map((e) => e.granted)}::boolean[],
      ${entries.map((e) => consentVersions[e.kind])}::text[],
      ${entries.map((e) => e.source)}::text[]
    )`
}

/** Each kind's newest answer */
export async function currentConsents(userId: string): Promise<ConsentState> {
  const sql = getSql()
  const rows = (await sql`SELECT DISTINCT ON (kind) kind, granted, version, recorded_at
    FROM consents WHERE user_id = ${userId} ORDER BY kind, recorded_at DESC, id DESC`) as Row[]
  return Object.fromEntries(
    rows.map((r) => [r.kind, { granted: r.granted as boolean, version: r.version as string, at: new Date(r.recorded_at as string).toISOString() }]),
  )
}

/** Every answer ever given, oldest first, for the data download */
export async function consentHistory(userId: string) {
  const sql = getSql()
  const rows = (await sql`SELECT kind, granted, version, source, recorded_at FROM consents
    WHERE user_id = ${userId} ORDER BY recorded_at, id`) as Row[]
  return rows.map((r) => ({
    kind: r.kind as string,
    granted: r.granted as boolean,
    version: r.version as string,
    source: r.source as string,
    at: new Date(r.recorded_at as string).toISOString(),
  }))
}
