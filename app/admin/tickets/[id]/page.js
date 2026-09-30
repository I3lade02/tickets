import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { getTicket } from '@/lib/tickets';
import { emailRepliesEnabled } from '@/lib/email';
import TicketView from '@/components/TicketView';
import { addNote, deleteTicket, reply, setPriority, setStatus } from '../../actions';

function parseId(raw) {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 && id <= 2147483647 ? id : null;
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  return { title: `#${id} Tickets` };
}

export default async function TicketPage({ params, searchParams }) {
  await requireAdmin();
  const { id: raw } = await params;
  const id = parseId(raw);
  if (!id) notFound();

  const ticket = await getTicket(id);
  if (!ticket) notFound();

  const sp = await searchParams;
  const error = typeof sp.error === 'string' ? sp.error.slice(0, 300) : null;

  return (
    <TicketView
      ticket={ticket}
      actions={{ setStatus, setPriority, addNote, reply, deleteTicket }}
      error={error}
      emailEnabled={emailRepliesEnabled()}
      now={Date.now()}
    />
  );
}
