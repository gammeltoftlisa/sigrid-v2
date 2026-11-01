import { parseWidth, stripHtml } from '../fabric/sources/parse'

import { categories, colours, MULTICOLOUR, type CategoryId, type FacetId } from './taxonomy'

/**
 * Turns one product from a shop's public feed into something the shop can filter. Everything here is read
 * from what the shop itself says: its product type, tags, title, variants and description.
 * When it doesn't say, the value is left out rather than guessed, and the product just won't
 * match that filter. Anything that isn't recognised as sewing supplies is left out of the shop altogether.
 */
export interface RawVariant {
  id: number
  title: string
  price: string | number
  available?: boolean
  option1?: string | null
  option2?: string | null
  option3?: string | null
  featured_image?: { src: string } | null
}

export interface RawProduct {
  id: number | string
  title: string
  handle: string
  body_html?: string | null
  vendor?: string | null
  product_type?: string | null
  tags?: string[] | string | null
  variants: RawVariant[]
  images?: { src: string }[] | null
  options?: { name: string; position?: number; values?: string[] }[] | null
}

export type Facets = Partial<Record<FacetId, string[]>>

export interface Classified {
  category: CategoryId
  facets: Facets
  /** "per metre" and the like, for supplies the shop sells by length */
  priceUnit?: string
}

export const tagsOf = (p: RawProduct) => (Array.isArray(p.tags) ? p.tags : (p.tags ?? '').split(',')).map((t) => t.trim()).filter(Boolean)

/** Bookkeeping tags some shops use, which mention words like "add_on" or "part number_..." */
const BOOKKEEPING = /^(mIDinput|pIDmID|updated_|filterupdate|Ftype_|productgroup|reorderstatus|pIDinput|on_pop|inventoryloc|imported_|redirect|missing_|add[a-z_]*$|Shop-ID|all_product|klaviyo|Custom-|custom-|shop-1|Hide_|P-ID|part ?number)/i

interface Text {
  title: string
  type: string
  tags: string[]
  /** Title, type and tags together */
  label: string
  body: string
}

function textOf(p: RawProduct): Text {
  const title = p.title.toLowerCase()
  const type = (p.product_type ?? '').toLowerCase()
  const tags = tagsOf(p).filter((t) => !BOOKKEEPING.test(t)).map((t) => t.toLowerCase())
  return { title, type, tags, label: `${title} | ${type} | ${tags.join(' | ')}`, body: stripHtml(p.body_html ?? '').toLowerCase() }
}

const has = (re: RegExp, hay: string) => re.test(hay)

// ─── What isn't sewing supplies, or isn't sold as one thing at one price ──────────────────────────

const NOT_FOR_SALE_HERE_TYPE = /pattern|sewing kit|needlecraft kit|gifts? and kits|^book$|^books$|class|retreat|greeting|gift card|shopify pos|printing|knitting|sample pack|scarves|furnishing|curtaining|tote|remnant|fotm|^sample$|cloth pieces|boro|miscellaneous|dye/
const NOT_FOR_SALE_HERE_TITLE = /^add a matching\b|\b(remnants?|coupons?|bundles?|charm pack|fat quarters?|scraps?|samples?|swatch(es)?|sewing patterns?|pdf patterns?|paper pattern|kits?|hampers?|lucky dip|mystery|books?|gift ?cards?|gift ?box|gift set|class|workshop|greetings? card|one-off|curtain(ing)?|upholstery|furnishing|pre-?pleat|wall ?paper|cushion cover|tote)\b/
const NOT_FOR_SALE_HERE_TAG = /^(archived|class|sewing pattern|sewing patterns|les-patrons|gift card|remnants?|coupons)$/

// ─── Categories ───────────────────────────────────────────────────────────────────────────────────

const THREAD_TOOL = /needle threader|thread (snips|cutter|clippers?|stand|holder|conditioner)|threader|thread ?wax|beeswax/
const FABRIC_TYPE = /^(fabric|tissu|wool|jersey|woven cotton|linen|occasion wear|viscose|velvet|satin|polyester|cashmere|showerproof fabrics|crepe|other fabric|silk|suiting|faux fur|fleece|lace|georgette|sateen|hessian)$/
const TRIM_TYPE = /ribbon|trim|webbing|\bcord\b|patches|labels/
const TOOL_NAME = /\b(zipper|zip) (foot|feet)\b|presser foot|\bbobbins?\b|\bsnips\b|\bshears\b|\bscissors\b|\brotary\b|cutting mat|\bcutter\b|tape measure|seam ripper|\bunpicker\b|point turner|loop turner|\bbodkin\b|\bthimble\b|tailor'?s? (chalk|ham|clapper)|\bchalk\b|trick marker|marking pen|\bmarker\b|tracing (wheel|paper)|\bpressing\b|\bclapper\b|seam gauge|sewing gauge|\bruler\b|\bawl\b|\btweezers\b|pin ?cushion|pin holder|machine oil/
const TRIM_NAME = /\b(bias|binding|piping|passepoil|ribbons?|lace trim|trim|braid|fringe|tassels?|pom ?pom|bobble|webbing|(?:cotton|herringbone|twill|hemming|edge) tape|tape|drawstring|ric ?rac|waistband|patch|patches|labels?)\b/
const TOOL_KIND_ANY = /scissors|shears|snips|rotary|cutter|blades?|measure|ruler|gauge|chalk|marker|marking|tracing|ripper|unpicker|turner|bodkin|threader|tweezers|awl|pressing|ham|clapper|thimble|cushion|bobbin|wax/

