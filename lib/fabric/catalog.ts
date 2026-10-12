import type { FabricQuery } from './types'

/** Store departments for browsing without a garment in mind */
export interface Department {
  id: string
  name: string
  group: 'Fabric' | 'Notions'
  query: string
  match: string[]
  kind: FabricQuery['kind']
}

export const departments: Department[] = [
  { id: 'jersey', name: 'Jersey & knits', group: 'Fabric', query: 'jersey', match: ['jersey', 'knit', 'rib'], kind: 'fabric' },
  { id: 'linen', name: 'Linen', group: 'Fabric', query: 'linen', match: ['linen'], kind: 'fabric' },
  { id: 'cotton', name: 'Cotton', group: 'Fabric', query: 'cotton', match: ['cotton', 'poplin', 'lawn'], kind: 'fabric' },
  { id: 'wool', name: 'Wool', group: 'Fabric', query: 'wool', match: ['wool', 'merino'], kind: 'fabric' },
  { id: 'viscose', name: 'Viscose & drapey', group: 'Fabric', query: 'viscose', match: ['viscose', 'rayon', 'tencel', 'lyocell', 'modal', 'cupro'], kind: 'fabric' },
  { id: 'denim', name: 'Denim & twill', group: 'Fabric', query: 'denim', match: ['denim', 'twill', 'chambray'], kind: 'fabric' },
  { id: 'sweat', name: 'Sweatshirting', group: 'Fabric', query: 'french terry', match: ['terry', 'sweat', 'fleece', 'loopback', 'looped'], kind: 'fabric' },
  { id: 'thread', name: 'Thread', group: 'Notions', query: 'thread', match: ['thread'], kind: 'notion' },
  { id: 'zips', name: 'Zips', group: 'Notions', query: 'zip', match: ['zip'], kind: 'notion' },
  { id: 'buttons', name: 'Buttons', group: 'Notions', query: 'buttons', match: ['button'], kind: 'notion' },
]

export const getDepartment = (id: string | null | undefined) => departments.find((d) => d.id === id)

/** Free-text search from the store's search box: letters, numbers and spaces only, short */
export function cleanSearch(raw: string | null | undefined): string {
  return (raw ?? '').replace(/[^\p{L}\p{N}\s-]/gu, ' ').replace(/\s+/g, ' ').trim().slice(0, 60)
}
