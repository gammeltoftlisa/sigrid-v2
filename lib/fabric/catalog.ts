import type { FabricQuery } from './types'

/**
 * What a supply search looks for, for the "what you'll need" list on a pattern (the store's own categories
 * are in lib/shop/taxonomy.ts). Supplies match whole words, so "needle" doesn't find needlecord. Each one was checked against the
 * shops: a department they don't stock doesn't belong here.
 */
export type DepartmentGroup = 'Fabric' | 'Lining and interfacing' | 'Thread and needles' | 'Closures' | 'Elastic and trims' | 'Tools'
export const departmentGroups: DepartmentGroup[] = ['Fabric', 'Lining and interfacing', 'Thread and needles', 'Closures', 'Elastic and trims', 'Tools']

export interface Department {
  id: string
  name: string
  group: DepartmentGroup
  query: string
  match: string[]
  kind: FabricQuery['kind']
  /** Titles containing these aren't this, whatever else they say */
  exclude?: string[]
}

export const departments: Department[] = [
  { id: 'jersey', name: 'Jersey & knits', group: 'Fabric', query: 'jersey', match: ['jersey', 'knit', 'rib'], kind: 'fabric' },
  { id: 'linen', name: 'Linen', group: 'Fabric', query: 'linen', match: ['linen'], kind: 'fabric' },
  { id: 'cotton', name: 'Cotton', group: 'Fabric', query: 'cotton', match: ['cotton', 'poplin', 'lawn'], kind: 'fabric' },
  { id: 'wool', name: 'Wool', group: 'Fabric', query: 'wool', match: ['wool', 'merino'], kind: 'fabric' },
  { id: 'viscose', name: 'Viscose & drapey', group: 'Fabric', query: 'viscose', match: ['viscose', 'rayon', 'tencel', 'lyocell', 'modal', 'cupro'], kind: 'fabric' },
  { id: 'denim', name: 'Denim & twill', group: 'Fabric', query: 'denim', match: ['denim', 'twill', 'chambray'], kind: 'fabric' },
  { id: 'sweat', name: 'Sweatshirting', group: 'Fabric', query: 'french terry', match: ['terry', 'sweat', 'fleece', 'loopback', 'looped'], kind: 'fabric' },
  { id: 'interfacing', name: 'Interfacing', group: 'Lining and interfacing', query: 'interfacing', match: ['interfacing', 'fusible', 'vilene', 'interlining'], kind: 'notion' },
  { id: 'lining', name: 'Lining', group: 'Lining and interfacing', query: 'lining', match: ['lining'], kind: 'notion' },
  { id: 'thread', name: 'Thread', group: 'Thread and needles', query: 'thread', match: ['thread'], kind: 'notion', exclude: ['needle'] },
  { id: 'needles', name: 'Needles', group: 'Thread and needles', query: 'needle', match: ['needle', 'needles'], kind: 'notion', exclude: ['needle cord', 'needlecord'] },
  { id: 'pins', name: 'Pins and clips', group: 'Thread and needles', query: 'pins', match: ['pin', 'pins', 'clip', 'clips'], kind: 'notion', exclude: ['stripe', 'pinstripe', 'pin cushion'] },
  { id: 'zips', name: 'Zips', group: 'Closures', query: 'zip', match: ['zip', 'zips', 'zipper'], kind: 'notion' },
  { id: 'buttons', name: 'Buttons', group: 'Closures', query: 'buttons', match: ['button', 'buttons'], kind: 'notion' },
  { id: 'snaps', name: 'Snaps, hooks and eyes', group: 'Closures', query: 'snap', match: ['snap', 'snaps', 'press stud', 'press fastener', 'hook', 'hooks'], kind: 'notion', exclude: ['crochet'] },
  { id: 'buckles', name: 'Buckles and rings', group: 'Closures', query: 'buckle', match: ['buckle', 'buckles', 'slider', 'd-ring'], kind: 'notion' },
  { id: 'rivets', name: 'Rivets and eyelets', group: 'Closures', query: 'rivet', match: ['rivet', 'rivets', 'eyelet', 'eyelets'], kind: 'notion' },
  { id: 'elastic', name: 'Elastic and waistbands', group: 'Elastic and trims', query: 'elastic', match: ['elastic', 'waistband', 'belting'], kind: 'notion' },
  { id: 'lace', name: 'Lace and ribbon', group: 'Elastic and trims', query: 'lace trim', match: ['lace', 'ribbon'], kind: 'notion' },
  { id: 'tape', name: 'Tapes and binding', group: 'Elastic and trims', query: 'binding', match: ['bias', 'binding', 'twill tape', 'hemming tape', 'edge tape'], kind: 'notion', exclude: ['tape measure'] },
  { id: 'drawstring', name: 'Cord and drawstring', group: 'Elastic and trims', query: 'drawstring', match: ['drawstring', 'cord'], kind: 'notion', exclude: ['needle cord', 'needlecord', 'velvet', 'corduroy'] },
  { id: 'scissors', name: 'Scissors and cutters', group: 'Tools', query: 'scissors', match: ['scissors', 'shears', 'snips', 'rotary', 'cutter'], kind: 'notion' },
  { id: 'measuring', name: 'Tape measures and rulers', group: 'Tools', query: 'tape measure', match: ['tape measure', 'ruler', 'gauge'], kind: 'notion' },
  { id: 'marking', name: 'Chalk and marking', group: 'Tools', query: 'chalk', match: ['chalk', 'marking', 'marker', 'tracing'], kind: 'notion', exclude: ['dress', 'notch'] },
  { id: 'unpicking', name: 'Seam rippers', group: 'Tools', query: 'seam ripper', match: ['ripper', 'unpicker'], kind: 'notion' },
  { id: 'turners', name: 'Loop and point turners', group: 'Tools', query: 'turner', match: ['turner'], kind: 'notion' },
  { id: 'machine', name: 'Machine bobbins and feet', group: 'Tools', query: 'bobbin', match: ['bobbin', 'bobbins', 'presser foot', 'zipper foot'], kind: 'notion' },
]

export const getDepartment = (id: string | null | undefined) => departments.find((d) => d.id === id)

/** A search for a supply, not a fabric: "needles" looks in the supplies, "washed linen" in the fabric */
export const supplyFor = (q: string) => {
  const text = q.toLowerCase()
  const words = text.split(' ')
  const supplies = departments.filter((d) => d.kind === 'notion')
  // A phrase says more than a word: "zipper foot" is the foot, not the zip
  return supplies.find((d) => d.match.some((m) => m.includes(' ') && text.includes(m))) ?? supplies.find((d) => d.match.some((m) => words.includes(m)))
}

/** Free-text search from the store's search box: letters, numbers and spaces only, short */
export function cleanSearch(raw: string | null | undefined): string {
  return (raw ?? '').replace(/[^\p{L}\p{N}\s-]/gu, ' ').replace(/\s+/g, ' ').trim().slice(0, 60)
}
