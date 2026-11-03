/** The handle in a shop's product link: ".../products/<handle>?utm..." → "<handle>" */
export function handleOf(url: string): string | null {
  try {
    const m = new URL(url).pathname.match(/\/products\/([^/]+)\/?$/)
    return m ? decodeURIComponent(m[1]) : null
  } catch {
    return null
  }
}

/** A product's own page in Sigrid, for products from the shops we read; null for anything else */
export function productHref(item: { sourceId: string; url: string }, variantId?: number): string | null {
  const handle = handleOf(item.url)
  if (!handle) return null
  return `/fabric/${encodeURIComponent(item.sourceId)}/${encodeURIComponent(handle)}${variantId ? `?variant=${variantId}` : ''}`
}
