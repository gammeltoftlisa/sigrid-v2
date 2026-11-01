import 'server-only'

import { neon } from '@neondatabase/serverless'

/**
 * The database, as one function. Each call is one statement, and one statement is atomic, so the
 * writes in lib/server/entitlements.ts need no separate transaction. It connects on first use,
 * because `next build` runs this file without a DATABASE_URL.
 */
export type Query = (text: string, params?: unknown[], options?: { timeoutMs?: number }) => Promise<Record<string, unknown>[]>

const TIMEOUT_MS = 5000
let db: Query | null = null

export function getDb(): Query {
  if (db) return db
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set')
  const sql = neon(process.env.DATABASE_URL)
  db = (text, params = [], options) => sql.query(text, params, { fetchOptions: { signal: AbortSignal.timeout(options?.timeoutMs ?? TIMEOUT_MS) } }) as Promise<Record<string, unknown>[]>
  return db
}

/** Test seam: run against a local Postgres */
export function setDbForTests(query: Query | null) {
  db = query
}
