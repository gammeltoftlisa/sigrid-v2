/**
 * Secondhand fabric is sold as one piece. Read its length from the listing title
 * ("Vintage linen 2.5 m", "300cm cotton", "3 yards"), or null when it isn't stated.
 */
export function parsePieceMeters(text: string): number | null {
  const t = text.toLowerCase().replace(',', '.')
  const m = t.match(/(\d+(?:\.\d+)?)\s*(m|metres?|meters?|mtrs?)\b/)
  if (m) return sane(Number(m[1]))
  const cm = t.match(/(\d{2,4})\s*cm\b(?!\s*(?:wide|width|x))/)
  if (cm && !/(\d{2,4})\s*cm\s*x/.test(t)) return sane(Number(cm[1]) / 100)
  const yd = t.match(/(\d+(?:\.\d+)?)\s*(yds?|yards?)\b/)
  if (yd) return sane(Number(yd[1]) * 0.9144)
  return null
}

const sane = (m: number) => (m > 0.2 && m < 50 ? Math.round(m * 100) / 100 : null)
