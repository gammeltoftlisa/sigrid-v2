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
    garmentId: 'cap-sleeve-button-top',
    meters: { XS: 1.3, S: 1.4, M: 1.5, L: 1.6, XL: 1.7 },
    secondhandQuery: 'kostymtyg',
    choices: [
      { id: 'tropical-wool', name: "Lightweight wool suiting", why: "Holds the neat shape of the front and presses very well.", ease: 'Medium', query: 'wool', match: ['wool'] },
      { id: 'cotton-twill', name: "Fine cotton twill", why: "Stable and easy to sew, a good choice if this is your first set-in sleeve.", ease: 'Easy', query: 'cotton twill', match: ['twill'] },
      { id: 'tencel-twill', name: "Tencel twill", why: "Soft with a little drape, and made from wood pulp.", ease: 'Medium', query: 'tencel', match: ['tencel','lyocell'], isEco: true },
    ],
  },
  {
    garmentId: 'lace-waist-skirt',
    meters: { XS: 2.0, S: 2.1, M: 2.2, L: 2.4, XL: 2.5 },
    secondhandQuery: 'viskos tyg',
    choices: [
      { id: 'viscose', name: "Viscose crepe or challis", why: "Falls in soft folds and moves as you walk. Weigh it down when you cut.", ease: 'Medium', query: 'viscose', match: ['viscose','rayon'] },
      { id: 'cotton-voile', name: "Cotton voile", why: "Light and floaty, but much calmer under the needle than viscose.", ease: 'Easy', query: 'cotton voile', match: ['voile','lawn'] },
      { id: 'silk-crepe', name: "Silk crepe de chine", why: "The most fluid choice. Slippery, so use fine pins and go slowly.", ease: 'Harder', query: 'silk', match: ['silk'] },
    ],
  },
  {
    garmentId: 'two-tone-wide-jeans',
    meters: { XS: 2.6, S: 2.7, M: 2.8, L: 3.0, XL: 3.1 },
    secondhandQuery: 'jeanstyg',
    choices: [
      { id: 'denim', name: "Rigid denim in two shades", why: "You need both a dark and a lighter shade. Use a jeans needle over thick seams.", ease: 'Medium', query: 'denim', match: ['denim'] },
      { id: 'cotton-twill', name: "Heavy cotton twill", why: "A little easier to sew than denim, with the same straight fall.", ease: 'Easy', query: 'cotton twill', match: ['twill'] },
      { id: 'organic-denim', name: "Organic cotton denim", why: "The same sturdy denim, grown without synthetic pesticides.", ease: 'Medium', query: 'organic denim', match: ['denim'], isEco: true },
    ],
  },
  {
    garmentId: 'pleated-buckle-shorts',
    meters: { XS: 1.4, S: 1.5, M: 1.6, L: 1.7, XL: 1.8 },
    secondhandQuery: 'linnetyg',
    choices: [
      { id: 'linen', name: "Medium-weight linen", why: "Takes a sharp pleat and stays cool. Press often while you sew.", ease: 'Easy', query: 'linen', match: ['linen'], isEco: true },
      { id: 'cotton-twill', name: "Cotton twill", why: "Holds its pleats and doesn’t move around under the needle.", ease: 'Easy', query: 'cotton twill', match: ['twill'] },
      { id: 'wool', name: "Lightweight wool suiting", why: "Gives the pleats a soft, tailored fall.", ease: 'Medium', query: 'wool', match: ['wool'] },
    ],
  },
  {
    garmentId: 'fitted-stripe-shirt',
    meters: { XS: 1.9, S: 2.0, M: 2.1, L: 2.2, XL: 2.4 },
    secondhandQuery: 'skjorttyg',
    choices: [
      { id: 'cotton-shirting', name: "Striped cotton shirting", why: "Crisp and easy to press. Allow a little extra to match the stripes.", ease: 'Medium', query: 'cotton shirting', match: ['shirting','poplin'] },
      { id: 'poplin', name: "Cotton poplin", why: "Smooth and stable, and it holds a sharp collar point well.", ease: 'Easy', query: 'poplin', match: ['poplin'] },
      { id: 'organic-poplin', name: "Organic cotton poplin", why: "The same crisp poplin, grown without synthetic pesticides.", ease: 'Easy', query: 'organic poplin', match: ['poplin'], isEco: true },
    ],
  },
  {
    garmentId: 'mia-fold-waist-trousers',
    meters: { XS: 2.3, S: 2.4, M: 2.5, L: 2.6, XL: 2.7 },
    secondhandQuery: 'linnetyg',
    choices: [
      { id: 'linen', name: "Washed linen", why: "Soft, cool and forgiving. A few creases only suit this shape.", ease: 'Easy', query: 'linen', match: ['linen'], isEco: true },
      { id: 'hemp', name: "Hemp or linen blend", why: "A little sturdier than linen, and it softens with every wash.", ease: 'Easy', query: 'hemp', match: ['hemp'] },
      { id: 'chambray', name: "Chambray", why: "Light and easy to press, with a quiet texture.", ease: 'Easy', query: 'chambray', match: ['chambray'] },
    ],
  },
  {
    garmentId: 'mia-sequin-camisole',
    meters: { XS: 1.3, S: 1.4, M: 1.4, L: 1.5, XL: 1.6 },
    secondhandQuery: 'chiffong tyg',
    choices: [
      { id: 'crinkle-chiffon', name: "Crinkle chiffon", why: "Sheer and light. The crinkle hides small wobbles better than a smooth chiffon.", ease: 'Harder', query: 'chiffon', match: ['chiffon'] },
      { id: 'georgette', name: "Viscose georgette", why: "A little more weight than chiffon, so it’s easier to keep in place.", ease: 'Harder', query: 'georgette', match: ['georgette'] },
      { id: 'cotton-voile', name: "Cotton voile", why: "The calmest option, with less drape. Good for a first try.", ease: 'Medium', query: 'cotton voile', match: ['voile'] },
    ],
  },
  {
    garmentId: 'frida-smocked-blouse',
    meters: { XS: 2.0, S: 2.1, M: 2.2, L: 2.3, XL: 2.5 },
    secondhandQuery: 'bomullstyg',
    choices: [
      { id: 'seersucker', name: "Striped seersucker", why: "Light and textured, and it gathers softly when shirred.", ease: 'Easy', query: 'seersucker', match: ['seersucker'] },
      { id: 'cotton-shirting', name: "Striped cotton shirting", why: "Crisp stripes that stay straight above and below the shirring.", ease: 'Medium', query: 'cotton shirting', match: ['shirting'] },
      { id: 'cotton-lawn', name: "Cotton lawn", why: "Very light, so the elastic thread pulls it in easily.", ease: 'Easy', query: 'cotton lawn', match: ['lawn'], isEco: true },
    ],
  },
  {
    garmentId: 'frida-fringe-top',
    meters: { XS: 0.9, S: 1.0, M: 1.0, L: 1.1, XL: 1.2 },
    secondhandQuery: 'trikå tyg',
    choices: [
      { id: 'viscose-jersey', name: "Viscose jersey", why: "Smooth with a good stretch, so it stays up on the shoulders. Pin closely.", ease: 'Medium', query: 'viscose jersey', match: ['jersey'] },
      { id: 'cotton-rib', name: "Cotton rib jersey", why: "Stretchy and stable, and the edges don’t fray.", ease: 'Easy', query: 'rib jersey', match: ['rib','jersey'] },
      { id: 'organic-jersey', name: "Organic cotton jersey", why: "Easy to sew, and grown without synthetic pesticides.", ease: 'Easy', query: 'organic cotton jersey', match: ['jersey'], isEco: true },
    ],
  },
  {
    garmentId: 'tfd-western-trousers',
    meters: { XS: 2.8, S: 2.9, M: 3.0, L: 3.1, XL: 3.2 },
    secondhandQuery: 'kostymtyg',
    choices: [
      { id: 'linen-twill', name: "Heavy linen or twill", why: "Holds the wide leg and hangs straight to the floor.", ease: 'Medium', query: 'linen', match: ['linen','twill'], isEco: true },
      { id: 'wool', name: "Wool suiting", why: "Falls beautifully and presses into a clean yoke line.", ease: 'Medium', query: 'wool', match: ['wool'] },
      { id: 'faux-suede', name: "Faux suede or printed fur for the yoke", why: "A small piece of contrast for the yoke. The edges don’t fray, which helps at the points.", ease: 'Harder', query: 'faux suede', match: ['suede','faux'] },
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
