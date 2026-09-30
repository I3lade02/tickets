'use server';

// Everything you can do to a ticket from the dashboard. Each action checks
// that you're logged in first, because server actions are public endpoints.

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { destroySession, requireAdmin } from '@/lib/auth';
import {
  addEvent,
  deleteTicket as removeTicket,
  getTicketRow,
  setPriority as savePriority,
  setStatus as saveStatus,
} from '@/lib/tickets';
import { LIMITS, isPriority, isStatus } from '@/lib/constants';
import { sendReply } from '@/lib/email';

function readId(formData) {
  const id = Number(formData.get('id'));
  if (!Number.isInteger(id) || id <= 0 || id > 2147483647) throw new Error('Invalid ticket id');
  return id;
}

function readBody(formData) {
  const body = formData.get('body');
  return typeof body === 'string' ? body.replace(/\r\n?/g, '\n').trim().slice(0, LIMITS.note) : '';
}

const ticketPath = (id) => `/admin/tickets/${id}`;
const withError = (id, message) => `${ticketPath(id)}?error=${encodeURIComponent(message)}`;

function refresh(id) {
  revalidatePath('/admin');
  revalidatePath(ticketPath(id));
}

export async function setStatus(formData) {
  await requireAdmin();
  const id = readId(formData);
  const status = formData.get('status');
  if (!isStatus(status)) throw new Error('Invalid status');
  await saveStatus(id, status);
  refresh(id);
  redirect(ticketPath(id));
}

export async function setPriority(formData) {
  await requireAdmin();
  const id = readId(formData);
  const priority = formData.get('priority');
  if (!isPriority(priority)) throw new Error('Invalid priority');
  await savePriority(id, priority);
  refresh(id);
  redirect(ticketPath(id));
}

export async function addNote(formData) {
  await requireAdmin();
  const id = readId(formData);
  const body = readBody(formData);
  if (!body) redirect(withError(id, 'Write the note before saving it.'));
  await addEvent(id, 'note', body);
  refresh(id);
  redirect(ticketPath(id));
}

export async function reply(formData) {
  await requireAdmin();
  const id = readId(formData);
  const body = readBody(formData);
  if (!body) redirect(withError(id, 'Write your reply before sending it.'));

  const ticket = await getTicketRow(id);
  if (!ticket) redirect('/admin');

  const result = await sendReply(ticket, body);
  if (!result.ok) redirect(withError(id, `The reply was not sent: ${result.error}.`));

  await addEvent(id, 'reply', body);
  if (ticket.status === 'new' || ticket.status === 'open') await saveStatus(id, 'waiting');
  refresh(id);
  redirect(ticketPath(id));
}

export async function deleteTicket(formData) {
  await requireAdmin();
  const id = readId(formData);
  if (formData.get('confirm') !== 'yes') {
    redirect(withError(id, 'Tick the box to confirm, then delete.'));
  }
  await removeTicket(id);
  revalidatePath('/admin');
  redirect('/admin');
}

export async function logout() {
  await destroySession();
  redirect('/login');
}
