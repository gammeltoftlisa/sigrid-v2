import { readdirSync, readFileSync } from 'node:fs'

import type { PGlite } from '@electric-sql/pglite'

/** Every migration in db/migrations, in order, as the deploy applies them */
export async function applyMigrations(pg: PGlite) {
  const dir = new URL('../db/migrations/', import.meta.url)
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()) await pg.exec(readFileSync(new URL(file, dir), 'utf8'))
}
