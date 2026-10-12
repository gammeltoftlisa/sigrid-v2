import type { FabricListing } from './types'

/** Hosts product photos may come from. next.config.ts allows exactly these in the image optimiser. */
export const IMAGE_HOSTS = ['cdn.shopify.com', 'i.ebayimg.com', 'i.etsystatic.com', 'images.unsplash.com']

function parse(raw: string | undefined): URL | null {
  if (!raw) return null
  try {
    return new URL(raw)
  } catch {
    return null
  }
}

/**
 * Listings come from other companies' APIs, so check them before they reach a link or an image:
 * the shop link must be https (never `javascript:` or `data:`), and a photo is kept only when it
 * is https on a known host. Anything else would be unsafe, or crash next/image.
 */
export function safeListing(listing: FabricListing): FabricListing | null {
  const url = parse(listing.url)
  if (url?.protocol !== 'https:') return null
  const image = parse(listing.image)
  const imageOk = image?.protocol === 'https:' && IMAGE_HOSTS.includes(image.hostname)
  return { ...listing, url: url.toString(), image: imageOk ? image.toString() : undefined }
}
