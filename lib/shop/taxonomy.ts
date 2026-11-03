/**
 * The shop's categories and which filters each one has. A filter only belongs to a category when the
 * shops really say it for those products: see tests/shop-classify.test.ts, and the numbers in DESIGN.md.
 */
export type CategoryId = 'fabric' | 'lining' | 'thread' | 'needles' | 'zips' | 'buttons' | 'fasteners' | 'elastic' | 'trims' | 'tools'

export type FacetId = 'type' | 'material' | 'colour' | 'pattern' | 'weight' | 'stretch' | 'width' | 'length' | 'size' | 'spool' | 'needleFor' | 'brand' | 'eco' | 'condition' | 'shop'

export interface Subcategory {
  /** What products are filed under: kept stable, as the catalogue and shop links store it */
  name: string
  /** How it's shown, always plural ("Invisible zips"); the name when that already is */
  label?: string
  /** How many products the shop carries here: one of each kind of thing, not everything the shops have */
  quota: number
  /** What someone expects to find first here */
  prefer?: RegExp
}

export interface Category {
  id: CategoryId
  /** Shown only, always plural */
  name: string
  /** For its bubble, when the full name would push the row of categories onto a second line */
  short?: string
  /** One line for the category's page */
  description: string
  /** The bubbles you drill down to. Their order is the order they show. */
  subs: Subcategory[]
  /** The filter that says which subcategory something is in, so it isn't a filter as well */
  subFacet?: FacetId
  /** Its filters, in the order they show. Price comes first everywhere; shop last. */
  facets: FacetId[]
}

export const categories: Category[] = [
  {
    id: 'fabric',
    name: 'Fabrics',
    description: 'By the metre, from independent shops.',
    subs: [
      { name: 'Cotton', label: 'Cottons', quota: 8 },
      { name: 'Linen', label: 'Linens', quota: 6 },
      { name: 'Wool', label: 'Wools', quota: 4 },
      { name: 'Viscose and lyocell', label: 'Viscoses and lyocells', quota: 6 },
      { name: 'Silk', label: 'Silks', quota: 2 },
      { name: 'Jersey and knits', label: 'Jerseys and knits', quota: 6 },
      { name: 'Denim', label: 'Denims', quota: 3 },
      { name: 'Sweatshirting', label: 'Sweatshirt fabrics', quota: 3 },
      { name: 'Velvet and corduroy', label: 'Velvets and corduroys', quota: 3 },
      { name: 'Satin and crepe', label: 'Satins and crepes', quota: 3 },
      { name: 'Coating and tweed', label: 'Coatings and tweeds', quota: 3 },
    ],
    facets: ['material', 'colour', 'pattern', 'weight', 'stretch', 'width', 'condition'],
  },
  {
    id: 'lining',
    name: 'Linings and interfacings',
    short: 'Linings',
    description: 'What goes inside.',
    subFacet: 'type',
    subs: [
      { name: 'Lining', label: 'Linings', quota: 3 },
      { name: 'Fusible interfacing', label: 'Fusible interfacings', quota: 2 },
      { name: 'Sew-in interfacing', label: 'Sew-in interfacings', quota: 1 },
      { name: 'Interfacing', label: 'Interfacings', quota: 1 },
    ],
    facets: ['material', 'colour', 'brand'],
  },
  {
    id: 'thread',
    name: 'Threads',
    description: 'For sewing, topstitching, overlocking and more.',
    subFacet: 'type',
    subs: [
      { name: 'General sewing', label: 'General sewing threads', quota: 6, prefer: /gutermann|sewing thread/i },
      { name: 'Topstitch', label: 'Topstitch threads', quota: 2 },
      { name: 'Overlocker', label: 'Overlocker threads', quota: 2 },
      { name: 'Denim', label: 'Denim threads', quota: 1 },
      { name: 'Extra strong', label: 'Extra strong threads', quota: 1 },
      { name: 'Embroidery', label: 'Embroidery threads', quota: 2 },
      { name: 'Darning and mending', label: 'Darning and mending threads', quota: 1 },
      { name: 'Shirring', label: 'Shirring threads', quota: 1 },
    ],
    facets: ['material', 'colour', 'spool', 'brand'],
  },
  {
    id: 'needles',
    name: 'Needles and pins',
    short: 'Needles',
    description: 'For the machine and by hand.',
    subFacet: 'type',
    subs: [
      { name: 'Machine needles', quota: 3, prefer: /universal|jersey|stretch|jeans|denim/i },
      { name: 'Hand needles', quota: 2, prefer: /sharps|assorted|betweens/i },
      { name: 'Pins', quota: 2, prefer: /pins/i },
      { name: 'Clips', quota: 1 },
    ],
    facets: ['needleFor', 'brand'],
  },
  {
    id: 'zips',
    name: 'Zips',
    description: 'Invisible, open-ended, metal and more.',
    subFacet: 'type',
    subs: [
      { name: 'Invisible', label: 'Invisible zips', quota: 4 },
      { name: 'Standard', label: 'Standard zips', quota: 3 },
      { name: 'Open-ended', label: 'Open-ended zips', quota: 2 },
      { name: 'Trouser and jeans', label: 'Trouser and jeans zips', quota: 2 },
      { name: 'Water repellent', label: 'Water-repellent zips', quota: 1 },
    ],
    facets: ['length', 'colour', 'material', 'brand'],
  },
  {
    id: 'buttons',
    name: 'Buttons',
    description: 'Sold one at a time or in sets.',
    subFacet: 'material',
    subs: [
      { name: 'Corozo', label: 'Corozo buttons', quota: 3 },
      { name: 'Wood and coconut', label: 'Wood and coconut buttons', quota: 3 },
      { name: 'Shell and pearl', label: 'Shell and pearl buttons', quota: 2 },
      { name: 'Metal', label: 'Metal buttons', quota: 3 },
      { name: 'Polyester and resin', label: 'Polyester and resin buttons', quota: 3 },
      { name: 'Fabric', label: 'Fabric buttons', quota: 1 },
      { name: 'Horn', label: 'Horn buttons', quota: 1 },
    ],
    facets: ['size', 'colour', 'brand'],
  },
  {
    id: 'fasteners',
    name: 'Fasteners',
    description: 'Snaps, hooks, eyelets, buckles and rings.',
    subFacet: 'type',
    subs: [
      { name: 'Snaps and press studs', quota: 2 },
      { name: 'Hooks and eyes', quota: 2 },
      { name: 'Eyelets', quota: 2 },
      { name: 'Rivets', quota: 1 },
      { name: 'Buckles', quota: 2 },
      { name: 'Rings and sliders', quota: 1 },
      { name: 'Cord stops', quota: 1 },
      { name: 'Clasps and toggles', quota: 1 },
    ],
    facets: ['size', 'colour', 'brand'],
  },
  {
    id: 'elastic',
    name: 'Elastics',
    description: 'For waistbands, cuffs and lingerie.',
    subFacet: 'type',
    subs: [
      { name: 'Flat', label: 'Flat elastics', quota: 3 },
      { name: 'Waistband', label: 'Waistband elastics', quota: 2 },
      { name: 'Cord', label: 'Cord elastics', quota: 2 },
      { name: 'Clear', label: 'Clear elastics', quota: 1 },
    ],
    facets: ['width', 'colour', 'brand'],
  },
  {
    id: 'trims',
    name: 'Trims and bindings',
    short: 'Trims',
    description: 'Bias, ribbon, lace, cord and webbing.',
    subFacet: 'type',
    subs: [
      { name: 'Bias binding', label: 'Bias bindings', quota: 3 },
      { name: 'Piping', label: 'Pipings', quota: 2 },
      { name: 'Ribbon', label: 'Ribbons', quota: 3 },
      { name: 'Lace', label: 'Laces', quota: 2 },
      { name: 'Cord and drawstring', label: 'Cords and drawstrings', quota: 2 },
      { name: 'Webbing', label: 'Webbings', quota: 2 },
      { name: 'Tape', label: 'Tapes', quota: 2 },
      { name: 'Ribbing', label: 'Ribbings', quota: 2 },
      { name: 'Braid and fringe', label: 'Braids and fringes', quota: 1 },
    ],
    facets: ['width', 'colour', 'material', 'brand'],
  },
  {
    id: 'tools',
    name: 'Tools',
    description: 'Scissors, measuring, marking and pressing.',
    subFacet: 'type',
    subs: [
      { name: 'Scissors and snips', quota: 3 },
      { name: 'Rotary cutters and mats', quota: 1, prefer: /rotary/i },
      { name: 'Measuring', label: 'Measuring tools', quota: 2, prefer: /tape measure|gauge/i },
      { name: 'Marking', label: 'Marking tools', quota: 2 },
      { name: 'Seam rippers', quota: 1, prefer: /ripper|unpicker/i },
      { name: 'Turners and threaders', quota: 1, prefer: /turner|bodkin/i },
      { name: 'Pressing', label: 'Pressing tools', quota: 1, prefer: /ham\b|clapper/i },
      { name: 'Thimbles', quota: 1 },
      { name: 'Pin cushions', quota: 1, prefer: /pin ?cushion/i },
      { name: 'Bobbins and feet', quota: 1, prefer: /bobbins?\b|\bfoot\b/i },
    ],
    facets: ['brand'],
  },
]

