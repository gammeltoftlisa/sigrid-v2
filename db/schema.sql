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
