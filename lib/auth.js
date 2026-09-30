import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const COOKIE = 'tickets_session';
const MAX_AGE = 60 * 60 * 24 * 30; // stay logged in for 30 days

function secret() {
  const s = process.env.SESSION_SECRET;
  return s && s.length >= 16 ? s : null;
}

function sign(value, key) {
  return crypto.createHmac('sha256', key).update(value).digest('base64url');
}

function sameBytes(a, b) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

export function isConfigured() {
  return Boolean(process.env.ADMIN_PASSWORD && secret());
}

export function checkPassword(input) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || typeof input !== 'string') return false;
  // Hash both sides so the comparison takes the same time whatever the length.
  const hash = (s) => crypto.createHash('sha256').update(s).digest();
  return crypto.timingSafeEqual(hash(input), hash(expected));
}

export async function createSession() {
  const key = secret();
  if (!key) throw new Error('SESSION_SECRET must be set (at least 16 characters).');
  const expires = Math.floor(Date.now() / 1000) + MAX_AGE;
  const payload = `admin.${expires}`;
  const store = await cookies();
  store.set(COOKIE, `${payload}.${sign(payload, key)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(COOKIE);
}

export async function isAdmin() {
  const key = secret();
  if (!key) return false;
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return false;
  const cut = token.lastIndexOf('.');
  if (cut < 0) return false;
  const payload = token.slice(0, cut);
  if (!sameBytes(token.slice(cut + 1), sign(payload, key))) return false;
  const expires = Number(payload.split('.')[1]);
  return Number.isFinite(expires) && expires > Date.now() / 1000;
}

// Call at the top of every admin page and server action.
export async function requireAdmin() {
  if (!(await isAdmin())) redirect('/login');
}
