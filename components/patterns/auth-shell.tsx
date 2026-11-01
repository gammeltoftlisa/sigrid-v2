import { GarmentImage } from '@/components/garment/GarmentImage'
import { ProductGrid } from '@/components/patterns/product-grid'
import { Wordmark } from '@/components/patterns/wordmark'

const photos = [
  { name: 'Cap-Sleeve Button Top', src: '/garments/cap-sleeve-button-top.jpg' },
  { name: 'Lace-Waist Skirt', src: '/garments/lace-waist-skirt.jpg' },
  { name: 'Fold-Waist Linen Trousers', src: '/garments/fold-waist-linen-trousers.jpg' },
]

/** Logging in and signing up: what Sigrid is on one side, Clerk's form on the other. No menu, since there's nowhere to go yet. */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="auth-shell">
      <section className="auth-story">
        <Wordmark className="title-md" />
        <div className="flex flex-col gap-4">
          <p className="auth-headline">
            Sew your <em className="display-italic">own clothes</em>
          </p>
          <p className="max-w-prose text-base text-muted-foreground">Patterns in your size, one calm step at a time.</p>
        </div>
        <ProductGrid className="auth-photos">
          <div className="tiles">
            {photos.map((p, i) => (
              <div key={p.src} className="p-0">
                <GarmentImage name={p.name} photoSrc={p.src} sizes="(min-width: 1024px) 20vw, 1px" className="aspect-product rounded-(--image-radius)" priority={i === 0} />
              </div>
            ))}
          </div>
        </ProductGrid>
      </section>

      <div className="auth-form">
        <div className="auth-page">{children}</div>
      </div>
    </main>
  )
}
