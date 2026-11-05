# Running Sigrid: the checklist for 1,000 users

What keeps Sigrid up when real people use it, and what to do when something goes wrong.
Each section says what's built in the code and what only you can do (marked **You**).

## 1. Two requests at once (race conditions)

Every write that two people (or one double click) could make at the same moment is checked and written in
one database statement, or in one transaction that locks the row first. Covered by tests.

- **Buying a pattern.** One row per person and pattern (`lib/server/entitlements.ts`); webhooks can arrive
  twice or out of order. A second checkout is refused while you own the pattern, while a payment for it is still
  clearing, and when Stripe has a payment the webhook hasn't reported yet (`app/api/checkout/route.ts`).
  Two tabs share one Stripe checkout through an idempotency key; one Stripe customer per person.
- **Syncing and "Delete my data".** Both run as transactions that take the person's profile row first, and every
  insert checks the erase time in the same transaction, so another device can't bring deleted data back
  (`lib/sewing-db.ts`, `tests/sewing-erase.test.ts`).
- **Request limits** are counted in one statement (below).

When adding a write: never read a number, decide in code, then write it back. Write it with a condition
(`UPDATE … WHERE`, `INSERT … ON CONFLICT … WHERE`) or in a transaction that locks the row first.

## 2. One query per row (N+1)

The database is read in bulk: lists come back in one query, or a few at once (`Promise.all`), never one per row.
The one place that asks once per item is the live fabric search for a pattern: Shopify's search answer has no
prices, so each match is read from the shop. It's throttled (two at a time), cached for an hour, and capped per
search. The store itself (`/api/shop`) answers from one daily copy, without asking the shops.

## 3. Error tracking

Sentry catches crashes on the server, at the edge and in the browser, including those an error page catches
(`instrumentation.ts`, `instrumentation-client.ts`, `app/error.tsx`). Reports carry the error, the page path and
the code, never a name, email, cookie, header, query string or typed text (`lib/sentry-options.ts`). No session
replay, no performance tracing. It's off wherever `NEXT_PUBLIC_SENTRY_DSN` isn't set (locally, by default).

- [ ] **You:** finish the Sentry install (Vercel → Integrations → Sentry) so the keys reach the project.
- [ ] **You:** in Sentry → Alerts, keep "a new issue is created" on, sent to your email or phone.
- [ ] **You:** Sentry → Settings → Legal: accept the DPA (also in COMPLIANCE.md).

Every server error is also one structured log line in Vercel's logs, findable by the digest the error page shows.

## 4. Rate limits

Every API route has a limit. The ones that cost money or call other companies (checkout, the shops' fabric
search, the AI writer, exporting and deleting an account) have one shared by every server instance, kept in the
database (`lib/server/rate-limit.ts`). The rest are per instance. Login is Clerk's, which limits attempts itself.
Old counters are deleted daily.

- [ ] **You (optional):** a Vercel Firewall rate-limit rule on `/api/*` as an outer wall
      (Vercel → Firewall → Rules → Rate limit, e.g. 300 requests a minute per IP).

## 5. Slow work in a request (background jobs)

Nothing slow happens while someone waits: there are no emails yet, the Stripe webhook answers as soon as the
purchase is written, and refreshing the shop's catalogue is a daily cron. When emails come (receipts are Stripe's
today), send them after the response with `after()` from `next/server`, or a queue, and make them idempotent.

## 6. Spend alerts — **You**, about 10 minutes

| Service | What can run up | Where to set the alert or cap |
| --- | --- | --- |
| Vercel | Function time, bandwidth, image optimisation | Settings → Billing → Spend Management: an alert amount, and pause at the amount you'd rather be down than pay |
| Neon (via Vercel) | Compute hours, storage | Vercel → Storage → the Neon database → Settings: plan limits; on the free plan it stops at the limit instead of billing |
| Clerk | Monthly active users past the free tier | Clerk dashboard → Billing: usage alerts |
| Sentry | Errors past the plan's quota | Sentry → Settings → Subscription: spike protection on, no on-demand budget |
| AI (studio writer) | Every request is a paid model call | Switched off today (`STUDIO_AI_ENABLED`). Before turning it on: a monthly limit on the AI Gateway or Anthropic account |
| Stripe | Fees per payment only; nothing to cap | Notifications → failed payments and disputes by email |

## 7. Rolling back a bad deploy

Every push to main deploys through GitHub Actions. If a deploy breaks the app:

1. **GitHub → Actions → "Roll back production" → Run workflow.** It puts the deployment before the newest back
   live in seconds, without building. Or paste a specific deployment URL. (The same button exists in Vercel →
   Deployments → ⋯ → Instant Rollback.)
2. Fix calmly, push to main; that deploys forward as usual.

A rollback undoes code, not the database. That's why migrations must work with the old code too (below).
Sentry tells you within minutes that something broke, instead of an email from a customer an hour later.

## 8. The database: development never touches production

- Production has its own database. Local development and preview deployments use the **dev branch**, which
  holds the tables but no one's data. The code refuses to connect to production from anything that isn't
  production (`lib/db-guard.mjs`); `ALLOW_PRODUCTION_DATABASE=1` is the deliberate, one-off way past it.
- **Every change to the tables is a migration**: a numbered file in `db/migrations`, kept with the code.
  `npm run db:migrate` applies new ones to the dev branch; the deploy workflow applies them to production before
  the new code goes live. Each runs once, in a transaction, recorded in `schema_migrations`.
- **Renaming or removing a column takes two deploys.** First add the new column and write to both; remove the old
  one in a later deploy. The previous version keeps running for a minute during a deploy, and a rollback brings
  it back for longer.

## 9. Stripe webhooks

Purchases are recorded from Stripe's webhook (`/api/webhooks/stripe`): the signature is checked, it answers
fast, and the same event twice changes nothing. Coming back to the pattern page also checks with Stripe, so a
buyer sees their pattern at once; the webhook is what makes refunds, disputes and closed tabs work.

- [ ] **You:** add `STRIPE_WEBHOOK_SECRET` to Vercel (Production). Until then the webhook answers 500 and only the
      return page records purchases. Stripe → Developers → Webhooks → the sigrid-v2 endpoint → Signing secret.
- [ ] **You:** the Stripe account on Vercel is still an unclaimed sandbox. Claim it and switch to live keys
      before taking real money.

## 10. Backups, and a restore drill

Neon keeps every change for a restore window and can bring the database back to any moment in it, as a new
branch, without touching production.

- [ ] **You:** check the window: Neon console (Vercel → Storage → the database → Open in Neon) → Settings →
      Instant restore / history retention. On the free plan it's hours, not days; a paid plan gives 7 to 30 days.
- [ ] **You, once now and then twice a year — the fire drill:**
  1. Neon console → Branches → Create branch → from **production**, at a time an hour ago. Name it `restore-drill`.
  2. Open its SQL editor and check: `SELECT count(*) FROM entitlements; SELECT count(*) FROM sewing_projects;`
  3. Note how long it took, and how much data you'd lose (the time since the point you picked). Write both here.
  4. Delete the `restore-drill` branch.
- In a real emergency: create the branch from just before the problem, check it, then make it production's
  (Neon → Branches → Set as default, or point `DATABASE_URL` at it) and redeploy.
- Not in the database, so not in its backups: profile pictures and the fabric bag (on each person's device),
  and studio patterns (in the maker's browser).

Last drill: _not done yet_.
