-- Who owns which pattern. One row per person and pattern, so a purchase can't unlock twice.
-- last_event_at is the Stripe event time (seconds): events can arrive twice or out of order, and an
-- older one must never undo a newer one.
CREATE TABLE IF NOT EXISTS entitlements (
  user_id             text NOT NULL,
  garment_id          text NOT NULL,
  status              text NOT NULL CHECK (status IN ('active', 'processing', 'revoked')),
  checkout_session_id text,
  payment_intent_id   text,
  withdrawal_waiver   boolean NOT NULL DEFAULT false,
  last_event_at       bigint NOT NULL,
  updated_at          timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, garment_id)
);

-- Every Stripe event handled, so a repeat is recognised without repeating the work
CREATE TABLE IF NOT EXISTS stripe_events (
  event_id    text PRIMARY KEY,
  type        text NOT NULL,
  handled_at  timestamptz NOT NULL DEFAULT now()
);

-- What a logged-in person is sewing, so it follows them across devices (lib/sewing-db.ts)
CREATE TABLE IF NOT EXISTS sewing_projects (
  user_id text NOT NULL,
  garment_id text NOT NULL,
  size text NOT NULL,
  completed_until integer NOT NULL CHECK (completed_until >= 0),
  updated_at timestamptz NOT NULL,
  PRIMARY KEY (user_id, garment_id)
);

CREATE TABLE IF NOT EXISTS sewing_steps (
  user_id text NOT NULL,
  garment_id text NOT NULL,
  step integer NOT NULL CHECK (step >= 0),
  action text NOT NULL,
  done_at timestamptz NOT NULL,
  PRIMARY KEY (user_id, garment_id, step)
);

CREATE TABLE IF NOT EXISTS sewing_profiles (
  user_id text PRIMARY KEY,
  size text,
  size_updated_at timestamptz,
  erased_at timestamptz
);

-- A daily copy of what the shops sell, so the store can filter all of it (lib/shop/store.ts). Public shop data, no people.
-- Safe to empty at any time: the next refresh fills it again.
CREATE TABLE IF NOT EXISTS shop_products (
  id text PRIMARY KEY,
  source text NOT NULL,
  data jsonb NOT NULL,
  refreshed_at timestamptz NOT NULL
);

-- Proof of consent (lib/consent.ts): every answer anyone gives, never updated, so the history shows who agreed
-- to what, which version of the text, when and where. The newest row per person and kind is their current answer.
-- Deleted with the account (app/api/me/route.ts).
CREATE TABLE IF NOT EXISTS consents (
  id          bigserial PRIMARY KEY,
  user_id     text NOT NULL,
  kind        text NOT NULL CHECK (kind IN ('terms', 'age', 'analytics', 'marketing')),
  granted     boolean NOT NULL,
  version     text NOT NULL,
  source      text NOT NULL,
  recorded_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS consents_by_user ON consents (user_id, kind, recorded_at DESC);

-- Automatic deletion (app/api/cron/retention): when each account last used Sigrid. Sewing of accounts
-- unused for 24 months is deleted.
ALTER TABLE sewing_profiles ADD COLUMN IF NOT EXISTS last_seen_at timestamptz;
UPDATE sewing_profiles SET last_seen_at = now() WHERE last_seen_at IS NULL;

-- Purchases are bookkeeping records and stay 7 years (bokföringslagen 7 kap. 2 §), also after the account is
-- deleted; this says when it was, so they can go after that.
ALTER TABLE entitlements ADD COLUMN IF NOT EXISTS account_deleted_at timestamptz
