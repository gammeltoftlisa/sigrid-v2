// Applies the database migrations in db/migrations, in order, each once.
//
//   npm run db:migrate                 the development database (.env.development.local)
//   node scripts/migrate.mjs --production   production, from the deploy workflow only
//
// Each migration is one file describing one change, kept with the code. Applied ones are recorded in
// schema_migrations; a file runs in one transaction, so it applies fully or not at all.
// Renaming or removing a column takes two deploys: add the new one first, remove the old one in a later
// deploy, because the previous version of the app keeps running for a minute while the new one starts.
import { readdirSync, readFileSync } from 'node:fs'

import { neon } from '@neondatabase/serverless'

import { isProductionDatabase } from '../lib/db-guard.mjs'

const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL
if (!url) {
  console.error('DATABASE_URL is not set.')
  process.exit(1)
}
const production = process.argv.includes('--production')
if (isProductionDatabase(url) !== production) {
  console.error(
    production
      ? 'Refusing: --production was given, but this is not the production database.'
      : 'Refusing: this is the production database. Production is migrated by the deploy workflow; point .env.development.local at the dev branch.',
  )
  process.exit(1)
}

const sql = neon(url)
const dir = new URL('../db/migrations/', import.meta.url)
await sql`CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())`
const applied = new Set((await sql`SELECT name FROM schema_migrations`).map((r) => r.name))

const files = readdirSync(dir).filter((f) => /^\d{4}_.+\.sql$/.test(f)).sort()
let ran = 0
for (const file of files) {
  if (applied.has(file)) continue
  const statements = readFileSync(new URL(file, dir), 'utf8')
    .replace(/^--.*$/gm, '')
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
  await sql.transaction([...statements.map((s) => sql.query(s)), sql`INSERT INTO schema_migrations (name) VALUES (${file})`])
  console.log(`Applied ${file}`)
  ran++
}
console.log(ran ? `Database is up to date (${ran} applied).` : 'Database is up to date.')
