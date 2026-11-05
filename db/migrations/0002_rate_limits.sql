-- Request limits shared by every server instance (lib/server/rate-limit.ts). One row per visitor or account
-- and endpoint, counted in one statement, so two requests at once can't both slip under the limit.
-- Rows are only counters: an IP or account id and a number. Rows older than a day go in the daily cron.
CREATE TABLE IF NOT EXISTS rate_limits (
  key          text PRIMARY KEY,
  window_start timestamptz NOT NULL,
  count        integer NOT NULL
);
