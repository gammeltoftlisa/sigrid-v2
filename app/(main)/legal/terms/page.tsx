import Link from 'next/link'

import { LegalPage, LegalSection } from '@/components/patterns/legal-page'
import { business } from '@/lib/legal'

export const metadata = { title: 'Terms · Sigrid' }

export default function TermsPage() {
  return (
    <LegalPage title="Terms" intro="The agreement between you and us when you use Sigrid. Written to be read.">
      <LegalSection title="Who we are">
        <p>
          Sigrid is run by {business.name}, organisation number {business.orgNumber}, {business.address}. Contact:{' '}
          {business.email}. Full details are on the <Link href="/legal/company">company details</Link> page.
        </p>
      </LegalSection>

      <LegalSection title="The beta">
        <p>
          Sigrid is in beta and free to use. Features may change, and some content (such as the example maker profiles and
          garment photos) is there to show how the service will work. We’ll tell you before anything becomes paid.
        </p>
      </LegalSection>

      <LegalSection title="Using patterns">
        <p>
          Patterns and guides are for your own personal sewing. You may print them and make garments for yourself or as gifts. You may
          not sell or share the pattern files, or sell garments made from them commercially, unless the pattern says otherwise.
        </p>
      </LegalSection>

      <LegalSection title="Sewing safely and fit">
        <p>
          Sewing uses sharp tools, irons and machines. Follow your machine’s instructions and take care. Sizes are based on standard
          body measurements and fabrics behave differently, so we can’t promise a perfect fit. Check measurements before you cut.
        </p>
      </LegalSection>

      <LegalSection title="Buying fabric">
        <p>
          Fabric in Find fabric is sold by independent shops and secondhand sellers, not by us. When you check out, your purchase is an
          agreement between you and the shop, and the shop’s terms, delivery and return rules apply. Prices are shown as the shop lists
          them and may change. Some shops may pay us a commission when you buy through Sigrid; it never changes your price.
        </p>
      </LegalSection>

      <LegalSection title="Photos and content">
        <p>
          Garment photos are inspiration from Unsplash and show what a garment of that kind can look like, not a garment made from our
          pattern. Fabric photos belong to the shops that sell them.
        </p>
      </LegalSection>

      <LegalSection title="Liability">
        <p>
          We do our best to keep Sigrid accurate and available. Nothing in these terms limits your rights as a consumer under Swedish
          law.
        </p>
      </LegalSection>

      <LegalSection title="Disagreements">
        <p>
          Talk to us first at {business.email}. If we can’t agree, you can turn to the National Board for Consumer Disputes
          (Allmänna reklamationsnämnden, arn.se). Swedish law applies.
        </p>
      </LegalSection>

      <LegalSection title="Changes">
        <p>We’ll tell you in the app before changes to these terms take effect.</p>
      </LegalSection>
    </LegalPage>
  )
}
