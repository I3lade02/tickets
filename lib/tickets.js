import { db } from './db';
import { priorityRank } from './constants';

export async function createTicket({ site, name, email, subject, message, pageUrl }) {
  const sql = await db();
  const [row] = await sql`
    INSERT INTO tickets (site, name, email, subject, message, page_url)
    VALUES (${site}, ${name}, ${email}, ${subject}, ${message}, ${pageUrl})
    RETURNING *`;
  return row;
}

// view: 'active' (everything not closed), 'closed', or 'all'
export async function listTickets({ site = null, view = 'active' }) {
  const sql = await db();
  const rows = await sql`
    SELECT t.id, t.site, t.name, t.email, t.subject, t.status, t.priority,
           t.created_at, t.updated_at
    FROM tickets t
    WHERE (${site}::text IS NULL OR t.site = ${site}::text)
      AND CASE ${view}::text
            WHEN 'active' THEN t.status <> 'closed'
            WHEN 'closed' THEN t.status = 'closed'
            ELSE TRUE
          END
    ORDER BY CASE WHEN ${view}::text = 'closed' THEN t.updated_at ELSE t.created_at END DESC
    LIMIT 500`;
  // Open work: most urgent first, newest first within the same priority.
  if (view !== 'closed') {
    rows.sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority));
  }
  return rows;
}

export async function countTickets() {
  const sql = await db();
  return sql`SELECT site, status, count(*)::int AS n FROM tickets GROUP BY site, status`;
}

export async function getTicketRow(id) {
  const sql = await db();
  const [ticket] = await sql`SELECT * FROM tickets WHERE id = ${id}`;
  return ticket ?? null;
}

export async function getTicket(id) {
  const sql = await db();
  const [[ticket], events] = await Promise.all([
    sql`SELECT * FROM tickets WHERE id = ${id}`,
    sql`SELECT * FROM ticket_events WHERE ticket_id = ${id} ORDER BY created_at, id`,
  ]);
  return ticket ? { ...ticket, events } : null;
}

export async function addEvent(id, kind, body) {
  const sql = await db();
  await sql`INSERT INTO ticket_events (ticket_id, kind, body) VALUES (${id}, ${kind}, ${body})`;
  await sql`UPDATE tickets SET updated_at = now() WHERE id = ${id}`;
}

// Change events are stored as "old>new" and turned into sentences when shown.
export async function setStatus(id, status) {
  const sql = await db();
  const [current] = await sql`SELECT status FROM tickets WHERE id = ${id}`;
  if (!current || current.status === status) return;
  await sql`UPDATE tickets SET status = ${status}, updated_at = now() WHERE id = ${id}`;
  await sql`INSERT INTO ticket_events (ticket_id, kind, body)
            VALUES (${id}, 'status', ${`${current.status}>${status}`})`;
}

export async function setPriority(id, priority) {
  const sql = await db();
  const [current] = await sql`SELECT priority FROM tickets WHERE id = ${id}`;
  if (!current || current.priority === priority) return;
  await sql`UPDATE tickets SET priority = ${priority}, updated_at = now() WHERE id = ${id}`;
  await sql`INSERT INTO ticket_events (ticket_id, kind, body)
            VALUES (${id}, 'priority', ${`${current.priority}>${priority}`})`;
}

export async function deleteTicket(id) {
  const sql = await db();
  await sql`DELETE FROM tickets WHERE id = ${id}`;
}
