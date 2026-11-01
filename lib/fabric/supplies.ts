import { findPublishedSupplies } from '@/lib/published'

/**
 * What you'll need besides the fabric, for each pattern. Only what the pattern's guide or description
 * says, never a guess: a pattern with no guide yet lists what's known and says more is coming.
 */
export interface Supply {
  id: string
  name: string
  /** What it's for, or how much */
  detail?: string
  /** What to look for in the shop. Without it, the shops don't carry it */
  search?: string
}

/** Everything you need for any pattern */
export const basics: Supply[] = [
  { id: 'thread', name: 'Thread', detail: 'To match your fabric', search: 'thread' },
  { id: 'pins', name: 'Pins', search: 'pins' },
  { id: 'scissors', name: 'Fabric scissors', search: 'scissors' },
  { id: 'chalk', name: 'Tailor’s chalk', search: 'chalk' },
  { id: 'tape-measure', name: 'Tape measure', search: 'tape measure' },
  { id: 'seam-ripper', name: 'Seam ripper', detail: 'For when a seam wanders', search: 'seam ripper' },
  { id: 'iron', name: 'Iron', detail: 'You’ll press after most seams' },
]

const forPattern: Record<string, { supplies: Supply[]; /** It has a guide, so the list is complete */ complete?: boolean }> = {
  'cap-sleeve-button-top': {
    complete: true,
    supplies: [
      { id: 'buttons', name: '4 small shank buttons', detail: 'For the front', search: 'shank buttons' },
      { id: 'cord', name: 'Narrow cord', detail: 'For the 4 button loops, or make them from a thin tube of fabric', search: 'cord' },
      { id: 'interfacing', name: 'Lightweight fusible interfacing', detail: 'For the two facings', search: 'fusible interfacing' },
    ],
  },
  'lace-waist-skirt': {
    complete: true,
    supplies: [
      { id: 'lace', name: 'Lace', detail: 'The same size as the hip band', search: 'lace' },
      { id: 'zip', name: '20 cm invisible zip', search: 'invisible zip' },
      { id: 'zip-foot', name: 'Zip foot', detail: 'To sew close to the zip’s teeth. Check it fits your machine' },
      { id: 'fine-needle', name: 'Fine machine needle', detail: 'For soft fabric', search: 'microtex needle' },
      { id: 'cloth', name: 'Pressing cloth', detail: 'A clean cotton cloth protects the lace' },
    ],
  },
  'two-tone-wide-jeans': { supplies: [{ id: 'jeans-needle', name: 'Jeans needles', detail: 'For the thick seams', search: 'jeans needle' }] },
  'pleated-buckle-shorts': {
    supplies: [
      { id: 'buckle', name: 'Small buckle', detail: 'For the side of the waistband', search: 'buckle' },
      { id: 'zip', name: 'Zip', detail: 'For the fly', search: 'zip' },
    ],
  },
  'fitted-stripe-shirt': { supplies: [{ id: 'buttons', name: 'Shirt buttons', search: 'shirt buttons' }] },
  'mia-fold-waist-trousers': { supplies: [] },
  'mia-sequin-camisole': {
    supplies: [
      { id: 'sequins', name: 'Sequin trim', detail: 'For the neckline' },
      { id: 'fine-needle', name: 'Fine machine needle', detail: 'For chiffon', search: 'microtex needle' },
    ],
  },
  'frida-smocked-blouse': { supplies: [{ id: 'shirring', name: 'Shirring elastic', detail: 'For the waist and cuffs', search: 'shirring elastic' }] },
  'frida-fringe-top': {
    supplies: [
      { id: 'fringe', name: 'Fringe trim', detail: 'For the neckline and hem' },
      { id: 'stretch-needle', name: 'Stretch machine needle', detail: 'For jersey', search: 'stretch needle' },
    ],
  },
  'tfd-western-trousers': { supplies: [] },
}

export interface PatternSupplies {
  /** What this pattern needs specially */
  special: Supply[]
  basics: Supply[]
  /** False until the pattern has a guide: there may be more */
  complete: boolean
}

export function suppliesFor(garmentId: string): PatternSupplies {
  const published = findPublishedSupplies(garmentId)
  if (published) return { special: published, basics, complete: true }
  const listed = forPattern[garmentId]
  return { special: listed?.supplies ?? [], basics, complete: !!listed?.complete }
}

export const findSupply = (garmentId: string, id: string | null | undefined) => {
  const { special, basics: common } = suppliesFor(garmentId)
  return [...special, ...common].find((s) => s.id === id) ?? null
}

/** The shop's page for a supply, for this pattern */
export const supplyHref = (garmentId: string, supply: Supply) => `/fabric?garment=${garmentId}&supply=${supply.id}`