/** What kind of thing the product is, or null when it's not something the shop sells */
export function categoryOf(p: RawProduct): CategoryId | null {
  const t = textOf(p)
  if (has(NOT_FOR_SALE_HERE_TYPE, t.type) || has(NOT_FOR_SALE_HERE_TITLE, t.title) || t.tags.some((x) => NOT_FOR_SALE_HERE_TAG.test(x))) return null

  const { title } = t
  const tagged = (re: RegExp) => t.tags.some((x) => re.test(x))

  // A shop that files something as fabric means it, whatever its name says: "Needle Stripe Jersey" is
  // cloth. Only its own trim tags and a plain name for something else can overrule it.
  if (t.tags.includes('no per metre') && FABRIC_TYPE.test(t.type)) return null
  if (FABRIC_TYPE.test(t.type) || tagged(/^(tissus|les-tissus)$/)) {
    if (tagged(/^(all trims|trims|drawstring|ribbing)$/) && t.type !== 'jersey') return 'trims'
    if (has(/\b(lining|interfacing|interlining)\b/, title)) return 'lining'
    if (has(/\belastic\b/, title) && !has(/\b(fabric|jersey|knit)\b/, title)) return 'elastic'
    return 'fabric'
  }

  if (has(THREAD_TOOL, title)) return 'tools'
  if (has(/\boverlock(er)? (bobbins?|spools?|cones?)\b/, title)) return 'thread'
  if (has(TOOL_NAME, title) || tagged(/^(scissors|pin cushion)$/)) return 'tools'
  if (has(/\bneedles?\b/, title) && !has(/needle ?cord|needle stripe/, title)) return 'needles'
  if (t.type === 'thread' || has(/\bthreads?\b/, title) || tagged(/^thread$|^gutermann .*thread/)) return 'thread'
  if (t.type === 'zip' || has(/\b(zips?|zippers?)\b/, title) || tagged(/^zips?$/)) return 'zips'
  if (has(/\b(pins?|safety pins?|sewing clips?|fabric clips?|wonder clips?)\b/, title) && !has(/pinstripe|pin holder/, title)) return 'needles'
  if (has(/\b(press studs?|press fasteners?|snaps?|snap fasteners?|hooks? (and|&) (eyes?|bars?)|hook and loop|velcro|eyelets?|rivets?|buckles?|sliders?|d-rings?|o-rings?|cord (stops?|locks?|ends?)|clasps?|toggles?)\b/, title) || t.type === 'buckles') return 'fasteners'
  if (t.type === 'button' || t.type === 'buttons & snaps' || has(/\bbuttons?\b/, title) || tagged(/^buttons?$|^boutons$/)) return 'buttons'
  if (has(/\b(interfacing|fusible|interlining|vilene|vlieseline|fusing)\b/, title)) return 'lining'
  if (has(/\belastic\b|\belastique\b/, title)) return 'elastic'
  if (t.type === 'lining' || t.type === 'woven lining' || has(/\blining\b/, title)) return 'lining'
  if (has(TRIM_NAME, title) || TRIM_TYPE.test(t.type) || tagged(/^(all trims|ribbing)$/)) return 'trims'
  if (tagged(/^hardware$|^all hardware$/) && has(/\b(ring|stopper|lock|rivet|buckle|snap)\b/, title)) return 'fasteners'

  // No type, as some of Ray Stitch's fabric has: its name has to say it's cloth
  if (!t.type && has(/\b(poplin|lawn|jersey|linen|twill|denim|corduroy|needlecord|velvet|flannel|seersucker|chambray)\b/, title)) return 'fabric'
  if (tagged(/^fabrics$/) || has(/\bfabric\b/, title)) return 'fabric'
  // Atelier Brunette: sold by any length means cloth; "boucles-sangles" is its buckles and straps
  if (tagged(/^quantity_decimal$/)) return 'fabric'
  if (tagged(/^boucles-sangles$/)) return has(/\b(strap|cord)\b/, title) ? 'trims' : 'fasteners'

  // Tools the shop files as tools, and that say what they're for
  if (tagged(/^(all tools|tools|measure|sewing-tools|materiel-de-couture|outils-de-mesure|ciseaux-cutters)$/) && has(TOOL_KIND_ANY, `${title} | ${t.tags.join(' | ')}`)) return 'tools'
  return null
}

// ─── Colour ───────────────────────────────────────────────────────────────────────────────────────

