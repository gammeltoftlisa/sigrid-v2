/**
 * Product photography for each garment, from Unsplash (free to use under the Unsplash License,
 * commercial use allowed, no attribution required). Only free photos, never Unsplash+.
 * Swap these for Sigrid's own photography when it exists.
 *
 * The look: the garment is the subject. Plain light backdrops, cropped at the shoulders or
 * shown from behind, like a studio product shot rather than a portrait.
 *
 * `focus` crops the photo on Unsplash's side: x/y is the point to keep in the centre (0–1),
 * zoom > 1 crops in closer (used to leave faces out of frame).
 */
export interface GarmentPhoto {
  id: string
  alt: string
  focus?: { x: number; y: number; zoom: number }
}

const photos: Record<string, GarmentPhoto> = {
  'Classic T-Shirt': { id: 'photo-1789110520528-84b6a0b99400', alt: 'White cotton T-shirt with flutter sleeves, on a white background' },
  'A-Line Skirt': { id: 'photo-1789111161052-fa79455e89e9', alt: 'White denim skirt, on a white background', focus: { x: 0.5, y: 0.35, zoom: 1.3 } },
  'Straight Trousers': { id: 'photo-1789110520148-bb52ba37759b', alt: 'Brown linen trousers with a drawstring waist, on a white background' },
  'Oversized Hoodie': { id: 'photo-1620799140408-edc6dcb6d633', alt: 'White sweatshirt laid flat on a grey surface' },
  'Slip Dress': { id: 'photo-1789110853239-56a3f1f2142e', alt: 'Black midi slip dress with thin straps, seen from behind' },
  'Tailored Blazer': { id: 'photo-1776273920142-f30bceff0cf3', alt: 'Ivory tailored jacket and trousers against a grey backdrop', focus: { x: 0.52, y: 0.7, zoom: 2 } },
  'Linen Co-ord Set': { id: 'photo-1789110520302-3df8ce0410f0', alt: 'Short white linen dress with a braided rope belt' },
  'Studio Wrap Dress': { id: 'photo-1789110520279-49e8a3a6fb91', alt: 'Lavender knit midi dress, seen from behind' },
  'Utility Cargo Trousers': { id: 'photo-1789110520465-efc5ff05c95e', alt: 'Lavender cargo trousers with a drawstring waist' },
  'Peasant Blouse': { id: 'photo-1789110521041-25ba53c47af6', alt: 'White sleeveless knit top with small bobbles' },
  'Cocoon Coat': { id: 'photo-1583882358307-c46d9fdd6258', alt: 'Close view of a belted stone-coloured trench coat' },
  'Wide-Leg Culottes': { id: 'photo-1789110853466-4a541d4183a3', alt: 'Dark green culottes, seen from behind', focus: { x: 0.5, y: 0.6, zoom: 1.3 } },
}

export function garmentPhoto(name: string): GarmentPhoto | null {
  return photos[name] ?? null
}

/** Unsplash serves a resized 4:5 crop (AVIF/WebP where supported) from the same URL with these parameters */
export function photoSrc(photo: GarmentPhoto): string {
  const params = new URLSearchParams({ auto: 'format', fit: 'crop', w: '1200', h: '1500', q: '80' })
  if (photo.focus) {
    params.set('crop', 'focalpoint')
    params.set('fp-x', String(photo.focus.x))
    params.set('fp-y', String(photo.focus.y))
    params.set('fp-z', String(photo.focus.zoom))
  }
  return `https://images.unsplash.com/${photo.id}?${params}`
}
