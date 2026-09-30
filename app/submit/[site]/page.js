import { notFound } from 'next/navigation';
import { getSite } from '@/lib/sites';
import SubmitForm from '@/components/SubmitForm';

export const metadata = { title: 'Contact' };

const first = (v) => (Array.isArray(v) ? v[0] : v);

export default async function SubmitPage({ params, searchParams }) {
  const { site: siteId } = await params;
  const site = getSite(siteId);
  if (!site) notFound();

  const sp = await searchParams;
  const ref = Number(first(sp.ref));
  const accent = /^[0-9a-fA-F]{6}$/.test(first(sp.accent) ?? '') ? `#${first(sp.accent)}` : null;

  return (
    <SubmitForm
      site={site}
      sent={first(sp.sent) === '1'}
      ticketRef={Number.isInteger(ref) && ref > 0 ? ref : null}
      error={first(sp.error) ?? null}
      accent={accent}
    />
  );
}