/** Colour words shops use, longest and most specific first. A word that's often not a colour stays out. */
const COLOUR_WORDS: [RegExp, string][] = [
  [/\b(off[- ]?white|ecru|ivory|cream|oat(meal)?|vanilla|porcelain|mascarpone|white ?\/ ?cream|whitecream|white\/ecru\/cream)\b/, 'Cream'],
  [/\bwhite\b/, 'White'],
  [/\b(black|ebony|jet|noir)\b/, 'Black'],
  [/\b(grey|gray|charcoal|graphite|slate|smoke|ash|pewter|anthracite|steel)\b/, 'Grey'],
  [/\b(silver)\b/, 'Silver'],
  [/\b(gold|golden|brass|old brass)\b/, 'Gold'],
  [/\b(navy|midnight|ink)\b/, 'Navy'],
  [/\b(blue|blues|indigo|azure|cobalt|teal|turquoise|turquiose|aqua|sky|cyan|petrol|cornflower|sapphire|marine)\b/, 'Blue'],
  [/\b(green|greens|emerald|olive|sage|khaki|moss|fern|forest|mint|pistachio|bottle|hunter|jade|cactus|cedar|pine|lime|apple)\b/, 'Green'],
  [/\b(yellow|mustard|ochre|lemon|saffron|amber|canary|sunflower)\b/, 'Yellow'],
  [/\b(orange|tangerine|apricot|peach(?![- ]?(skin|touch))|terracotta|clementine|pumpkin)\b/, 'Orange'],
  [/\b(red|reds|burgundy|wine|claret|scarlet|crimson|ruby|cherry|oxblood|poppy|russet|rust|brick|cranberry|bordeaux|maroon)\b/, 'Red'],
  [/\b(pink|fuchsia|fuschia|rose|blush|coral|magenta|salmon|candy|dusty rose|raspberry)\b/, 'Pink'],
  [/\b(purple|violet|lilac|lavender|mauve|plum|aubergine|amethyst|mulberry|heather|grape)\b/, 'Purple'],
  [/\b(brown|browns|chocolate|chestnut|coffee|mocha|cocoa|tobacco|walnut|cinnamon|caramel|toffee|bronze|copper|umber|espresso)\b/, 'Brown'],
  [/\b(beige|sand(?![- ]?wash)|stone(?![- ]?wash)|taupe|fawn|camel|tan|biscuit|neutrals?|nude|putty|oyster|mushroom)\b/, 'Beige'],
  [/\b(multi|multicolou?r(ed)?|rainbow|blue\/purple|pink\/red|yellow\/orange)\b/, MULTICOLOUR],
]

/** "Blue/Purple" is how Merchant & Mills groups colours: both are true */
const GROUPED_TAGS: [RegExp, string[]][] = [
  [/^blue\/purple$/, ['Blue', 'Purple']],
  [/^pink\/red$/, ['Pink', 'Red']],
  [/^yellow\/orange$/, ['Yellow', 'Orange']],
  [/^white\/ecru\/cream$/, ['White', 'Cream']],
  [/^white ?\/ ?cream$|^whitecream$/, ['White', 'Cream']],
  [/^multicolou?r(ed)?$/, [MULTICOLOUR]],
]

/** The colour a piece of text names, read from one colour name such as "Hunter Green 530" */
export function coloursIn(text: string): string[] {
  const found = new Set<string>()
  const lower = text.toLowerCase()
  for (const [re, name] of COLOUR_WORDS) if (re.test(lower)) found.add(name)
  // "Off white" isn't white as well; "Blue grey" is both
  return [...found]
}

export const VARIANT_COLOUR_OPTION = /^(colou?r|coloris|fabric colou?r|colou?ris du zip|zip colou?r)$/i

/** Colours from the title, the shop's colour tags and its colour options */
function colourFacet(p: RawProduct, t: Text): string[] {
  const found = new Set<string>()
  // Only the shop's plain colour tags: Lamazi also tags things like "Viva Magenta" for a colour of the year
  for (const tag of t.tags) {
    const grouped = GROUPED_TAGS.find(([re]) => re.test(tag))
    if (grouped) grouped[1].forEach((c) => found.add(c))
    else {
      const plain = colours.find((c) => c.name.toLowerCase() === tag)
      if (plain) found.add(plain.name)
      else if (/^(neutral|neutrals|off-white|ecru|navy|burgundy|teal|mustard|olive|rust|fuchsia|lilac|khaki)$/.test(tag)) coloursIn(tag).forEach((c) => found.add(c))
    }
  }
  // The title's colour name comes after the dash when there is one: "Concealed Zip - Russet 855"
  const dash = p.title.split(/\s[-–—]\s/)
  const named = dash.length > 1 ? dash.slice(1).join(' ') : p.title
  coloursIn(named).forEach((c) => found.add(c))
  for (const o of p.options ?? []) if (VARIANT_COLOUR_OPTION.test(o.name.trim())) for (const v of o.values ?? []) coloursIn(v).forEach((c) => found.add(c))
  return [...found]
}

// ─── Lengths and sizes ────────────────────────────────────────────────────────────────────────────

