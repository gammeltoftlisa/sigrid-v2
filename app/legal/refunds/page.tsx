import { LegalPage, LegalSection } from '@/components/patterns/legal-page'
import { business } from '@/lib/legal'

export const metadata = { title: 'Refund policy · Sigrid' }

export default function RefundsPage() {
  return (
    <LegalPage title="Refund policy" intro="Sigrid is free during the beta, so there’s nothing to refund yet. This is how it will work once patterns are paid.">
      <LegalSection title="Your right to cancel">
        <p>
          Under the Swedish Distance Contracts Act (lag 2005:59), you can normally cancel a purchase within 14 days. For digital
          content like a pattern, that right ends once you start using it, but only if you asked to start straight away and confirmed
          that you understand you lose the right to cancel. We will ask you to confirm this at checkout, and send the confirmation by
          email.
        </p>
        <p>If you haven’t opened the pattern or the guide yet, you can cancel within 14 days and get your money back.</p>
      </LegalSection>

      <LegalSection title="If something is wrong">
        <p>
          If a pattern is faulty, for example pieces don’t fit together or steps are missing, you’re entitled to a fix or a refund
          under the Swedish act on digital content and digital services (lag 2022:260). Write to {business.email} and we’ll sort it out.
        </p>
      </LegalSection>

      <LegalSection title="How refunds are paid">
        <p>We refund within 14 days, to the same payment method you used.</p>
      </LegalSection>

      <LegalSection title="Fabric">
        <p>
          Fabric is bought from the shop, not from us, so returns and refunds go through that shop under its own policy and your
          consumer rights with it.
        </p>
      </LegalSection>
    </LegalPage>
  )
}
