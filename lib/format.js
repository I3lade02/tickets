function makeFormatter(options) {
  const timeZone = process.env.DISPLAY_TIMEZONE || 'UTC';
  try {
    return new Intl.DateTimeFormat('en-GB', { timeZone, ...options });
  } catch {
    // Unknown time zone name: fall back to UTC instead of crashing the page.
    return new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', ...options });
  }
}

const full = makeFormatter({
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});
const short = makeFormatter({ day: 'numeric', month: 'short' });

export function formatDate(value) {
  return full.format(new Date(value));
}

export function timeAgo(value, now = Date.now()) {
  const seconds = Math.max(0, Math.round((now - new Date(value).getTime()) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 14) return `${days} d ago`;
  return short.format(new Date(value));
}

export function isoDate(value) {
  return new Date(value).toISOString();
}
