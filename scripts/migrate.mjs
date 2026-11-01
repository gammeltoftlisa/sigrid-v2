// Applies db/schema.sql: npm run db:migrate
// Every statement is IF NOT EXISTS, so running it again is safe.
import { readFileSync } from 'node:fs'

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)
const schema = readFileSync(new URL('../db/schema.sql', import.meta.url), 'utf8').replace(/^--.*$/gm, '')
for (const statement of schema.split(';').map((s) => s.trim()).filter(Boolean)) await sql.query(statement)
console.log('Database is up to date.')
