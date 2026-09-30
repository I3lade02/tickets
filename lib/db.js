import { neon } from '@neondatabase/serverless';

let client;
let schemaReady;

function getClient() {
  if (!client) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not set. Connect a Neon database in Vercel > Storage.');
    }
    client = neon(process.env.DATABASE_URL);
  }
  return client;
}

// Creates the tables the first time the app talks to the database, so there is
// no separate setup step. Safe to run repeatedly. schema.sql has the same SQL.
function ensureSchema(sql) {
  if (!schemaReady) {
    schemaReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS tickets (
          id          SERIAL PRIMARY KEY,
          site        TEXT NOT NULL,
          name        TEXT NOT NULL DEFAULT '',
          email       TEXT NOT NULL,
          subject     TEXT NOT NULL,
          message     TEXT NOT NULL,
          page_url    TEXT,
          status      TEXT NOT NULL DEFAULT 'new',
          priority    TEXT NOT NULL DEFAULT 'normal',
          created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
        )`;
      await sql`
        CREATE TABLE IF NOT EXISTS ticket_events (
          id          SERIAL PRIMARY KEY,
          ticket_id   INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
          kind        TEXT NOT NULL,
          body        TEXT NOT NULL,
          created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
        )`;
      await sql`CREATE INDEX IF NOT EXISTS tickets_created_idx ON tickets (created_at DESC)`;
      await sql`CREATE INDEX IF NOT EXISTS ticket_events_ticket_idx ON ticket_events (ticket_id, created_at)`;
    })().catch((err) => {
      schemaReady = undefined; // try again on the next request
      throw err;
    });
  }
  return schemaReady;
}

export async function db() {
  const sql = getClient();
  await ensureSchema(sql);
  return sql;
}
