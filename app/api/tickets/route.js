// Public endpoint your websites send tickets to.
//
// Accepts either
//   - JSON from fetch() on one of your sites  -> answers with JSON
//   - a normal HTML form post                 -> redirects to a thank-you page
//
// Only the origins listed in sites.config.js (and this app itself) may post.

import { createTicket } from '@/lib/tickets';
import { getSite, isLocalOrigin, isSiteUrl, siteForOrigin } from '@/lib/sites';
import { notifyNewTicket, sendConfirmation } from '@/lib/email';
import { LIMITS } from '@/lib/constants';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function oneLine(value, max) {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : '';
}

function multiLine(value, max) {
  return typeof value === 'string' ? value.replace(/\r\n?/g, '\n').trim().slice(0, max) : '';
}

function httpUrl(value) {
  if (typeof value !== 'string' || value.length > 2000) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
  } catch {
    return null;
  }
}

function requestHost(request) {
  return request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? '';
}

function appOrigin(request) {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/+$/, '');
  return `${new URL(request.url).protocol}//${requestHost(request)}`;
}

function isOwnOrigin(origin, request) {
  try {
    return new URL(origin).host === requestHost(request);
  } catch {
    return false;
  }
}

function corsHeaders(origin) {
  const headers = { Vary: 'Origin' };
  if (origin && (siteForOrigin(origin) || isLocalOrigin(origin))) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'Content-Type';
    headers['Access-Control-Max-Age'] = '86400';
  }
  return headers;
}

const json = (body, status, headers) => Response.json(body, { status, headers });
const seeOther = (location) => new Response(null, { status: 303, headers: { Location: location } });

export function OPTIONS(request) {
  return new Response(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}

export async function POST(request) {
  const origin = request.headers.get('origin');
  const cors = corsHeaders(origin);
  const originSite = origin ? siteForOrigin(origin) : null;

  if (origin && !originSite && !isOwnOrigin(origin, request) && !isLocalOrigin(origin)) {
    return json({ error: 'This website is not allowed to send tickets here.' }, 403, cors);
  }

  const contentType = request.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');
  const wantsPage = !isJson && (request.headers.get('accept') ?? '').includes('text/html');

  let input = null;
  try {
    input = isJson ? await request.json() : Object.fromEntries(await request.formData());
  } catch {
    input = null;
  }
  if (!input || typeof input !== 'object') {
    return json({ error: 'Send the ticket as JSON or as form data.' }, 400, cors);
  }

  const site = getSite(input.site) ?? originSite;
  if (!site) {
    return json({ error: 'Unknown site. Check the site id in your form.' }, 400, cors);
  }

  const backToForm = (query) => seeOther(`/submit/${site.id}?${query}`);
  const thankYou = (id) => {
    const target = httpUrl(input.redirect);
    if (target && isSiteUrl(target, site)) {
      const url = new URL(target);
      if (id) url.searchParams.set('ticket', String(id));
      return seeOther(url.href);
    }
    return backToForm(id ? `sent=1&ref=${id}` : 'sent=1');
  };

  // Honeypot: people never see the "website" field, bots tend to fill it in.
  // Pretend it worked so the bot moves on.
  if (typeof input.website === 'string' && input.website.trim() !== '') {
    return wantsPage ? thankYou(null) : json({ ok: true }, 200, cors);
  }

  const ticket = {
    site: site.id,
    name: oneLine(input.name, LIMITS.name),
    email: oneLine(input.email, LIMITS.email).toLowerCase(),
    subject: oneLine(input.subject, LIMITS.subject),
    message: multiLine(input.message, LIMITS.message),
    pageUrl: httpUrl(input.page),
  };

  if (!EMAIL_RE.test(ticket.email)) {
    return wantsPage
      ? backToForm('error=email')
      : json({ error: 'Enter a valid email address.' }, 400, cors);
  }
  if (!ticket.message) {
    return wantsPage ? backToForm('error=message') : json({ error: 'Write a message.' }, 400, cors);
  }
  if (!ticket.subject) {
    const firstLine = oneLine(ticket.message, 200);
    ticket.subject = firstLine.length > 80 ? `${firstLine.slice(0, 77)}...` : firstLine;
  }

  let created;
  try {
    created = await createTicket(ticket);
  } catch (err) {
    console.error('Could not save ticket', err);
    return wantsPage
      ? backToForm('error=server')
      : json({ error: 'The message could not be saved. Try again in a minute.' }, 500, cors);
  }

  // Emails are best effort: the ticket is already saved either way.
  const results = await Promise.allSettled([
    notifyNewTicket(created, {
      siteName: site.name,
      adminUrl: `${appOrigin(request)}/admin/tickets/${created.id}`,
    }),
    sendConfirmation(created, { siteName: site.name }),
  ]);
  for (const r of results) {
    if (r.status === 'fulfilled' && !r.value.ok && r.value.error !== 'not configured') {
      console.warn(`Email for ticket #${created.id} failed: ${r.value.error}`);
    }
  }

  return wantsPage ? thankYou(created.id) : json({ ok: true, id: created.id }, 201, cors);
}
