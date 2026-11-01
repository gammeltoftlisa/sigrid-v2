import 'server-only'

import { getDb } from '@/lib/server/db'

import type { ShopItem } from './types'

/** The catalogue, held in memory after the first read. Read again from the database hourly; the shops are read once a day. */
const KEEP_MS = 60 * 60 * 1000

interface Catalogue {
  items: ShopItem[]
  refreshedAt: string | null
  loadedAt: number
}

let current: Catalogue | null = null
let loading: Promise<Catalogue> | null = null

async function read(): Promise<Catalogue> {
  const rows = await getDb()('SELECT data, refreshed_at FROM shop_products', [], { timeoutMs: 25_000 })
  const newest = rows.reduce<string | null>((top, r) => {
    const at = new Date(r.refreshed_at as string).toISOString()
    return !top || at > top ? at : top
  }, null)
  return { items: rows.map((r) => r.data as ShopItem), refreshedAt: newest, loadedAt: Date.now() }
}

export async function getCatalogue(): Promise<Catalogue> {
  if (current && Date.now() - current.loadedAt < KEEP_MS) return current
  loading ??= read()
    .then((c) => (current = c))
    .finally(() => {
      loading = null
    })
  try {
    return await loading
  } catch (e) {
    // Yesterday's prices beat an empty shop for as long as the database is away
    if (current) return current
    throw e
  }
}

/** After a refresh, so the next request reads the new stock */
export const forgetCatalogue = () => {
  current = null
}
