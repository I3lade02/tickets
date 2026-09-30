import { SITES } from '@/sites.config';

function normalize(origin) {
  try {
    return new URL(origin).origin;
  } catch {
    return null;
  }
}

const ORIGINS = new Map(
  SITES.flatMap((site) => site.origins.map((o) => [normalize(o), site])).filter(([o]) => o),
);

export { SITES };

export function getSite(id) {
  if (typeof id !== 'string') return null;
  return SITES.find((s) => s.id === id) ?? null;
}

export function siteForOrigin(origin) {
  const o = normalize(origin);
  return o ? ORIGINS.get(o) ?? null : null;
}

// Lets you test from `npm run dev` on your own machine. Never allowed in production.
export function isLocalOrigin(origin) {
  return (
    process.env.NODE_ENV !== 'production' &&
    /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin ?? '')
  );
}

export function isSiteUrl(url, site) {
  try {
    const o = new URL(url).origin;
    return site.origins.some((allowed) => normalize(allowed) === o);
  } catch {
    return false;
  }
}

export function siteName(id) {
  return getSite(id)?.name ?? id;
}

export function siteColor(id) {
  return getSite(id)?.color ?? '#566173';
}
