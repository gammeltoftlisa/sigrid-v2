import { findPublishedNeed } from '@/lib/published'
import type { StandardSize } from '@/lib/types'

export interface FabricChoice {
  id: string
  name: string
  /** Why this fabric suits the garment, one calm sentence */
  why: string
  ease: 'Easy' | 'Medium' | 'Harder'
  /** Search sent to the shops */
  query: string
  /** A listing must mention one of these to count as a match */
  match: string[]
  isEco?: boolean
}

export interface FabricNeed {
  garmentId: string
  /** Metres of 140–150 cm wide fabric, per size. Includes 10% for shrinkage and straightening. */
  meters: Partial<Record<StandardSize, number>>
  choices: FabricChoice[]
  /** Words for secondhand searches in Swedish marketplaces */
  secondhandQuery: string
}

const needs: FabricNeed[] = [
  {
    garmentId: 'classic-tshirt',
    meters: { XS: 1.4, S: 1.5, M: 1.6, L: 1.7, XL: 1.8, XXL: 2.0 },
    secondhandQuery: 'trikå tyg',
    choices: [
      { id: 'cotton-jersey', name: 'Cotton jersey', why: 'Soft and forgiving. The edges don’t fray, so small wobbles won’t show.', ease: 'Easy', query: 'cotton jersey', match: ['jersey'] },
      { id: 'organic-jersey', name: 'Organic cotton jersey', why: 'The same easy jersey, grown without synthetic pesticides.', ease: 'Easy', query: 'organic cotton jersey', match: ['jersey'], isEco: true },
      { id: 'viscose-jersey', name: 'Viscose jersey', why: 'Drapes and feels cool. A little slippery, so pin closely.', ease: 'Medium', query: 'viscose jersey', match: ['jersey'] },
    ],
  },
  {
    garmentId: 'aline-skirt',
    meters: { XS: 1.1, S: 1.2, M: 1.3, L: 1.4, XL: 1.5 },
    secondhandQuery: 'bomullstyg',
    choices: [
      { id: 'cotton-twill', name: 'Cotton twill', why: 'Holds its shape and stays put under the needle.', ease: 'Easy', query: 'cotton twill', match: ['twill'] },
      { id: 'linen', name: 'Linen', why: 'Breathes well and softens with every wash. Press often while sewing.', ease: 'Easy', query: 'linen', match: ['linen'], isEco: true },
      { id: 'chambray', name: 'Chambray or light denim', why: 'Sturdy and easy to press, with a quiet texture.', ease: 'Easy', query: 'chambray', match: ['chambray', 'denim'] },
    ],
  },
  {
    garmentId: 'straight-trousers',
    meters: { XS: 2.2, S: 2.3, M: 2.4, L: 2.5, XL: 2.6 },
    secondhandQuery: 'bomullstyg',
    choices: [
      { id: 'cotton-twill', name: 'Cotton twill', why: 'Stable and hard-wearing, a good first trouser fabric.', ease: 'Easy', query: 'cotton twill', match: ['twill'] },
      { id: 'linen', name: 'Linen', why: 'Light and cool for summer. Expect a relaxed, slightly creased look.', ease: 'Medium', query: 'linen', match: ['linen'], isEco: true },
      { id: 'denim', name: 'Denim', why: 'Very durable. Use a jeans needle and go slowly over thick seams.', ease: 'Medium', query: 'denim', match: ['denim'] },
    ],
  },
  {
    garmentId: 'oversized-hoodie',
    meters: { S: 2.0, M: 2.2, L: 2.3, XL: 2.5 },
    secondhandQuery: 'sweatshirt tyg',
    choices: [
      { id: 'french-terry', name: 'French terry', why: 'Soft loops on the back and smooth on the front. Easy to sew on a regular machine.', ease: 'Easy', query: 'french terry', match: ['terry', 'loopback', 'looped'] },
      { id: 'sweat', name: 'Brushed sweatshirt fleece', why: 'Warmer and fluffier inside. A little thicker to sew through.', ease: 'Medium', query: 'sweatshirt', match: ['sweat', 'fleece'] },
    ],
  },
  {
    garmentId: 'slip-dress',
    meters: { XS: 2.4, S: 2.5, M: 2.6, L: 2.8 },
    secondhandQuery: 'viskos tyg',
    choices: [
      { id: 'viscose', name: 'Viscose crepe or challis', why: 'Drapes beautifully on the bias. Cut on a single layer for accuracy.', ease: 'Medium', query: 'viscose', match: ['viscose', 'rayon'] },
      { id: 'cupro', name: 'Cupro or Tencel', why: 'Silky and breathable, made from wood or cotton waste.', ease: 'Harder', query: 'tencel', match: ['tencel', 'lyocell', 'cupro'], isEco: true },
      { id: 'satin', name: 'Satin', why: 'The classic slip look. Slippery, so use fine pins and go slowly.', ease: 'Harder', query: 'satin', match: ['satin', 'charmeuse'] },
    ],
  },
  {
    garmentId: 'tailored-blazer',
    meters: { XS: 2.2, S: 2.3, M: 2.4, L: 2.5, XL: 2.6 },
    secondhandQuery: 'ylletyg',
    choices: [
      { id: 'wool', name: 'Wool suiting', why: 'Shapes well under the iron, which helps with collars and lapels.', ease: 'Medium', query: 'wool', match: ['wool'] },
      { id: 'linen', name: 'Heavy linen', why: 'A relaxed summer blazer. Choose a medium to heavy weight.', ease: 'Medium', query: 'linen', match: ['linen'], isEco: true },
    ],
  },
]

export function getFabricNeed(garmentId: string): FabricNeed {
  return findPublishedNeed(garmentId) ?? needs.find((n) => n.garmentId === garmentId) ?? needs[0]
}

/** Metres needed for a size, falling back to the nearest listed size */
export function metersFor(need: FabricNeed, size: StandardSize): number {
  if (need.meters[size]) return need.meters[size]!
  const values = Object.values(need.meters)
  return Math.max(...values)
}
