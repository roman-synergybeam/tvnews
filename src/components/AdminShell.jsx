'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: '▚', exact: true },
  { href: '/admin/pages', label: 'News Pages', icon: '▤' },
  { href: '/admin/tvs', label: 'TVs', icon: '▢' },
  { href: '/admin/brands', label: 'Brands', icon: '◈', super: true },
  { href: '/admin/admins', label: 'Admins', icon: '◐', super: true },
];

export default function AdminShell({ user, children }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
    router.refresh();
  }

  const isActive = (item) =>
    item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + '/');

  return (
    <div className="admin-shell">
      <aside className="admin-side">
        <div className="admin-logo">
          News <span>Control</span>
        </div>
        <nav className="admin-nav">
          {NAV.filter((n) => !n.super || user.role === 'super_admin').map((n) => (
            <Link key={n.href} href={n.href} className={isActive(n) ? 'active' : ''}>
              <span aria-hidden>{n.icon}</span>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="admin-side-foot">
          <div style={{ marginBottom: 4, color: 'var(--text)', fontWeight: 600 }}>
            {user.name || user.email}
          </div>
          <div style={{ marginBottom: 10 }}>
            {user.role === 'super_admin' ? 'Super admin' : 'Editor'}
          </div>
          <button className="btn btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={logout}>
            Sign out
          </button>
        </div>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}
