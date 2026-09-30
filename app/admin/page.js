import { requireAdmin } from '@/lib/auth';
import { countTickets, listTickets } from '@/lib/tickets';
import { getSite } from '@/lib/sites';
import InboxView from '@/components/InboxView';
import AutoRefresh from '@/components/AutoRefresh';

export const metadata = { title: 'Tickets' };

const VIEWS = ['active', 'closed', 'all'];
const first = (v) => (Array.isArray(v) ? v[0] : v);

export default async function InboxPage({ searchParams }) {
  await requireAdmin();
  const sp = await searchParams;
  const view = VIEWS.includes(first(sp.view)) ? first(sp.view) : 'active';
  const site = getSite(first(sp.site))?.id ?? null;

  const [tickets, counts] = await Promise.all([listTickets({ site, view }), countTickets()]);

  return (
    <>
      <AutoRefresh seconds={60} />
      <InboxView tickets={tickets} counts={counts} view={view} site={site} now={Date.now()} />
    </>
  );
}
