// Email goes through Resend's HTTP API (resend.com), so no extra package is needed.
// Every function returns { ok, error } and never throws: a failed email must not
// lose a ticket.

const RESEND_URL = 'https://api.resend.com/emails';
const TEST_SENDER = 'Tickets <onboarding@resend.dev>';

function settings() {
  const notifyTo = process.env.NOTIFY_EMAIL || '';
  return {
    key: process.env.RESEND_API_KEY || '',
    from: process.env.EMAIL_FROM || '',
    notifyTo,
    replyTo: process.env.REPLY_TO_EMAIL || notifyTo,
    confirm: process.env.SEND_CONFIRMATION === 'true',
  };
}

// Replying to customers needs a sender on a domain verified in Resend.
export function emailRepliesEnabled() {
  const s = settings();
  return Boolean(s.key && s.from);
}

async function send({ from, to, subject, text, replyTo }) {
  const { key } = settings();
  if (!key) return { ok: false, error: 'RESEND_API_KEY is not set' };
  try {
    const res = await fetch(RESEND_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [to],
        subject: subject.replace(/[\r\n]+/g, ' '),
        text,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { ok: false, error: data.message || `Resend answered ${res.status}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'network error' };
  }
}

function greetingName(ticket) {
  return ticket.name ? ticket.name.split(' ')[0] : 'there';
}

// Alert to you. Hitting "Reply" in your mail app writes straight to the customer
// (that reply won't show on the ticket, but it's handy on a phone).
export async function notifyNewTicket(ticket, { siteName, adminUrl }) {
  const s = settings();
  if (!s.key || !s.notifyTo) return { ok: false, error: 'not configured' };
  const from = ticket.name ? `${ticket.name} <${ticket.email}>` : ticket.email;
  return send({
    from: s.from || TEST_SENDER,
    to: s.notifyTo,
    replyTo: ticket.email,
    subject: `[${siteName}] #${ticket.id} ${ticket.subject}`,
    text: [
      `New ticket #${ticket.id} on ${siteName}`,
      '',
      `From: ${from}`,
      `Subject: ${ticket.subject}`,
      ticket.page_url ? `Sent from: ${ticket.page_url}` : null,
      '',
      ticket.message,
      '',
      `Open the ticket: ${adminUrl}`,
    ]
      .filter((line) => line !== null)
      .join('\n'),
  });
}

// Optional receipt to the customer.
export async function sendConfirmation(ticket, { siteName }) {
  const s = settings();
  if (!s.confirm || !s.key || !s.from) return { ok: false, error: 'not configured' };
  return send({
    from: s.from,
    to: ticket.email,
    replyTo: s.replyTo,
    subject: `We received your message [#${ticket.id}]`,
    text: [
      `Hi ${greetingName(ticket)},`,
      '',
      `Thanks for contacting ${siteName}. Your message is logged as ticket #${ticket.id}, and we'll reply to this address.`,
      '',
      'Your message:',
      ticket.message
        .split('\n')
        .map((line) => `> ${line}`)
        .join('\n'),
    ].join('\n'),
  });
}

export async function sendReply(ticket, body) {
  const s = settings();
  if (!s.key || !s.from) {
    return { ok: false, error: 'set RESEND_API_KEY and EMAIL_FROM to send replies' };
  }
  return send({
    from: s.from,
    to: ticket.email,
    replyTo: s.replyTo,
    subject: `Re: ${ticket.subject} [#${ticket.id}]`,
    text: body,
  });
}
