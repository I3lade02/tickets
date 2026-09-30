import { SITES } from '@/lib/sites';

// A small stack of tickets, one strip per website in that site's colour.
export default function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      {SITES.map((site) => (
        <span key={site.id} style={{ background: site.color }} />
      ))}
    </span>
  );
}
