import Link from 'next/link'

import { Inset } from '@/components/patterns/inset'
import { LegalPage, LegalSection } from '@/components/patterns/legal-page'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { business } from '@/lib/legal'
import { subProcessors } from '@/lib/sub-processors'

export const metadata = { title: 'Privacy policy' }

// Keep in step with lib/account-data.ts (retention) and db/schema.sql
const keeping = [
  { what: 'Your account (email, login, account type)', how: 'Until you delete your account' },
  { what: 'Your sewing (projects, progress, size, the days you sewed)', how: 'Until you delete it, or 24 months after you last used Sigrid' },
  { what: 'Your answers to consent questions, with when you gave them', how: 'Until you delete your account' },
  { what: 'Purchases (which pattern, when, and that it was paid)', how: '7 years after the purchase year, as Swedish bookkeeping law requires, also if you delete your account' },
  { what: 'The record of payment messages from Stripe', how: '90 days' },
  { what: 'Usage statistics, only if you said yes', how: 'Counted in aggregate by Vercel; not linked to your account' },
  { what: 'Technical logs at our host', how: 'A short period set by Vercel, for security' },
]

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy policy" intro="What we collect, why, how long we keep it, who helps us, and what you can do about it. In short: only what Sigrid needs, and nothing optional without your yes.">
      <LegalSection title="Who is responsible">
        <p>
          {business.name} (organisation number {business.orgNumber}), {business.address}, is the data controller for Sigrid. You can reach us about your data at{' '}
          {business.email}.
        </p>
      </LegalSection>

      <LegalSection title="What we collect, and why">
        <ul>
          <li>
            <strong>Your account.</strong> Your email address, login details, sign-in sessions and account type (sewer or pattern maker). Needed to give you
            the account you asked for (GDPR art. 6.1 b).
          </li>
          <li>
            <strong>Your sewing.</strong> Your projects, chosen size, progress through each guide and the days you mark steps done, so they follow you across
            devices. Running your account (art. 6.1 b).
          </li>
          <li>
            <strong>Your answers.</strong> That you’re 13 or older, that you agreed to the Terms, and your choices about statistics and emails, each with
            which version of the text and when. Required to show we asked properly (art. 6.1 c, and art. 7.1).
          </li>
          <li>
            <strong>Purchases.</strong> If you buy a pattern, you pay on Stripe’s page and Stripe handles your card. We never see or store your card number.
            Stripe tells us what was bought and whether it was paid. Carrying out the purchase (art. 6.1 b) and bookkeeping (art. 6.1 c).
          </li>
          <li>
            <strong>Usage statistics, only if you say yes.</strong> Which pages and features are used, counted by Vercel Web Analytics without cookies and
            without building a profile of you. Nothing is measured until you choose Accept, and you can stop anytime in Settings. Your consent (art. 6.1 a).
          </li>
          <li>
            <strong>Emails about patterns and offers, only if you opt in.</strong> A separate, unticked choice, never a condition for using Sigrid. Stop
            anytime in Settings or with the link in every email. Your consent (art. 6.1 a). Emails about your account, like receipts, aren’t marketing and
            come either way.
          </li>
          <li>
            <strong>Technical logs.</strong> Our host processes your IP address, browser type and the pages you request, to deliver the site and keep it
            secure. Our legitimate interest in a secure service (art. 6.1 f).
          </li>
        </ul>
        <p>
          We don’t collect anything else. No advertising trackers, no social media pixels, no fingerprinting, and we never sell personal data. Fabric
          searches send only your search words to the shops, never anything about you.
        </p>
      </LegalSection>

      <LegalSection title="Children">
        <p>
          Sigrid is for people 13 and older, the age at which you can agree to this yourself in Sweden. Everyone confirms their age before starting, and we
          don’t collect children’s data. If you believe a child under 13 has an account, write to {business.email} and we’ll delete it.
        </p>
      </LegalSection>

      <LegalSection title="How long we keep it">
        <Inset className="p-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs text-muted-foreground">What</TableHead>
                <TableHead className="text-xs text-muted-foreground">Kept</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {keeping.map((k) => (
                <TableRow key={k.what}>
                  <TableCell className="whitespace-normal">{k.what}</TableCell>
                  <TableCell className="whitespace-normal text-muted-foreground">{k.how}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Inset>
        <p>Deletion after these times happens automatically, every day.</p>
      </LegalSection>

      <LegalSection title="Who helps us (sub-processors)">
        <p>
          These companies process personal data for us, only on our instructions and under a data processing agreement with each. Where data may reach a
          country outside the EU/EEA, it’s protected by the European Commission’s Standard Contractual Clauses or the EU–US Data Privacy Framework.
        </p>
        <Inset className="p-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs text-muted-foreground">Company</TableHead>
                <TableHead className="text-xs text-muted-foreground">What for</TableHead>
                <TableHead className="text-xs text-muted-foreground">Where</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subProcessors.map((p) => (
                <TableRow key={p.name}>
                  <TableCell className="whitespace-normal font-medium">{p.name}</TableCell>
                  <TableCell className="whitespace-normal">{p.purpose}</TableCell>
                  <TableCell className="whitespace-normal text-muted-foreground">{p.location}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Inset>
        <p>We update this list before a new company starts processing your data.</p>
      </LegalSection>

      <LegalSection title="How we protect it">
        <p>
          Everything travels encrypted (HTTPS only). Our providers encrypt stored data. Only the people who run Sigrid can reach it, and only when they need
          to. If a breach puts your data at risk, we report it to the Swedish Authority for Privacy Protection within 72 hours, and tell you without delay
          when it could harm you.
        </p>
      </LegalSection>

      <LegalSection title="Your rights, and how to use them">
        <ul>
          <li>
            <strong>See and take your data:</strong> Settings → Your data → <em>Download my data</em> gives you everything we hold, as one file.
          </li>
          <li>
            <strong>Delete it:</strong> Settings → Your data → <em>Delete my sewing</em> or <em>Delete my account</em>. Purchase records stay for the
            bookkeeping period above.
          </li>
          <li>
            <strong>Withdraw consent:</strong> Settings → Privacy. Saying no is as easy as saying yes, and doesn’t affect anything else.
          </li>
          <li>
            <strong>Correct it, restrict it or object:</strong> change your size and account type in Settings, or write to {business.email}.
          </li>
        </ul>
        <p>
          We reply to written requests within one month. If you think we handle your data wrongly, you can complain to the Swedish Authority for Privacy
          Protection (Integritetsskyddsmyndigheten, imy.se).
        </p>
      </LegalSection>

      <LegalSection title="Changes">
        <p>
          We update this page before we start collecting anything new. If a change needs your agreement, we ask again before it applies. See also our{' '}
          <Link href="/legal/cookies">cookie policy</Link>.
        </p>
      </LegalSection>
    </LegalPage>
  )
}
