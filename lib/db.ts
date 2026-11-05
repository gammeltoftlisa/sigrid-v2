import { neon } from '@neondatabase/serverless'

import { assertDatabaseAllowed } from './db-guard.mjs'

/** The database (Neon, Frankfurt). Connects on first use, so building the app doesn't need it. Server only. */
let client: ReturnType<typeof neon> | null = null
export function getSql() {
  if (!client) {
    assertDatabaseAllowed(process.env.DATABASE_URL ?? '')
    client = neon(process.env.DATABASE_URL!)
  }
  return client
}

/** Test seam: run against a local Postgres */
export function setSqlForTests(fake: ReturnType<typeof neon> | null) {
  client = fake
}
