/** Reading facts out of a shop's product description */
export const stripHtml = (html: string) =>
  html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;| /g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ')

const QUALIFIERS = '(?:(?:soft|pure|fine|combed|brushed|organic|gots|certified|mercerised|mercerized|recycled|european|egyptian|pima|merino|mulberry)\\s+)*'
const FIBRES = 'cotton|linen|flax|hemp|ramie|viscose|rayon|modal|lyocell|tencel|cupro|ecovero|bamboo|polyester|polyamide|nylon|elastane|elasthane|spandex|lycra|polyurethane|acrylic|acetate|wool|cashmere|alpaca|mohair|silk|metallic|lurex'
const FIBRE = new RegExp(`(\\d{1,3}(?:[.,]\\d)?)\\s?%\\s?(${QUALIFIERS}(?:${FIBRES})\\w*)`, 'gi')
const title = (s: string) => s.replace(/\b\p{L}/gu, (c) => c.toUpperCase())

/** "Composition: 55% cotton - 40% Modal - 5% Elasthane" → "55% Cotton, 40% Modal, 5% Elasthane" */
export function parseComposition(text: string): string | undefined {
  const label = text.search(/composition|fibre content|fiber content|content\s*:/i)
  const scope = label >= 0 ? text.slice(label, label + 140) : text
  const fibres = [...scope.matchAll(FIBRE)]
  if (fibres.length > 0) {
    // Keep only the first run of percentages; descriptions often repeat the composition
    const first = fibres[0].index ?? 0
    const run = fibres.filter((m) => (m.index ?? 0) - first < 90).map((m) => `${m[1]}% ${title(m[2].toLowerCase())}`)
    return [...new Set(run)].join(', ')
  }
  if (label < 0) return undefined
  const words = scope.match(/:\s*([A-Za-zé&,\s]{3,40}?)(?=\s+(?:width|weight|gsm|colour|color|care|wash|stretch)\b|[.:]|$)/i)
  return words?.[1].trim() || undefined
}

export function parseWidth(text: string): number | undefined {
  const m = text.match(/width\s*:?\s*(\d{2,3})\s*cm/i) ?? text.match(/(\d{2,3})\s*cm\s*(?:wide|width)/i)
  const w = m ? Number(m[1]) : NaN
  return w >= 80 && w <= 330 ? w : undefined
}
