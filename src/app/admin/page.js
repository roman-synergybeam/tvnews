import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth.js';
import { listPages, listTvs, listUsers, departmentFilterFor, isScoped } from '@/lib/store.js';
import { isOnline, timeAgo } from '@/lib/format.js';

export const dynamic = 'force-dynamic';

function showing(t) {
  if (!t.item_count) return <span className="muted">— nothing —</span>;
  const sched = t.scheduled_count > 0 ? <span className="badge badge-role" style={{ marginLeft: 6 }}>scheduled</span> : null;
  if (t.item_count === 1) return <>{t.first_title}{sched}</>;
  return <>{t.item_count} pages rotating {sched}</>;
}

export default async function Dashboard() {
  const user = await getCurrentUser();
  const scopeDept = departmentFilterFor(user, '');
  const pages = listPages({ department: scopeDept });
  const tvs = listTvs({ department: scopeDept });
  const users = isScoped(user) ? [] : listUsers();
  const published = pages.filter((p) => p.status === 'published').length;
  const online = tvs.filter((t) => isOnline(t.last_seen_at)).length;

  return (
    <>
      <div className="admin-topbar">
        <h1>Dashboard {isScoped(user) ? <span className="muted" style={{ fontSize: 14 }}>· {user.department}</span> : null}</h1>
        <div className="row">
          <Link className="btn btn-primary" href="/admin/pages">+ New page</Link>
        </div>
      </div>
      <div className="admin-content">
        <div className="stat-row">
          <div className="stat">
            <div className="n">{pages.length}</div>
            <div className="l">News pages ({published} published)</div>
          </div>
          <div className="stat">
            <div className="n">{tvs.length}</div>
            <div className="l">Registered TVs</div>
          </div>
          <div className="stat">
            <div className="n" style={{ color: online ? 'var(--ok)' : 'var(--muted)' }}>{online}</div>
            <div className="l">TVs online now</div>
          </div>
          {!isScoped(user) ? (
            <div className="stat">
              <div className="n">{users.length}</div>
              <div className="l">Admin accounts</div>
            </div>
          ) : null}
        </div>

        <div className="row-between" style={{ marginBottom: 12 }}>
          <h2 style={{ fontSize: 16, margin: 0 }}>TVs &amp; what they’re showing</h2>
          <Link className="btn btn-sm" href="/admin/tvs">Manage TVs →</Link>
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th>Status</th>
              <th>TV</th>
              <th>Department</th>
              <th>Now showing</th>
              <th>Last seen</th>
            </tr>
          </thead>
          <tbody>
            {tvs.length === 0 ? (
              <tr>
                <td colSpan={5} className="muted">
                  No TVs yet. <Link href="/admin/tvs">Register one →</Link>
                </td>
              </tr>
            ) : (
              tvs.map((t) => (
                <tr key={t.id}>
                  <td>
                    <span className={`dot-live ${isOnline(t.last_seen_at) ? 'on' : ''}`} />{' '}
                    {isOnline(t.last_seen_at) ? 'Online' : 'Offline'}
                  </td>
                  <td>{t.name}</td>
                  <td className="muted">{t.department || '—'}</td>
                  <td>{showing(t)}</td>
                  <td className="muted">{timeAgo(t.last_seen_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
