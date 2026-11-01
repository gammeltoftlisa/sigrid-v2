import { categories } from './taxonomy'
import type { ShopItem } from './types'

/**
 * What the store carries: one of each kind of thing rather than everything the shops have. Each subcategory
 * has a quota, and each pick is the product that adds the most the others don't have yet: another
 * colour, another shop, another material. The same input always gives the same selection.
 */
const WORTH: [keyof ShopItem['facets'], number][] = [
  ['colour', 3],
  ['needleFor', 3],
  ['pattern', 2],
  ['material', 2],
  ['shop', 2],
  ['brand', 1],
  ['length', 1],
  ['size', 1],
  ['width', 1],
]

/** "Concealed Zip - Russet 855" and "Concealed Zip - Sky 545" are the same thing */
const nameOf = (item: ShopItem) => item.title.toLowerCase().split(/\s[-–—]\s/)[0].replace(/\d+/g, '').trim().split(/\s+/).slice(0, 3).join(' ')

/** The dearest tenth aren't what a shop this size leads with, and a stray price would stretch the price filter */
const SEASONAL = /christmas|halloween|easter/i
/** "Extra Strong 36": without a colour in words, its number says nothing to anyone */
const onlyANumber = (item: ShopItem, colours: boolean) => colours && !item.facets.colour?.length && /\d+$/.test(item.title.trim())

function withoutTheDearest(items: ShopItem[]): ShopItem[] {
  if (items.length < 10) return items
  const limit = [...items].sort((a, b) => a.eur - b.eur)[Math.floor(items.length * 0.9)].eur
  return items.filter((i) => i.eur <= limit)
}

function pick(candidates: ShopItem[], quota: number, prefer: RegExp | undefined, colours: boolean): ShopItem[] {
  const seen = new Map<string, Set<string>>()
  const names = new Set<string>()
  const picked: ShopItem[] = []
  const left = [...candidates].sort((a, b) => a.id.localeCompare(b.id))

  const score = (item: ShopItem) => {
    let points = names.has(nameOf(item)) ? -6 : 0
    if (prefer?.test(item.title)) points += 8
    // "Sew All 441" tells you nothing on a card, and a colour filter could never find it
    if (colours && !item.facets.colour?.length) points -= 8
    for (const [facet, worth] of WORTH) {
      const values = item.facets[facet]
      if (values?.length && !values.every((v) => seen.get(facet)?.has(v))) points += worth
    }
    // One clear colour reads better on a card than a product that comes in eleven
    if ((item.facets.colour?.length ?? 0) > 3) points -= 1
    return points
  }

  while (picked.length < quota && left.length > 0) {
    let best = 0
    let bestScore = -Infinity
    left.forEach((item, i) => {
      const s = score(item)
      if (s > bestScore) {
        best = i
        bestScore = s
      }
    })
    const [item] = left.splice(best, 1)
    picked.push(item)
    names.add(nameOf(item))
    for (const [facet] of WORTH) for (const v of item.facets[facet] ?? []) seen.set(facet, (seen.get(facet) ?? new Set()).add(v))
  }
  return picked
}

export function curate(items: ShopItem[]): ShopItem[] {
  return categories.flatMap((category) =>
    category.subs.flatMap((sub) =>
      pick(
        withoutTheDearest(items.filter((i) => i.category === category.id && i.sub === sub.name && i.image && !SEASONAL.test(i.title) && !onlyANumber(i, category.facets.includes('colour')))),
        sub.quota,
        sub.prefer,
        category.facets.includes('colour'),
      ),
    ),
  )
}
