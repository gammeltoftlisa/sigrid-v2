import type { FabricNeed } from '@/lib/fabric/needs'
import { loadPatterns, sectionsOf, toGuide, type StudioPattern } from '@/lib/studio/patterns'
import { sectionIconKey } from '@/components/studio/section-icons'
import type { Garment, GarmentGuide } from '@/lib/types'

/**
 * Patterns published from the pattern studio: a published pattern becomes a
 * garment like the built-in ones, with its own product page, guide, fabric and photo. They live
 * in this browser (no accounts yet), so these lookups only find them in the browser; the pages
 * that show them wait until they've mounted.
 */
export const PUBLISHED_PREFIX = 'my-'
export const isPublishedId = (id: string) => id.startsWith(PUBLISHED_PREFIX)

function ready(): StudioPattern[] {
  if (typeof window === 'undefined') return []
  return loadPatterns().filter((p) => !!p.publishedAt)
}

const find = (garmentId: string) => (isPublishedId(garmentId) ? ready().find((p) => PUBLISHED_PREFIX + p.id === garmentId) : undefined)

function asGarment(p: StudioPattern): Garment {
  return {
    id: PUBLISHED_PREFIX + p.id,
    name: p.name,
    category: p.category,
    difficulty: p.difficulty,
    estimatedTime: p.estimatedTime,
    price: p.price ?? 0,
    isCreator: false,
    sizes: p.sizes,
    description: p.description,
    photo: p.photo,
    published: true,
  }
}

/** Every published pattern, as garments */
export const listPublishedGarments = (): Garment[] => ready().map(asGarment)

export function findPublishedGarment(garmentId: string): Garment | null {
  const p = find(garmentId)
  return p ? asGarment(p) : null
}

export function findPublishedGuide(garmentId: string): GarmentGuide | null {
  const p = find(garmentId)
  if (!p) return null
  const sectionIcons = Object.fromEntries(sectionsOf(p.steps).map((sec) => [sec.group, sectionIconKey(sec, p.steps, p.sectionIcons)]))
  return { ...toGuide(p), garmentId, keepSections: true, sectionIcons }
}

/** The pattern's fabric as a fabric need, so the product page and the fabric shop can use it */
export function findPublishedNeed(garmentId: string): FabricNeed | null {
  const p = find(garmentId)
  if (!p) return null
  const name = p.fabric.name.trim() || 'Fabric'
  return {
    garmentId,
    meters: Object.fromEntries(Object.entries(p.fabric.metersBySize).filter(([, m]) => !!m)) as FabricNeed['meters'],
    secondhandQuery: 'tyg',
    choices: [{ id: 'main', name, why: p.fabric.why, ease: 'Easy', query: name.toLowerCase(), match: name.toLowerCase().split(/\s+/).filter((w) => w.length > 3).slice(-1) }],
  }
}
