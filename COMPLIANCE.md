# Privacy compliance (GDPR and Swedish law)

What the code does, what only the company can do, and what to do when something goes wrong. This is a working
checklist, not legal advice: have a lawyer review the privacy policy, terms and this file before launch.

**The privacy policy (`app/legal/privacy`) describes the state after every box in "Before launch" is ticked.
Until then it isn't true, so don't launch first.**

## What the code does

| Requirement | Where |
| --- | --- |
| No tracker loads before consent | `components/consent.tsx`: Vercel Web Analytics renders only after Accept, never while the answer is unknown |
| Rejecting as easy as accepting | The banner's Reject and Accept are the same button, side by side; the Settings switch turns it off in one tap |
| No pre-ticked boxes | Onboarding's three checkboxes start unticked; Settings switches are off unless the person said yes |
| Separate marketing consent | Its own optional box in onboarding and its own switch in Settings; never bundled with the Terms |
| Record of who agreed to what, and when | `consents` table: append-only, with user, kind, yes/no, text version and source. `lib/consent-db.ts` |
| Asking again when the text changes | Bump a version in `lib/consent.ts`; answers to older versions stop counting and people are asked again |
| 13+ only, no children's data | Unticked age box in onboarding, required to continue; recorded; Terms say so |
| Data minimisation | Only email, login, account type, sewing, purchases and answers. Fabric searches send only the search words |
| Download my data (art. 15, 20) | Settings → Your data → Download. `GET /api/me/export` plus what's only on the device |
| Delete everything (art. 17) | Settings → Your data → Delete my account. `DELETE /api/me`; Clerk's own delete button is hidden so nothing is left behind |
| Automatic deletion (art. 5.1 e) | `/api/cron/retention`, daily: sewing after 24 months unused, Stripe event log after 90 days, purchases 7 years after an account is deleted |
| List of sub-processors | `lib/sub-processors.ts`, shown in the privacy policy |
| Encryption in transit | HTTPS only, HSTS for two years (`next.config.ts`) |
| Security headers | Strict Content Security Policy, no framing, no sniffing (`next.config.ts`) |

## Before launch: only the company can do these

- [ ] **Company details.** Replace every `[placeholder]` in `lib/legal.ts`. They're shown on the legal pages.
- [ ] **Data processing agreements (art. 28)** with every sub-processor. Most are accepted in the provider's dashboard
      or terms; download and keep a signed copy of each:
  - [ ] Vercel
  - [ ] Clerk
  - [ ] Neon
  - [ ] Stripe

  Each publishes its DPA on its legal pages (search "<company> data processing agreement"); some apply automatically
  with their terms, others need accepting in the dashboard or signing. Check which, for each.
- [ ] **Transfers outside the EU (art. 44–46).** For each company above, confirm in its DPA that the EU Standard
      Contractual Clauses (2021/914) are included, or that it's certified under the EU–US Data Privacy Framework
      (dataprivacyframework.gov/list). Do a short transfer impact assessment for the US ones. If one can't confirm
      either, stop using it.
- [ ] **Confirm encryption at rest** in each DPA's security annex (Neon, Clerk, Stripe, Vercel). Keep the reference.
- [ ] **Confirm the cookie names** in the cookie policy against what Clerk sets in production (browser devtools →
      Application → Cookies, after logging in on the live site).
- [ ] **Turn on Vercel Web Analytics** for the project (Vercel dashboard → Analytics). The code loads it only after consent.
- [ ] **Run the database migration**: `npm run db:migrate` against production (adds `consents` and the retention columns).
- [ ] **`CRON_SECRET`** is set in production, so the daily deletion job runs.
- [ ] **Record of processing activities (art. 30)**: keep the table below up to date and stored with the DPAs.
- [ ] **Breach plan**: name who is responsible, and make sure they have read the section below.

## Before sending any marketing email

Consent is collected now, but nothing sends email yet. Before the first one:

- [ ] Choose an email provider, sign its DPA, check its transfers, add it to `lib/sub-processors.ts` (shown in the policy).
- [ ] Send only to people whose newest `marketing` answer is yes for the current version (`hasGranted` in `lib/consent.ts`).
- [ ] Every email gets an unsubscribe link that records a `marketing: no` answer (source: the email) and works in one click.
- [ ] Say who it's from and why they're receiving it.

## When something goes wrong: data breach plan (art. 33–34)

A breach is any loss, leak, unauthorised access to or change of personal data: a leaked database key, a wrong
person seeing someone's data, a lost laptop with data on it.

1. **Contain it now.** Rotate leaked keys (Vercel env, Neon, Clerk, Stripe), revoke sessions in Clerk, take the
   affected feature down if needed.
2. **Write it down as you go** (the log is required even when you don't report): what happened, when you found
   out, what data, how many people, what you did.
3. **Within 72 hours of finding out**, report to IMY (imy.se → "Anmäl personuppgiftsincident") unless the breach is
   unlikely to put anyone at risk. Report what you know; add the rest later.
4. **Tell the people affected without delay** if it could harm them (for example their email and what they bought
   leaked): what happened, what it means for them, what you've done, what they can do.
5. **If a sub-processor reports a breach to you**, the 72 hours start when you learn of it.
6. **Afterwards**: fix the cause, update this plan.

## Record of processing activities (art. 30)

| Purpose | People | Data | Legal basis | Kept | Processors |
| --- | --- | --- | --- | --- | --- |
| Accounts and login | Users | Email, login, sessions, account type | Contract (6.1 b) | Until the account is deleted | Clerk, Cloudflare (via Clerk) |
| Saving sewing across devices | Users | Projects, size, progress, days sewn | Contract (6.1 b) | Until deleted, or 24 months unused | Neon |
| Proof of consent | Users | Answers, text version, time, source | Legal obligation (6.1 c, 7.1) | Until the account is deleted | Neon |
| Selling patterns | Buyers | What was bought, payment status | Contract (6.1 b), bookkeeping (6.1 c) | 7 years | Stripe, Neon |
| Usage statistics | Users who said yes | Pages and features used, aggregated | Consent (6.1 a) | Set by Vercel, aggregated | Vercel |
| Marketing email (not yet sending) | Users who opted in | Email address | Consent (6.1 a) | Until they opt out or delete the account | Not chosen yet |
| Hosting and security | Visitors | IP, browser, pages requested | Legitimate interest (6.1 f) | Short, set by Vercel | Vercel |
