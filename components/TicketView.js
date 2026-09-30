import Link from 'next/link';
import { siteColor, siteName } from '@/lib/sites';
import { PRIORITIES, STATUSES, priorityLabel, statusLabel } from '@/lib/constants';
import { formatDate, isoDate, timeAgo } from '@/lib/format';

function describeChange(event) {
  const [from, to] = event.body.split('>');
  if (event.kind === 'status') {
    return (
      <>
        Status changed from <strong>{statusLabel(from)}</strong> to <strong>{statusLabel(to)}</strong>
      </>
    );
  }
  return (
    <>
      Priority changed from <strong>{priorityLabel(from)}</strong> to{' '}
      <strong>{priorityLabel(to)}</strong>
    </>
  );
}

function Event({ event, now }) {
  const when = (
    <time dateTime={isoDate(event.created_at)} title={formatDate(event.created_at)}>
      {timeAgo(event.created_at, now)}
    </time>
  );

  if (event.kind === 'status' || event.kind === 'priority') {
    return (
      <li className="event event-change">
        <span>{describeChange(event)}</span> {when}
      </li>
    );
  }

  const isReply = event.kind === 'reply';
  return (
    <li className={`event ${isReply ? 'event-reply' : 'event-note'}`}>
      <div className="event-head">
        <strong>{isReply ? 'You replied by email' : 'Note to yourself'}</strong>
        {when}
      </div>
      <div className="event-body">{event.body}</div>
    </li>
  );
}

function ChoiceGroup({ legend, name, options, current, action, ticketId }) {
  return (
    <form action={action} className="side-block">
      <input type="hidden" name="id" value={ticketId} />
      <fieldset>
        <legend>{legend}</legend>
        <div className="choice-list">
          {options.map((o) => (
            <button
              key={o.id}
              type="submit"
              name={name}
              value={o.id}
              className={`choice choice-${name}-${o.id}`}
              aria-pressed={current === o.id}
              disabled={current === o.id}
            >
              <span className="dot" aria-hidden="true" />
              {o.label}
            </button>
          ))}
        </div>
      </fieldset>
    </form>
  );
}

export default function TicketView({ ticket, actions, error, emailEnabled, now }) {
  const firstName = ticket.name ? ticket.name.split(' ')[0] : ticket.email;
  const mailto = `mailto:${ticket.email}?subject=${encodeURIComponent(
    `Re: ${ticket.subject} [#${ticket.id}]`,
  )}`;

  return (
    <article className="ticket" style={{ '--site': siteColor(ticket.site) }}>
      <Link href="/admin" className="back">
        All tickets
      </Link>

      <header className="ticket-head">
        <p className="ticket-ref">
          <span className="ticket-ref-num">#{ticket.id}</span>
          <span className="ticket-ref-site">{siteName(ticket.site)}</span>
        </p>
        <h1>{ticket.subject}</h1>
        <p className="ticket-who">
          <span>
            {ticket.name ? <strong>{ticket.name}</strong> : null}{' '}
            <a href={`mailto:${ticket.email}`}>{ticket.email}</a>
          </span>
          <span>
            Received <time dateTime={isoDate(ticket.created_at)}>{formatDate(ticket.created_at)}</time>
          </span>
        </p>
        {ticket.page_url ? (
          <p className="ticket-page">
            Sent from{' '}
            <a href={ticket.page_url} rel="noreferrer noopener" target="_blank">
              {ticket.page_url}
            </a>
          </p>
        ) : null}
      </header>

      {error ? (
        <p className="form-error ticket-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="ticket-grid">
        <div className="ticket-thread">
          <div className="message">{ticket.message}</div>

          {ticket.events.length > 0 ? (
            <ol className="timeline" aria-label="Activity">
              {ticket.events.map((e) => (
                <Event key={e.id} event={e} now={now} />
              ))}
            </ol>
          ) : null}

          {emailEnabled ? (
            <form action={actions.reply} className="compose">
              <input type="hidden" name="id" value={ticket.id} />
              <label htmlFor="reply">Reply to {firstName}</label>
              <textarea id="reply" name="body" rows={6} required />
              <div className="compose-foot">
                <p className="hint">
                  Emails {ticket.email} and sets the status to Waiting on reply.
                </p>
                <button type="submit" className="btn btn-primary">
                  Send reply
                </button>
              </div>
            </form>
          ) : (
            <div className="compose compose-off">
              <p>
                <strong>Replying from here is off.</strong> Add <code>RESEND_API_KEY</code> and{' '}
                <code>EMAIL_FROM</code> in Vercel to turn it on. Until then, answer from your own
                mail and set the status by hand.
              </p>
              <a className="btn" href={mailto}>
                Reply in your mail app
              </a>
            </div>
          )}

          <form action={actions.addNote} className="compose compose-note">
            <input type="hidden" name="id" value={ticket.id} />
            <label htmlFor="note">Add a note</label>
            <textarea id="note" name="body" rows={3} required />
            <div className="compose-foot">
              <p className="hint">Only you see notes. {firstName} doesn&rsquo;t.</p>
              <button type="submit" className="btn">
                Save note
              </button>
            </div>
          </form>
        </div>

        <aside className="ticket-side">
          <ChoiceGroup
            legend="Status"
            name="status"
            options={STATUSES}
            current={ticket.status}
            action={actions.setStatus}
            ticketId={ticket.id}
          />
          <ChoiceGroup
            legend="Priority"
            name="priority"
            options={PRIORITIES}
            current={ticket.priority}
            action={actions.setPriority}
            ticketId={ticket.id}
          />
          <form action={actions.deleteTicket} className="side-block danger-zone">
            <input type="hidden" name="id" value={ticket.id} />
            <label className="confirm">
              <input type="checkbox" name="confirm" value="yes" required />
              <span>Delete this ticket and its notes for good (for spam)</span>
            </label>
            <button type="submit" className="btn btn-danger">
              Delete ticket
            </button>
          </form>
        </aside>
      </div>
    </article>
  );
}