/** Before you've picked a category: only what's true of everything */
export const universalFacets: FacetId[] = ['colour', 'condition']

export const getCategory = (id: string | null | undefined) => categories.find((c) => c.id === id)

export const facetLabels: Record<FacetId, string> = {
  type: 'Type',
  material: 'Material',
  colour: 'Colour',
  pattern: 'Pattern',
  weight: 'Weight',
  stretch: 'Stretch',
  width: 'Width',
  length: 'Length',
  size: 'Size',
  spool: 'Spool length',
  needleFor: 'Needle for',
  brand: 'Brand',
  eco: 'Sustainable',
  condition: 'Condition',
  shop: 'Shop',
}

/** The colour filter's choices, as swatches */
export const colours = [
  { name: 'Black', hex: '#1c1c1c' },
  { name: 'Grey', hex: '#8d8d8d' },
  { name: 'White', hex: '#ffffff' },
  { name: 'Cream', hex: '#efe6d2' },
  { name: 'Beige', hex: '#cdb898' },
  { name: 'Brown', hex: '#6f4a2f' },
  { name: 'Red', hex: '#b5262c' },
  { name: 'Pink', hex: '#ea8fb0' },
  { name: 'Orange', hex: '#e27a2c' },
  { name: 'Yellow', hex: '#ecc73f' },
  { name: 'Green', hex: '#4c8a4f' },
  { name: 'Blue', hex: '#3f77c4' },
  { name: 'Navy', hex: '#1f2d55' },
  { name: 'Purple', hex: '#7b4fa3' },
  { name: 'Gold', hex: '#c6a24a' },
  { name: 'Silver', hex: '#c4c8cc' },
] as const

export const conditionLabel = { new: 'New', deadstock: 'Deadstock', secondhand: 'Secondhand' } as const

export const MULTICOLOUR = 'Multicolour'
export type ColourName = (typeof colours)[number]['name'] | typeof MULTICOLOUR

/** A subcategory as it's shown: its plural label */
export const subLabel = (category: Category | undefined, name: string) => category?.subs.find((s) => s.name === name)?.label ?? name
