import type { PGlite, Transaction } from '@electric-sql/pglite'
import type { neon } from '@neondatabase/serverless'

type Runner = Pick<PGlite | Transaction, 'query'>
interface Pending extends PromiseLike<Record<string, unknown>[]> {
  run: (on: Runner) => Promise<Record<string, unknown>[]>
}

/** Neon's `sql` tag and `sql.transaction`, answered by an in-memory Postgres, for tests */
export function pgliteSql(pg: PGlite): ReturnType<typeof neon> {
  const tag = (strings: TemplateStringsArray, ...values: unknown[]): Pending => {
    const text = strings.reduce((out, s, i) => `${out}$${i}${s}`)
    const run = async (on: Runner) => (await on.query<Record<string, unknown>>(text, values)).rows
    return { run, then: (ok, fail) => run(pg).then(ok, fail) }
  }
  const sql = Object.assign(tag, {
    query: async (text: string, values: unknown[] = []) => (await pg.query<Record<string, unknown>>(text, values)).rows,
    transaction: (queries: Pending[]) => pg.transaction(async (tx) => {
      const out = []
      for (const q of queries) out.push(await q.run(tx))
      return out
    }),
  })
  return sql as unknown as ReturnType<typeof neon>
}
