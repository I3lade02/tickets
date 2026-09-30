import { redirect } from 'next/navigation';
import { isAdmin, isConfigured } from '@/lib/auth';
import BrandMark from '@/components/BrandMark';
import { login } from './actions';

export const metadata = { title: 'Log in' };

export default async function LoginPage({ searchParams }) {
  if (await isAdmin()) redirect('/admin');
  const sp = await searchParams;
  const configured = isConfigured();

  return (
    <main className="login">
      <form action={login} className="login-card">
        <h1>
          <BrandMark />
          Tickets
        </h1>
        {!configured ? (
          <p className="form-error" role="alert">
            Set ADMIN_PASSWORD and SESSION_SECRET (16+ characters) in your Vercel project, then
            redeploy.
          </p>
        ) : null}
        {sp.error ? (
          <p className="form-error" role="alert">
            That password isn&rsquo;t right.
          </p>
        ) : null}
        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            autoFocus
          />
        </div>
        <button type="submit" className="btn btn-primary">
          Log in
        </button>
      </form>
    </main>
  );
}
