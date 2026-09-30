import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import BrandMark from '@/components/BrandMark';
import { logout } from './actions';

export default async function AdminLayout({ children }) {
  await requireAdmin();
  return (
    <div className="admin">
      <header className="topbar">
        <Link href="/admin" className="brand">
          <BrandMark />
          Tickets
        </Link>
        <form action={logout}>
          <button type="submit" className="link-button">
            Log out
          </button>
        </form>
      </header>
      <main className="admin-main">{children}</main>
    </div>
  );
}
