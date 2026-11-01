// Creates Sigrid's tables. Safe to run again: it only adds what's missing.
// Run with: node --env-file=.env.development.local scripts/db-setup.mjs
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

await sql`CREATE TABLE IF NOT EXISTS sewing_projects (
  user_id text NOT NULL,
  garment_id text NOT NULL,
  size text NOT NULL,
  completed_until integer NOT NULL CHECK (completed_until >= 0),
  updated_at timestamptz NOT NULL,
  PRIMARY KEY (user_id, garment_id)
)`
await sql`CREATE TABLE IF NOT EXISTS sewing_steps (
  user_id text NOT NULL,
  garment_id text NOT NULL,
  step integer NOT NULL CHECK (step >= 0),
  action text NOT NULL,
  done_at timestamptz NOT NULL,
  PRIMARY KEY (user_id, garment_id, step)
)`
await sql`CREATE TABLE IF NOT EXISTS sewing_profiles (
  user_id text PRIMARY KEY,
  size text,
  size_updated_at timestamptz,
  erased_at timestamptz
)`
console.log('Tables are ready')
