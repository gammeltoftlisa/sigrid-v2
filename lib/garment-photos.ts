/**
 * The photo of each garment and maker pattern, kept in public/garments and looked up by name.
 * The garment is the subject of the picture.
 */
export interface GarmentPhoto {
  src: string
  alt: string
}

const photos: Record<string, GarmentPhoto> = {
  'Cap-Sleeve Button Top': { src: '/garments/cap-sleeve-button-top.jpg', alt: 'Charcoal top with short cap sleeves and four small buttons down an open front' },
  'Lace-Waist Skirt': { src: '/garments/lace-waist-skirt.jpg', alt: 'Floaty ivory midi skirt with a band of lace at the hips' },
  'Two-Tone Wide Jeans': { src: '/garments/two-tone-wide-jeans.jpg', alt: 'Long wide jeans with a black centre panel and lighter brown denim at the sides and waist' },
  'Pleated Buckle Shorts': { src: '/garments/pleated-buckle-shorts.jpg', alt: 'Ivory knee-length shorts with deep front pleats and a wide waistband with a side buckle' },
  'Fitted Stripe Shirt': { src: '/garments/fitted-stripe-shirt.jpg', alt: 'Fitted pale yellow and blue striped shirt with a long pointed collar and deep cuffs' },
  'Fold-Waist Linen Trousers': { src: '/garments/fold-waist-linen-trousers.jpg', alt: 'Wide sage linen trousers with a stitched waistband that folds across the front' },
  'Sequin Chiffon Camisole': { src: '/garments/sequin-chiffon-camisole.jpg', alt: 'Sheer taupe camisole with thin straps, a sequinned neckline and a pointed hem, laid flat' },
  'Smocked Stripe Blouse': { src: '/garments/smocked-stripe-blouse.jpg', alt: 'Cropped blue striped blouse with full sleeves and shirring at the waist and cuffs' },
  'Off-Shoulder Fringe Top': { src: '/garments/off-shoulder-fringe-top.jpg', alt: 'Black fitted off-shoulder top with long fringe across the neckline and hem' },
  'Western Yoke Trousers': { src: '/garments/western-yoke-trousers.jpg', alt: 'High-waisted wide navy trousers with a pointed brown and white western yoke' },
}

export function garmentPhoto(name: string): GarmentPhoto | null {
  return photos[name] ?? null
}
