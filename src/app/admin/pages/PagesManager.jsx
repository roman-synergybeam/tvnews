'use client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Carousel from '@/components/Carousel.jsx';
import { timeAgo } from '@/lib/format.js';

export default function PagesManager({ initialPages, departments, brands = [], scoped, myDepartment }) {
  const router = useRouter();
  const [pages, setPages] = useState(initialPages);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterBrand, setFilterBrand] = useState('');

  async function createBlank() {
    setBusy(true);
    setError('');
    try {
      const body = { title: 'Untitled page' };
      // Super admins creating while a filter is active land the page there.
      if (!scoped && filterDept) body.department = filterDept;
      if (filterBrand) body.brandId = Number(filterBrand);
      const res = await fetch('/api/admin/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed');
      router.push(`/admin/pages/${json.page.id}`);
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  async function clonePage(id) {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/pages/${id}/clone`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed');
      setPages((p) => [json.page, ...p]);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function deletePage(page) {
    if (!confirm(`Delete "${page.title}"? This cannot be undone.`)) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/pages/${page.id}`, { method: 'DELETE' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Failed');
      setPages((p) => p.filter((x) => x.id !== page.id));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  const visible = useMemo(
    () =>
      pages.filter(
        (p) =>
          (!filterDept || p.department === filterDept) &&
          (!filterBrand || String(p.brand_id) === String(filterBrand))
      ),
    [pages, filterDept, filterBrand]
  );

  return (
    <>
      <div className="admin-topbar">
        <h1>News Pages {scoped ? <span className="muted" style={{ fontSize: 14 }}>· {myDepartment}</span> : null}</h1>
        <div className="row">
          {brands.length ? (
            <select value={filterBrand} onChange={(e) => setFilterBrand(e.target.value)} style={{ width: 150 }}>
              <option value="">All brands</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          ) : null}
          {!scoped && departments.length ? (
            <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} style={{ width: 170 }}>
              <option value="">All departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          ) : null}
          <button className="btn btn-primary" onClick={createBlank} disabled={busy}>
            + New blank page
          </button>
        </div>
      </div>
      <div className="admin-content">
        {error ? <div className="error">{error}</div> : null}
        <p className="muted" style={{ marginTop: 0 }}>
          Build a page from slide layouts, then assign it to TVs. Use <b>Clone</b> to start a new page
          from an existing design.
        </p>

        {visible.length === 0 ? (
          <div className="card-panel">No pages here yet. Create your first one.</div>
        ) : (
          <div className="grid-cards">
            {visible.map((page) => (
              <div className="card-panel" key={page.id}>
                <div className="thumb">
                  <Carousel content={page.content} controlledIndex={0} logoUrl={page.brand_logo || null} />
                </div>
                <div className="row-between">
                  <h3>{page.title}</h3>
                  <span className={`badge ${page.status === 'published' ? 'badge-pub' : 'badge-draft'}`}>
                    {page.status}
                  </span>
                </div>
                <div className="meta">
                  {page.brand_name ? <span className="badge badge-super" style={{ marginRight: 6 }}>{page.brand_name}</span> : null}
                  {page.department ? <span className="badge badge-role" style={{ marginRight: 6 }}>{page.department}</span> : null}
                  {page.content.slides.length} slide{page.content.slides.length === 1 ? '' : 's'} ·{' '}
                  {page.content.theme} · updated {timeAgo(page.updated_at)}
                </div>
                <div className="card-actions">
                  <button className="btn btn-sm btn-accent" onClick={() => router.push(`/admin/pages/${page.id}`)}>
                    Edit
                  </button>
                  <button className="btn btn-sm" onClick={() => clonePage(page.id)} disabled={busy}>
                    Clone
                  </button>
                  <a className="btn btn-sm" href={`/preview/${page.id}`} target="_blank" rel="noreferrer">
                    Preview
                  </a>
                  <button className="btn btn-sm btn-danger" onClick={() => deletePage(page)} disabled={busy}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
