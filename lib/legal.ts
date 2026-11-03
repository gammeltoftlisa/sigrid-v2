/**
 * Business details shown on the legal pages and in the footer.
 * Swedish law (lag 2002:562 om elektronisk handel, 8 §) requires the company name, address,
 * email and organisation number to be easy to find. Fill these in before going public:
 * every value in [brackets] is a placeholder and is shown as such on the site.
 */
export const business = {
  name: '[Company name AB]',
  orgNumber: '[Organisation number]',
  vatNumber: '[VAT number, if registered]',
  address: '[Street, postcode, city, Sweden]',
  email: '[contact email]',
  /** Last time the legal texts were reviewed */
  updated: '2 November 2026',
}

export const isPlaceholder = (v: string) => v.startsWith('[')

/**
 * Whether prices include VAT. Swedish law has consumer prices shown with VAT included, so once a
 * real VAT number is filled in above, the checkout says so. Until then nothing is claimed.
 */
export const pricesIncludeVat = !isPlaceholder(business.vatNumber)
