import Link from 'next/link'

import { LegalPage, LegalSection } from '@/components/patterns/legal-page'
import { business } from '@/lib/legal'

export const metadata = { title: 'Privacy policy · Sigrid' }

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy policy" intro="What we collect, why, and what you can do about it. In short: very little, and most of it never leaves your device.">
      <LegalSection title="Who is responsible">
        <p>
          {business.name} (organisation number {business.orgNumber}), {business.address}, is the data controller for Sigrid.
          You can reach us at {business.email}.
        </p>
      </LegalSection>

      <LegalSection title="What stays on your device">
        <p>
          Your projects, chosen size, progress through each guide, the dates you mark steps done (for streaks), and your fabric bag
          are saved in your browser’s local storage. They are not sent to us. Clearing your browser data removes them.
        </p>
      </LegalSection>

      <LegalSection title="What we receive">
        <ul>
          <li>
            <strong>Technical logs.</strong> Our host, Vercel Inc., processes your IP address, browser type and the pages you request
            to deliver the site and keep it secure. Legal basis: our legitimate interest in running a secure service (GDPR art. 6.1 f).
            Logs are kept for a short period set by the host.
          </li>
          <li>
            <strong>Fabric searches.</strong> When you search for fabric, our server asks the partner shops for matching products.
            Only the search words are sent, never anything about you.
          </li>
          <li>
            <strong>Sign-up details.</strong> During the beta, the sign-up form does not send or store your email or password.
            When accounts launch we will update this policy before collecting anything.
          </li>
        </ul>
        <p>We do not use analytics, advertising trackers or social media pixels, and we do not sell personal data.</p>
      </LegalSection>

      <LegalSection title="Shops and other services">
        <p>
          When you open a fabric shop or check out, you leave Sigrid and the shop’s own privacy policy applies. Links carry a tag
          showing you came from Sigrid; the tag contains nothing about you.
        </p>
        <p>
          Vercel is based in the USA and is certified under the EU–US Data Privacy Framework, which the European Commission
          recognises as giving adequate protection.
        </p>
      </LegalSection>

      <LegalSection title="Your rights">
        <p>
          You can ask for a copy of the personal data we hold about you, ask us to correct or delete it, object to our processing or
          ask us to restrict it, and ask to move it elsewhere. Write to {business.email}; we reply within one month.
        </p>
        <p>
          If you think we handle your data wrongly, you can complain to the Swedish Authority for Privacy Protection
          (Integritetsskyddsmyndigheten, imy.se).
        </p>
      </LegalSection>

      <LegalSection title="Children">
        <p>Sigrid is not aimed at children under 13, and we do not knowingly collect their data.</p>
      </LegalSection>

      <LegalSection title="Changes">
        <p>
          We update this page before we start collecting anything new, and tell you in the app. See also our{' '}
          <Link href="/legal/cookies">cookie policy</Link>.
        </p>
      </LegalSection>
    </LegalPage>
  )
}
