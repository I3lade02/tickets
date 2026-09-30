import Link from 'next/link';
import { SITES, getSite, siteColor, siteName } from '@/lib/sites';
import { priorityLabel, statusLabel } from '@/lib/constants';
import { isoDate, timeAgo } from '@/lib/format';

const VIEWS = [
  { id: 'active', label: 'Open' },
  { id: 'closed', label: 'Closed' },
  { id: 'all', label: 'All' },
];

function inboxHref({ site, view }) {
  const q = new URLSearchParams();
  if (site) q.set('site', site);
  if (view && view !== 'active') q.set('view', view);
  const qs = q.toString();
  return qs ? `/admin?${qs}` : '/admin';
}

function TicketRow({ ticket, now, showSite }) {
  return (
    <li className={`ticket-row is-${ticket.status}`} style={{ '--site': siteColor(ticket.site) }}>
      <Link href={`/admin/tickets/${ticket.id}`} className="ticket-link">
        <span className="ticket-num">#{ticket.id}</span>
        <span className="ticket-main">
          <span className="ticket-subject">{ticket.subject}</span>
          <span className="ticket-from">
            {showSite ? <span className="ticket-site">{siteName(ticket.site)}</span> : null}
            <span>{ticket.name || ticket.email}</span>
          </span>
        </span>
        <span className="ticket-tags">
          {ticket.priority !== 'normal' ? (
            <span className={`pill prio-${ticket.priority}`}>{priorityLabel(ticket.priority)}</span>
          ) : null}
          <span className={`pill status-${ticket.status}`}>{statusLabel(ticket.status)}</span>
        </span>
        <time className="ticket-time" dateTime={isoDate(ticket.created_at)}>
          {timeAgo(ticket.created_at, now)}
        </time>
      </Link>
    </li>
  );
}

function EmptyState({ view, site }) {
  const where = site ? ` on ${getSite(site)?.name ?? site}` : '';
  if (view === 'closed') {
    return (
      <div className="empty">
        <h2>No closed tickets{where}</h2>
        <p>Tickets you close move here.</p>
      </div>
    );
  }
  return (
    <div className="empty">
      <h2>Nothing open{where}</h2>
      <p>New messages from your websites will appear here.</p>
    </div>
  );
}

export default function InboxView({ tickets, counts, view, site, now }) {
  const sum = (test) => counts.reduce((n, row) => (test(row) ? n + row.n : n), 0);
  const inScope = (row) => !site || row.site === site;
  const viewCount = {
    active: sum((r) => inScope(r) && r.status !== 'closed'),
    closed: sum((r) => inScope(r) && r.status === 'closed'),
    all: sum(inScope),
  };
  const openOn = (id) => sum((r) => (!id || r.site === id) && r.status !== 'closed');
  const newCount = sum((r) => inScope(r) && r.status === 'new');

  let summary;
  if (viewCount.active === 0) summary = 'All caught up.';
  else if (newCount > 0) summary = `${newCount} new, ${viewCount.active} open in total.`;
  else summary = `${viewCount.active} open, none new.`;

  return (
    <div className="inbox">
      <div className="inbox-head">
        <h1>{site ? getSite(site)?.name : 'All tickets'}</h1>
        <p className="inbox-summary">{summary}</p>
      </div>

      <div className="filters">
        <nav className="site-filter" aria-label="Filter by website">
          <Link
            href={inboxHref({ view })}
            className="site-chip"
            aria-current={!site ? 'page' : undefined}
          >
            All sites <span className="count">{openOn(null)}</span>
          </Link>
          {SITES.map((s) => (
            <Link
              key={s.id}
              href={inboxHref({ site: s.id, view })}
              className="site-chip"
              style={{ '--site': s.color }}
              aria-current={site === s.id ? 'page' : undefined}
            >
              <span className="swatch" />
              {s.name} <span className="count">{openOn(s.id)}</span>
            </Link>
          ))}
        </nav>
        <nav className="view-filter" aria-label="Filter by status">
          {VIEWS.map((v) => (
            <Link
              key={v.id}
              href={inboxHref({ site, view: v.id })}
              className="view-tab"
              aria-current={view === v.id ? 'page' : undefined}
            >
              {v.label} <span className="count">{viewCount[v.id]}</span>
            </Link>
          ))}
        </nav>
      </div>

      {tickets.length === 0 ? (
        <EmptyState view={view} site={site} />
      ) : (
        <ol className="ticket-list">
          {tickets.map((t) => (
            <TicketRow key={t.id} ticket={t} now={now} showSite={!site} />
          ))}
        </ol>
      )}
    </div>
  );
}
