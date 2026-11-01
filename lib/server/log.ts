import { AsyncLocalStorage } from 'node:async_hooks'

/**
 * Structured server logs: one JSON line per event, saying where something failed (`op`, `source`)
 * and why (`reason`, `status`), so they can be filtered in Vercel's logs. Never pass personal data
 * or secrets as fields.
 */
export type LogLevel = 'info' | 'warn' | 'error'

const requestIds = new AsyncLocalStorage<string>()

/** Everything logged inside `fn` carries this request's id */
export const withRequestId = <T>(id: string, fn: () => T): T => requestIds.run(id, fn)

export function logEvent(level: LogLevel, op: string, fields: Record<string, unknown> = {}) {
  const line = JSON.stringify({ level, op, requestId: requestIds.getStore(), at: new Date().toISOString(), ...fields })
  if (level === 'error') console.error(line)
  else if (level === 'warn') console.warn(line)
  else console.log(line)
}

/** A short description of any thrown value, for the `error` field of a log line */
export function errorMessage(error: unknown): string {
  return (error instanceof Error ? error.message : String(error)).slice(0, 300)
}
