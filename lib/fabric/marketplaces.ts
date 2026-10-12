/**
 * Secondhand marketplaces in Sweden that have no public search API.
 * Sigrid can't list their items, so it opens a ready-made search instead.
 */
export interface Marketplace {
  id: string
  name: string
  searchUrl: (q: string) => string
}

export const marketplaces: Marketplace[] = [
  { id: 'tradera', name: 'Tradera', searchUrl: (q) => `https://www.tradera.com/search?q=${encodeURIComponent(q)}` },
  { id: 'vinted', name: 'Vinted', searchUrl: (q) => `https://www.vinted.se/catalog?search_text=${encodeURIComponent(q)}` },
  { id: 'blocket', name: 'Blocket', searchUrl: (q) => `https://www.blocket.se/recommerce/forsale/search?q=${encodeURIComponent(q)}` },
  { id: 'sellpy', name: 'Sellpy', searchUrl: (q) => `https://www.sellpy.se/search?query=${encodeURIComponent(q)}` },
]