export const SIZE_OPTION = /^(size|sizes|zip_sizes|zip sizes|button sizes|diam[eè]tre|diameter|taille|width|ribbon width|size \(\d+\))$/i

/** The values of the product's size option, when it has one */
function sizeValues(p: RawProduct): string[] {
  return (p.options ?? []).filter((o) => SIZE_OPTION.test(o.name.trim())).flatMap((o) => o.values ?? [])
}

/** Every "20cm", "15 mm" or `9"` in a text, in millimetres */
export function millimetres(text: string): number[] {
  const out: number[] = []
  for (const m of text.matchAll(/(\d+(?:[.,]\d+)?)\s?(mm|cm|"|inch(?:es)?|in\b)/gi)) {
    const n = Number(m[1].replace(',', '.'))
    const unit = m[2].toLowerCase()
    out.push(unit === 'mm' ? n : unit === 'cm' ? n * 10 : n * 25.4)
  }
  return out
}

/** The size in the shop's size options, else in the title */
function sizesMm(p: RawProduct): number[] {
  const fromOptions = sizeValues(p).flatMap(millimetres)
  return fromOptions.length ? fromOptions : millimetres(p.title)
}

export function bucket(values: number[], buckets: [number, string][]): string[] {
  const out = new Set<string>()
  for (const v of values) {
    const hit = buckets.find(([upTo]) => v <= upTo)
    if (hit) out.add(hit[1])
  }
  return [...out]
}

export const ZIP_LENGTHS: [number, string][] = [[199, 'Under 20 cm'], [300, '20–30 cm'], [500, '31–50 cm'], [Infinity, 'Over 50 cm']]
export const BUTTON_SIZES: [number, string][] = [[11.99, 'Under 12 mm'], [18, '12–18 mm'], [25, '19–25 mm'], [Infinity, 'Over 25 mm']]
export const NARROW_WIDTHS: [number, string][] = [[9.99, 'Under 10 mm'], [25, '10–25 mm'], [Infinity, 'Over 25 mm']]
export const FABRIC_WIDTHS: [number, string][] = [[119, 'Under 120 cm'], [150, '120–150 cm'], [Infinity, 'Over 150 cm']]

// ─── The rest, per category ───────────────────────────────────────────────────────────────────────

/** The first label whose words appear */
const matchAll = (rules: [RegExp, string][], hay: string) => rules.filter(([re]) => re.test(hay)).map(([, name]) => name)

const BRANDS: [RegExp, string][] = [
  [/g[uü]termann/, 'Gütermann'],
  [/\bprym\b/, 'Prym'],
  [/\bykk\b/, 'YKK'],
  [/\bschmetz\b/, 'Schmetz'],
  [/\bclover\b/, 'Clover'],
  [/\bcoats\b/, 'Coats'],
  [/\bbohin\b/, 'Bohin'],
  [/\bmilward\b/, 'Milward'],
  [/\bhemline\b/, 'Hemline'],
  [/\b(vlieseline|vilene)\b/, 'Vlieseline'],
  [/\bsajou\b/, 'Maison Sajou'],
  [/\bolfa\b/, 'Olfa'],
  [/\bkai\b/, 'KAI'],
  [/\bfiskars\b/, 'Fiskars'],
  [/merchant (&|and) mills|m&m essentials/, 'Merchant & Mills'],
  [/atelier brunette/, 'Atelier Brunette'],
  [/\bcousette\b/, 'Cousette'],
  [/\bdmc\b/, 'DMC'],
  [/\banchor\b/, 'Anchor'],
  [/\bmadeira\b/, 'Madeira'],
  [/\bsew easy\b/, 'Sew Easy'],
  [/\bforbitex\b/, 'Forbitex'],
  [/\bscanfil\b/, 'Scanfil'],
]

/** What the name says wins over what's in the tags: a Milward clapper tagged "Clover" is a Milward */
const firstOf = (rules: [RegExp, string][], ...sources: string[]) => {
  for (const hay of sources) {
    const hit = rules.find(([re]) => re.test(hay))
    if (hit) return [hit[1]]
  }
  return []
}

const brandOf = (p: RawProduct, t: Text) => firstOf(BRANDS, t.title, t.tags.join(' | '), (p.vendor ?? '').toLowerCase())

const FIBRE_FAMILIES: [RegExp, string][] = [
  [/\bcotton|\bcoton\b/, 'Cotton'],
  [/\blinen|\bflax\b/, 'Linen'],
  [/\bwool|\bmerino|\bcashmere|\balpaca|\bmohair/, 'Wool'],
  [/\bviscose|\brayon|\bmodal|\blyocell|\btencel|\bcupro|\becovero|\bbamboo/, 'Viscose and lyocell'],
  [/\bsilk\b/, 'Silk'],
  [/\bhemp|\bramie/, 'Hemp'],
  [/\bpolyester|\bpolyamide|\bnylon|\bacrylic|\bacetate/, 'Synthetic'],
]

const familyOf = (word: string) => FIBRE_FAMILIES.find(([re]) => re.test(word))?.[1] ?? null

/** "55% Cotton, 40% Modal" → Cotton: the fibre it's mostly made of, from the description, else the name */
export function mainFibre(t: Text): string | null {
  const best = [...t.body.matchAll(/(\d{1,3})\s?%\s?([a-zé ]{3,24})/g)].reduce<{ share: number; family: string } | null>((top, m) => {
    const family = familyOf(m[2])
    return family && Number(m[1]) <= 100 && (!top || Number(m[1]) > top.share) ? { share: Number(m[1]), family } : top
  }, null)
  if (best) return best.family
  return FIBRE_FAMILIES.find(([re]) => re.test(t.title))?.[1] ?? FIBRE_FAMILIES.find(([re]) => t.tags.some((x) => re.test(x)))?.[1] ?? null
}

const FABRIC_KINDS: [RegExp, string][] = [
  [/\bdenim\b(?!\s+blues?)|\bchambray\b/, 'Denim and chambray'],
  [/\b(jersey|interlock|ponte|knit|knits|knitted|knitwear)\b/, 'Jersey and knit'],
  [/\b(sweat ?shirting|sweat|french terry|loopback|looped|fleece)\b/, 'Sweatshirting and fleece'],
  [/\b(rib|ribbing|cuffing)\b/, 'Ribbing'],
  [/\bpoplin\b/, 'Poplin'],
  [/\blawn\b/, 'Lawn'],
  [/\b(double gauze|muslin)\b/, 'Double gauze'],
  [/\btwill\b/, 'Twill'],
  [/\b(corduroy|needlecord|needle cord)\b/, 'Corduroy'],
  [/\b(velvet|velour|velours)\b(?!\s+violet)/, 'Velvet'],
  [/\b(satin|sateen)\b/, 'Satin'],
  [/\b(crepe|crêpe)\b/, 'Crepe'],
  [/\b(chiffon|georgette)\b/, 'Chiffon and georgette'],
  [/\b(tweed|boucle|bouclé|melton|coating|felted?)\b/, 'Coating and tweed'],
  [/\b(suiting|worsted|barathea|gabardine)\b/, 'Suiting'],
  [/\b(canvas|duck|oilskin|oil ?cloth|waxed|wax cotton|showerproof)\b/, 'Canvas and waxed'],
  [/\b(lace|tulle|mesh)\b/, 'Lace and tulle'],
  [/\b(seersucker|plissé|plisse)\b/, 'Seersucker'],
  [/\b(flannel|brushed)\b/, 'Flannel'],
]

const PATTERNS: [RegExp, string][] = [
  [/\b(plain|unis|solid)\b/, 'Plain'],
  [/\b(floral|flowers?|botanical|fleurs?|foliage|leaf|leaves)\b/, 'Floral'],
  [/\b(stripes?|striped|pinstripe|rayure)\b/, 'Stripe'],
  [/\b(check|checks|checked|gingham|tartans?|plaids?)\b/, 'Check'],
  [/\b(spots?|polka|dots?|dotty)\b/, 'Dots'],
  [/\b(abstract|geometric|paisley|animal|motifs?|printed|print)\b/, 'Print'],
]

function weightOf(t: Text): string[] {
  const found = new Set<string>()
  for (const tag of t.tags) {
    if (tag === 'lightweight') found.add('Light')
    if (tag === 'mediumweight') found.add('Medium')
    if (tag === 'heavyweight') found.add('Heavy')
  }
  if (found.size) return [...found]
  const said = t.body.match(/weight\s*:?\s*(light|medium|heavy)/) ?? t.body.match(/\b(light|medium|heavy)[- ]?weight\b/)
  if (said) return [said[1][0].toUpperCase() + said[1].slice(1)]
  const gsm = t.body.match(/(\d{2,3})\s?(?:gsm|g\/m2|g\/m²|g\/sqm)/)?.[1]
  if (gsm) return [Number(gsm) < 150 ? 'Light' : Number(gsm) <= 270 ? 'Medium' : 'Heavy']
  return []
}

const THREAD_KINDS: [RegExp, string][] = [
  [/\boverlock(er)?\b|\bsurjet/, 'Overlocker'],
  [/\b(top ?stitch|buttonhole)\b/, 'Topstitch'],
  [/\bdenim\b/, 'Denim'],
  [/\b(embroidery|stranded|cross stitch|mouliné|moulin[eé]|perl[eé])\b/, 'Embroidery'],
  [/\bdarning\b/, 'Darning and mending'],
  [/\b(invisible|monofil)\w*\b/, 'Invisible'],
  [/\b(shirring|elastic)\b/, 'Shirring'],
  [/\bbasting|tacking\b/, 'Tacking'],
  [/\bextra strong\b/, 'Extra strong'],
  [/\b(sew[- ]all|all[- ]purpose|sewing thread|cotton thread|polyester thread|organic thread)\b/, 'General sewing'],
]

const THREAD_FIBRES: [RegExp, string][] = [
  [/\b(polyester|sew[- ]all)\b/, 'Polyester'],
  [/\bcotton\b/, 'Cotton'],
  [/\bsilk\b/, 'Silk'],
  [/\b(linen|flax)\b/, 'Linen'],
  [/\bwool\b/, 'Wool'],
  [/\b(nylon|polyamide)\b/, 'Nylon'],
  [/\b(metallic|lurex)\b/, 'Metallic'],
]

function spoolOf(p: RawProduct, t: Text): string[] {
  const options = sizeValues(p)
    .map((v) => v.match(/(\d[\d,]*)\s?(m|yds?)\b/i))
    .filter((m) => !!m)
  const named = options.length ? options : [(t.title.match(/\b(\d[\d,]*)\s?(m|yds?)\b/i) ?? t.tags.join(' | ').match(/\b(\d[\d,]*)\s?(m|yds?)\b/i) ?? t.body.match(/\b(\d[\d,]*)\s?(?:m|metres?|meters?)\b(?:\s*spools?)?/i))].filter((m) => !!m)
  return [...new Set(named.map((m) => {
    const n = Number(m[1].replace(',', ''))
    const metres = /yd/i.test(m[2] ?? '') ? n * 0.9144 : n
    return metres <= 50 ? 'Up to 50 m' : metres <= 150 ? '50–150 m' : metres <= 500 ? '150–500 m' : 'Over 500 m'
  }))]
}

const ZIP_KINDS: [RegExp, string][] = [
  [/\b(invisible|concealed)\b/, 'Invisible'],
  [/\bopen[- ]?end(ed)?\b/, 'Open-ended'],
  [/\b(trouser|jeans?)\b/, 'Trouser and jeans'],
  [/\b(water ?repellent|waterproof)\b/, 'Water repellent'],
  [/\b(two[- ]way)\b/, 'Two-way'],
  [/\b(standard|dress|closed[- ]end(ed)?)\b/, 'Standard'],
]
const ZIP_MATERIALS: [RegExp, string][] = [
  [/\bbrass\b/, 'Brass'],
  [/\bmetal\b/, 'Metal'],
  [/\b(nylon|natulon)\b/, 'Nylon'],
  [/\b(plastic|chunky)\b/, 'Plastic'],
]

const BUTTON_MATERIALS: [RegExp, string][] = [
  [/\bcorozo\b/, 'Corozo'],
  [/\b(wood|wooden|bamboo|coconut)\b/, 'Wood and coconut'],
  [/\b(shell|mother of pearl|pearl)\b/, 'Shell and pearl'],
  [/\b(metal|brass|pewter|zinc)\b/, 'Metal'],
  [/\b(polyester|resin|plastic|acrylic|pearlised)\b/, 'Polyester and resin'],
  [/\b(horn)\b/, 'Horn'],
  [/\b(leather)\b/, 'Leather'],
  [/\b(glass)\b/, 'Glass'],
  [/\b(ceramic|porcelain)\b/, 'Ceramic'],
  [/\b(cotton|fabric[- ]covered|linen)\b/, 'Fabric'],
]

const FASTENER_KINDS: [RegExp, string][] = [
  [/\b(snaps?|press studs?|press fasteners?)\b/, 'Snaps and press studs'],
  [/\bhooks?\b/, 'Hooks and eyes'],
  [/\b(eyelets?|grommets?)\b/, 'Eyelets'],
  [/\brivets?\b/, 'Rivets'],
  [/\bbuckles?\b/, 'Buckles'],
  [/\b(sliders?|d-rings?|o-rings?|rings?)\b/, 'Rings and sliders'],
  [/\bcord (stops?|locks?|ends?)\b/, 'Cord stops'],
  [/\b(clasps?|toggles?)\b/, 'Clasps and toggles'],
  [/\bvelcro\b|hook and loop/, 'Hook and loop'],
]

const NEEDLE_KINDS: [RegExp, string][] = [
  [/\b(sewing machine|machine|universal|schmetz)\b/, 'Machine needles'],
  [/\b(pins?|safety)\b/, 'Pins'],
  [/\bclips?\b/, 'Clips'],
  [/\b(hand|embroidery|chenille|darning|tapestry|sharps|betweens|quilting|milliners?|crewel|needles?)\b/, 'Hand needles'],
]
const NEEDLE_FOR: [RegExp, string][] = [
  [/\b(jersey|ballpoint|ball point|stretch)\b/, 'Jersey and stretch'],
  [/\bjeans?\b|\bdenim\b/, 'Denim'],
  [/\bmicrotex|\bsharp\b/, 'Fine fabric'],
  [/\bleather\b/, 'Leather'],
  [/\btop ?stitch/, 'Topstitching'],
  [/\buniversal\b/, 'Universal'],
  [/\bembroidery\b/, 'Embroidery'],
  [/\bquilting\b/, 'Quilting'],
  [/\b(twin|double)\b/, 'Twin needle'],
]

const ELASTIC_KINDS: [RegExp, string][] = [
  [/\bcord\b|\bround\b/, 'Cord'],
  [/\b(clear|transparent)\b/, 'Clear'],
  [/\b(shirring)\b/, 'Shirring'],
  [/\b(lingerie|picot|fold[- ]over|foe)\b/, 'Lingerie and fold-over'],
  [/\b(waistband|belting)\b/, 'Waistband'],
  [/\b(flat|braided|woven|loom|knitted|soft|band)\b/, 'Flat'],
]

const TRIM_KINDS: [RegExp, string][] = [
  [/\bbias\b|\bbinding\b/, 'Bias binding'],
  [/\b(piping|passepoil)\b/, 'Piping'],
  [/\bribbons?\b/, 'Ribbon'],
  [/\blace\b/, 'Lace'],
  [/\b(drawstring|cord|cording)\b/, 'Cord and drawstring'],
  [/\bwebbing\b/, 'Webbing'],
  [/\b(twill tape|tape)\b/, 'Tape'],
  [/\b(rib|ribbing)\b/, 'Ribbing'],
  [/\b(pom ?pom|bobble|fringe|tassels?|ric ?rac|braid)\b/, 'Braid and fringe'],
  [/\b(patch|patches)\b/, 'Patches'],
  [/\blabels?\b/, 'Labels'],
]
const TRIM_MATERIALS: [RegExp, string][] = [
  [/\bcotton\b/, 'Cotton'],
  [/\bsatin|polyester\b/, 'Polyester and satin'],
  [/\b(velvet|velour)\b/, 'Velvet'],
  [/\b(wool|cashmere)\b/, 'Wool'],
  [/\b(linen)\b/, 'Linen'],
  [/\b(leather)\b/, 'Leather'],
  [/\b(metallic|lurex)\b/, 'Metallic'],
]

const LINING_KINDS: [RegExp, string][] = [
  [/\b(fusible|iron[- ]?on|fusing)\b/, 'Fusible interfacing'],
  [/\b(sew[- ]?in)\b/, 'Sew-in interfacing'],
  [/\b(interfacing|interlining|vilene|vlieseline)\b/, 'Interfacing'],
  [/\blining\b/, 'Lining'],
]

const TOOL_KINDS: [RegExp, string][] = [
  [/\b(scissors|shears|snips)\b/, 'Scissors and snips'],
  [/\b(rotary|cutter|blades?|cutting mat)\b/, 'Rotary cutters and mats'],
  [/\b(tape measure|ruler|gauge|outils-de-mesure)\b/, 'Measuring'],
  [/\b(chalk|marker|marking|tracing|trick)\b/, 'Marking'],
  [/\b(seam ripper|unpicker)\b/, 'Seam rippers'],
  [/\b(turner|bodkin|threader|tweezers|awl)\b/, 'Turners and threaders'],
  [/\b(pressing|ham|clapper)\b/, 'Pressing'],
  [/\bthimble\b/, 'Thimbles'],
  [/\b(pin ?cushion)\b/, 'Pin cushions'],
  [/\borganis?er\b/, 'Pin cushions'],
  [/\b(bobbins?|presser foot|zipper foot|zip foot|feet)\b/, 'Bobbins and feet'],
  [/\bwax\b/, 'Beeswax and care'],
]

/** Reads what the shop says about the unit it prices a length-sold supply in */
function priceUnitOf(t: Text): string | undefined {
  if (t.tags.includes('half metre')) return 'per ½ m'
  if (/price (?:is )?per met|sold (?:by|per) the met|priced per met|per met(?:re|er)\b/.test(t.body)) return 'per metre'
  if (/price (?:is )?per 10 ?cm|sold (?:by|in|per) (?:the )?10 ?cm/.test(t.body)) return 'per 10 cm'
  return undefined
}

const nonEmpty = (facets: Facets): Facets => Object.fromEntries(Object.entries(facets).filter(([, v]) => v && v.length > 0)) as Facets

/** Everything the shop can filter this product on, or null when it isn't something the shop sells */
export function classify(p: RawProduct): Classified | null {
  const category = categoryOf(p)
  if (!category) return null
  const t = textOf(p)
  const brand = brandOf(p, t)
  const colour = colourFacet(p, t)
  const nameAndType = `${t.title} | ${t.tags.join(' | ')}`

  switch (category) {
    case 'fabric': {
      const fibre = mainFibre(t)
      const width = parseWidth(t.body)
      const stretchy = /\b(stretch|elastane|elasthane|spandex|lycra|jersey|knit)\b/.test(`${t.label} | ${t.body.slice(0, 600)}`)
      return {
        category,
        facets: nonEmpty({
          type: matchAll(FABRIC_KINDS, nameAndType),
          material: fibre ? [fibre] : [],
          colour,
          pattern: matchAll(PATTERNS, nameAndType),
          weight: weightOf(t),
          stretch: stretchy ? ['Stretch'] : [],
          width: width ? bucket([width], FABRIC_WIDTHS) : [],
          eco: matchAll([[/\borganic\b|\bgots\b/, 'Organic'], [/\brecycled\b/, 'Recycled']], nameAndType),
        }),
      }
    }
    case 'lining':
      return {
        category,
        priceUnit: priceUnitOf(t),
        facets: nonEmpty({ type: firstOf(LINING_KINDS, t.title, t.tags.join(' | ')), material: mainFibre(t) ? [mainFibre(t)!] : [], colour, brand }),
      }
    case 'thread':
      return {
        category,
        facets: nonEmpty({
          type: firstOf(THREAD_KINDS, t.title, t.tags.join(' | ')),
          // The name first: a cotton thread's description may mention polyester thread for comparison
          material: firstOf(THREAD_FIBRES, t.title, t.tags.join(' | '), t.body.slice(0, 200)),
          colour,
          spool: spoolOf(p, t),
          brand,
        }),
      }
    case 'needles':
      return { category, facets: nonEmpty({ type: firstOf(NEEDLE_KINDS, t.title, t.tags.join(' | ')), needleFor: matchAll(NEEDLE_FOR, nameAndType), brand }) }
    case 'zips': {
      const kinds = matchAll(ZIP_KINDS, nameAndType)
      return {
        category,
        facets: nonEmpty({
          type: kinds,
          length: bucket(sizesMm(p), ZIP_LENGTHS),
          colour,
          // The teeth, not the pull: "plastic teeth and metal shaped pull"
          material: firstOf(ZIP_MATERIALS, t.title, t.tags.join(' | '), t.body.match(/\b(plastic|nylon|metal|brass)\s+(teeth|coil)/)?.[0] ?? ''),
          brand: brandOf(p, { ...t, tags: [...t.tags, t.body] }),
        }),
      }
    }
    case 'buttons':
      return { category, facets: nonEmpty({ material: firstOf(BUTTON_MATERIALS, t.title, t.tags.join(' | '), t.body.slice(0, 200)), size: bucket(sizesMm(p), BUTTON_SIZES), colour, brand }) }
    case 'fasteners':
      return { category, facets: nonEmpty({ type: firstOf(FASTENER_KINDS, t.title, t.tags.join(' | ')), size: bucket(sizesMm(p), BUTTON_SIZES), colour, brand }) }
    case 'elastic':
      return {
        category,
        priceUnit: priceUnitOf(t),
        facets: nonEmpty({ type: firstOf(ELASTIC_KINDS, t.title, t.tags.join(' | ')), width: bucket(sizesMm(p), NARROW_WIDTHS), colour, brand }),
      }
    case 'trims':
      return {
        category,
        priceUnit: priceUnitOf(t),
        facets: nonEmpty({ type: firstOf(TRIM_KINDS, t.title, t.tags.join(' | ')), width: bucket(sizesMm(p), NARROW_WIDTHS), colour, material: firstOf(TRIM_MATERIALS, t.title, t.tags.join(' | ')), brand }),
      }
    case 'tools':
      return { category, facets: nonEmpty({ type: firstOf(TOOL_KINDS, t.title, t.tags.join(' | ')), brand }) }
  }
}

/** Which filter a category's sizes go in, and how they're grouped */
export const SIZE_FACET: Partial<Record<CategoryId, { facet: FacetId; buckets: [number, string][] }>> = {
  zips: { facet: 'length', buckets: ZIP_LENGTHS },
  buttons: { facet: 'size', buckets: BUTTON_SIZES },
  fasteners: { facet: 'size', buckets: BUTTON_SIZES },
  elastic: { facet: 'width', buckets: NARROW_WIDTHS },
  trims: { facet: 'width', buckets: NARROW_WIDTHS },
}

/** Fabric's subcategories mix how it's made and what it's made of: how it's made says more, so it goes first */
const FABRIC_BY_KIND: [string, string][] = [
  ['Jersey and knit', 'Jersey and knits'],
  ['Denim and chambray', 'Denim'],
  ['Sweatshirting and fleece', 'Sweatshirting'],
  ['Velvet', 'Velvet and corduroy'],
  ['Corduroy', 'Velvet and corduroy'],
  ['Satin', 'Satin and crepe'],
  ['Crepe', 'Satin and crepe'],
  ['Chiffon and georgette', 'Satin and crepe'],
  ['Coating and tweed', 'Coating and tweed'],
]
const FABRIC_BY_FIBRE = new Set(['Cotton', 'Linen', 'Wool', 'Viscose and lyocell', 'Silk'])

/** Which subcategory it belongs in, or null when nothing the shop says places it in one */
export function subOf(category: CategoryId, facets: Facets, title: string): string | null {
  if (category !== 'fabric') {
    const facet = categories.find((c) => c.id === category)?.subFacet
    return (facet && facets[facet]?.[0]) ?? null
  }
  // Its name has to say so: "Worsted Wool - Denim Blues" is a colour, and shops tag cloth with what it goes well with
  const named = matchAll(FABRIC_KINDS, title.toLowerCase())
  const kind = FABRIC_BY_KIND.find(([type]) => named.includes(type))
  if (kind) return kind[1]
  const fibre = facets.material?.[0]
  return fibre && FABRIC_BY_FIBRE.has(fibre) ? fibre : null
}
