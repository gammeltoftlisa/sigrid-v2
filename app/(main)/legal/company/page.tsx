import { LegalPage, LegalSection } from '@/components/patterns/legal-page'
import { DetailList } from '@/components/patterns/detail-list'
import { business } from '@/lib/legal'

export const metadata = { title: 'Company details · Sigrid' }

const rows = [
  { label: 'Company', value: business.name },
  { label: 'Organisation number', value: business.orgNumber },
  { label: 'VAT number', value: business.vatNumber },
  { label: 'Address', value: business.address },
  { label: 'Email', value: business.email },
]

export default function CompanyPage() {
  return (
    <LegalPage title="Company details" intro="Who runs Sigrid and how to reach us.">
      <LegalSection title="Sigrid is run by">
        <DetailList items={rows} />
      </LegalSection>
      <LegalSection title="Image credits">
        <p>
          Garment photos come from Unsplash (unsplash.com) under the Unsplash License, mostly by the photographer engin akyurt. They
          are inspiration, not garments made from our patterns. Fabric photos belong to the shops that sell the fabric.
        </p>
      </LegalSection>
    </LegalPage>
  )
}
