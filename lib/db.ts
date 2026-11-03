import { neon } from '@neondatabase/serverless'

/** The database (Neon, Frankfurt). Connects on first use, so building the app doesn't need it. Server only. */
let client: ReturnType<typeof neon> | null = null
export function getSql() {
  client ??= neon(process.env.DATABASE_URL!)
  return client
}
