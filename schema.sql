-- The app creates these tables by itself on first use (see lib/db.js).
-- This file is here if you'd rather run it by hand in Neon's SQL editor.

CREATE TABLE IF NOT EXISTS tickets (
  id          SERIAL PRIMARY KEY,
  site        TEXT NOT NULL,
  name        TEXT NOT NULL DEFAULT '',
  email       TEXT NOT NULL,
  subject     TEXT NOT NULL,
  message     TEXT NOT NULL,
  page_url    TEXT,
  status      TEXT NOT NULL DEFAULT 'new',      -- new | open | waiting | closed
  priority    TEXT NOT NULL DEFAULT 'normal',   -- urgent | high | normal | low
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Notes, email replies, and status/priority changes on a ticket.
CREATE TABLE IF NOT EXISTS ticket_events (
  id          SERIAL PRIMARY KEY,
  ticket_id   INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  kind        TEXT NOT NULL,                    -- note | reply | status | priority
  body        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tickets_created_idx ON tickets (created_at DESC);
CREATE INDEX IF NOT EXISTS ticket_events_ticket_idx ON ticket_events (ticket_id, created_at);
