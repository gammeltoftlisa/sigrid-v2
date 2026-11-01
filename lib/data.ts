import { guideOutlines } from './guide-outline.generated'
import { findPublishedGarment, findPublishedGuide } from './published'
import type {
  Garment,
  Creator,
  Pattern,
  GuideOutline,
  UserMeasurements,
  StandardSize,
} from './types'

export const garments: Garment[] = [
  {
    id: 'cap-sleeve-button-top',
    name: 'Cap-Sleeve Button Top',
    category: 'Tops',
    difficulty: 'Intermediate',
    estimatedTime: '5–6 hours',
    price: 12,
    isCreator: false,
    fits: ['Regular', 'Fitted'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    description: 'A neat top with short cap sleeves and a front that closes with four small buttons on thread loops. You’ll learn darts, a facing and how to set a sleeve.',
  },
  {
    id: 'lace-waist-skirt',
    name: 'Lace-Waist Skirt',
    category: 'Bottoms',
    difficulty: 'Intermediate',
    estimatedTime: '4–5 hours',
    price: 11,
    isCreator: false,
    fits: ['Relaxed', 'Regular'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    description: 'A floaty midi skirt that sits low on the hips, with a band of lace at the top. It teaches you to handle soft fabric, a side zip and a narrow hem.',
  },
  {
    id: 'two-tone-wide-jeans',
    name: 'Two-Tone Wide Jeans',
    category: 'Bottoms',
    difficulty: 'Advanced',
    estimatedTime: '10–12 hours',
    price: 15,
    isCreator: false,
    fits: ['Regular', 'Relaxed'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    description: 'Long, wide jeans with a dark centre panel on each leg and a lighter denim down the sides and around the waist. Slow to make, best after a few other trousers.',
  },
  {
    id: 'pleated-buckle-shorts',
    name: 'Pleated Buckle Shorts',
    category: 'Bottoms',
    difficulty: 'Intermediate',
    estimatedTime: '5–6 hours',
    price: 12,
    isCreator: false,
    fits: ['Relaxed'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    description: 'Knee-length shorts with deep front pleats and a wide, low waistband that fastens with a small side buckle. A good way to practise pleats and a fly.',
  },
  {
    id: 'fitted-stripe-shirt',
    name: 'Fitted Stripe Shirt',
    category: 'Tops',
    difficulty: 'Advanced',
    estimatedTime: '8–10 hours',
    price: 14,
    isCreator: false,
    fits: ['Fitted'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    description: 'A close-fitting striped shirt with a long pointed collar and deep cuffs, shaped through the waist. Matching the stripes takes patience, and it’s worth it.',
  },
]

export const creators: Creator[] = [
  {
    id: 'studio-by-mia',
    handle: '@studio.by.mia',
    name: 'Mia Johansson',
    bio: 'Minimal, wearable patterns for every body. Based in Stockholm.',
    followerCount: '24.3k',
    isCertified: true,
    patternCount: 18,
    avatarColor: '#C4A882',
  },
  {
    id: 'sewing-with-frida',
    handle: '@sewingwithfrida',
    name: 'Frida Larsen',
    bio: 'Sustainable fashion designer & educator. Making sewing joyful.',
    followerCount: '18.7k',
    isCertified: true,
    patternCount: 12,
    avatarColor: '#A8BFA8',
  },
  {
    id: 'fabric-diaries',
    handle: '@thefabricdiaries',
    name: 'The Fabric Diaries',
    bio: 'Slow fashion patterns inspired by vintage silhouettes.',
    followerCount: '31.2k',
    isCertified: false,
    patternCount: 24,
    avatarColor: '#BFA8C4',
  },
]

export const creatorPatterns: Pattern[] = [
  {
    id: 'mia-fold-waist-trousers',
    garmentId: 'mia-fold-waist-trousers',
    creatorId: 'studio-by-mia',
    name: 'Fold-Waist Linen Trousers',
    price: 10,
    difficulty: 'Beginner',
    fit: 'Relaxed',
    timesMade: 1247,
    category: 'Bottoms',
    estimatedTime: '3–4 hours',
    description: 'Wide, easy linen trousers with a low waistband that folds across the front, held by rows of stitching. No zip and no fly, so it’s a calm first pair.',
  },
  {
    id: 'mia-sequin-camisole',
    garmentId: 'mia-sequin-camisole',
    creatorId: 'studio-by-mia',
    name: 'Sequin Chiffon Camisole',
    price: 13,
    difficulty: 'Advanced',
    fit: 'Fitted',
    timesMade: 892,
    category: 'Tops',
    estimatedTime: '6–7 hours',
    description: 'A sheer crinkled camisole with thin straps, a wrapped neckline of sequins and a hem that falls to soft points. Delicate work, best taken slowly.',
  },
  {
    id: 'frida-smocked-blouse',
    garmentId: 'frida-smocked-blouse',
    creatorId: 'sewing-with-frida',
    name: 'Smocked Stripe Blouse',
    price: 12,
    difficulty: 'Intermediate',
    fit: 'Regular',
    timesMade: 634,
    category: 'Tops',
    estimatedTime: '6–7 hours',
    description: 'A cropped striped blouse with full sleeves, a chest pocket and elastic shirring at the waist and cuffs. You’ll learn to shirr, row by row, with elastic thread.',
  },
  {
    id: 'frida-fringe-top',
    garmentId: 'frida-fringe-top',
    creatorId: 'sewing-with-frida',
    name: 'Off-Shoulder Fringe Top',
    price: 11,
    difficulty: 'Intermediate',
    fit: 'Fitted',
    timesMade: 1831,
    category: 'Tops',
    estimatedTime: '4–5 hours',
    description: 'A close-fitting jersey top that sits off the shoulders, with long fringe across the neckline and around the hem. Few seams, and the fringe does the rest.',
  },
  {
    id: 'tfd-western-trousers',
    garmentId: 'tfd-western-trousers',
    creatorId: 'fabric-diaries',
    name: 'Western Yoke Trousers',
    price: 15,
    difficulty: 'Advanced',
    fit: 'Relaxed',
    timesMade: 412,
    category: 'Bottoms',
    estimatedTime: '8–10 hours',
    description: 'High-waisted, floor-length wide trousers with a pointed western yoke in a contrast fabric. Sewing those points cleanly is the heart of this one.',
  },
]

export const standardSizes: Record<StandardSize, UserMeasurements> = {
  XXS: { bust: 76,  waist: 58, hips: 83,  height: 162, inseam: 73 },
  XS:  { bust: 80,  waist: 62, hips: 87,  height: 164, inseam: 74 },
  S:   { bust: 84,  waist: 66, hips: 91,  height: 166, inseam: 76 },
  M:   { bust: 88,  waist: 70, hips: 95,  height: 168, inseam: 78 },
  L:   { bust: 92,  waist: 76, hips: 100, height: 170, inseam: 79 },
  XL:  { bust: 96,  waist: 82, hips: 105, height: 172, inseam: 80 },
  XXL: { bust: 102, waist: 88, hips: 112, height: 174, inseam: 81 },
}

/** A base garment, or a creator pattern shown as a garment of its own */
export const getGarmentById = (id: string): Garment => {
  const published = findPublishedGarment(id)
  if (published) return published
  const garment = garments.find((g) => g.id === id)
  if (garment) return garment
  const pattern = creatorPatterns.find((p) => p.garmentId === id)
  if (!pattern) return garments[0]
  const base = garments.find((g) => g.category === pattern.category) ?? garments[0]
  const creator = creators.find((c) => c.id === pattern.creatorId)
  return {
    ...base,
    id,
    name: pattern.name,
    difficulty: pattern.difficulty,
    price: pattern.price,
    fits: [pattern.fit],
    isCreator: true,
    creatorId: pattern.creatorId,
    estimatedTime: pattern.estimatedTime,
    description: `${pattern.description} A pattern by ${creator?.name ?? 'an independent maker'}.`,
  }
}

/**
 * What Sigrid sells, looked up by garment id. Unlike getGarmentById this has no fallback, and a pattern
 * from the studio (kept in one browser) isn't in it: checkout must only ever charge for a known item.
 */
export function getCatalogItem(id: string): { name: string; price: number } | null {
  return garments.find((g) => g.id === id) ?? creatorPatterns.find((p) => p.garmentId === id) ?? null
}

export const getCreatorById = (id: string) =>
  creators.find((c) => c.id === id) ?? creators[0]

export const getPatternsByCreator = (creatorId: string) =>
  creatorPatterns.filter((p) => p.creatorId === creatorId)

// ── 2D Garment Guides ────────────────────────────────────────────────────────

/**
 * What a page may show about a guide before it's bought: how many steps and pieces, and each
 * step's title and tool. The instructions and measurements stay on the server (lib/guides.ts).
 */
export function getGuideOutline(garmentId: string): GuideOutline | null {
  const published = findPublishedGuide(garmentId)
  if (published) return { steps: published.steps.map((s) => ({ title: s.title, tool: s.tool })), pieces: published.pieces.length }
  return guideOutlines[garmentId] ?? null
}
