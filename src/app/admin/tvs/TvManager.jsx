'use client';
import { useEffect, useMemo, useState } from 'react';
import { isOnline, timeAgo } from '@/lib/format.js';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function minToTime(m) {
  if (m === null || m === undefined || m === '') return '';
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}
function timeToMin(t) {
  if (!t) return null;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export default function TvManager({ initialTvs, pages, brands = [], departments, scoped, myDepartment }) {
  const [tvs, setTvs] = useState(initialTvs);
  const [origin, setOrigin] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [manageTv, setManageTv] = useState(null);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [filterDept, setFilterDept] = useState('');
  const [filterBrand, setFilterBrand] = useState('');

  // A TV's public link is built from its brand's hostname when set.
  function tvUrl(tv) {
    if (tv.brand_hostname) return `https://${tv.brand_hostname}/tv/${tv.slug}`;
    return origin ? `${origin}/tv/${tv.slug}` : `/tv/${tv.slug}`;
  }

  async function setBrand(tv, brandId) {
    setError('');
    const res = await fetch(`/api/admin/tvs/${tv.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brandId: brandId ? Number(brandId) : null }),
    });
    const json = await res.json();
    if (res.ok) setTvs((list) => list.map((t) => (t.id === tv.id ? json.tv : t)));
    else setError(json.error || 'Failed');
  }

  useEffect(() => setOrigin(window.location.origin), []);

  async function refresh() {
    try {
      const res = await fetch('/api/admin/tvs', { cache: 'no-store' });
      if (res.ok) setTvs((await res.json()).tvs);
    } catch {}
  }
  useEffect(() => {
    const id = setInterval(refresh, 10000);
    return () => clearInterval(id);
  }, []);

  async function remove(tv) {
    if (!confirm(`Delete TV "${tv.name}"?`)) return;
    const res = await fetch(`/api/admin/tvs/${tv.id}`, { method: 'DELETE' });
    if (res.ok) setTvs((list) => list.filter((t) => t.id !== tv.id));
    else setError('Delete failed');
  }

  function copyLink(tv) {
    navigator.clipboard?.writeText(tvUrl(tv));
    setCopiedId(tv.id);
    setTimeout(() => setCopiedId((c) => (c === tv.id ? null : c)), 1500);
  }

  const visibleTvs = useMemo(
    () =>
      tvs.filter(
        (t) =>
          (!filterDept || t.department === filterDept) &&
          (!filterBrand || String(t.brand_id) === String(filterBrand))
      ),
    [tvs, filterDept, filterBrand]
  );

  function showingLabel(tv) {
    if (!tv.item_count) return <span className="muted">— nothing —</span>;
    const sched = tv.scheduled_count > 0 ? ' · scheduled' : '';
    if (tv.item_count === 1) return <>{tv.first_title}{sched}</>;
    return <>{tv.item_count} pages rotating{sched}</>;
  }

  return (
    <>
      <div className="admin-topbar">
        <h1>TVs {scoped ? <span className="muted" style={{ fontSize: 14 }}>· {myDepartment}</span> : null}</h1>
        <div className="row">
          {brands.length ? (
            <select value={filterBrand} onChange={(e) => setFilterBrand(e.target.value)} style={{ width: 160 }}>
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
          <button className="btn btn-primary" onClick={() => setAddOpen(true)}>+ Register TV</button>
        </div>
      </div>
      <div className="admin-content">
        {error ? <div className="error">{error}</div> : null}
        <div className="notice">
          Open a TV’s display link on the screen. Use <b>Manage</b> to assign one page or a rotating,
          scheduled playlist. Screens update automatically — no need to touch them again.
        </div>

        {visibleTvs.length === 0 ? (
          <div className="card-panel">No TVs here yet.</div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Status</th>
                <th>TV</th>
                <th>Brand</th>
                <th>Department</th>
                <th>Showing</th>
                <th>Display link</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {visibleTvs.map((tv) => (
                <tr key={tv.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <span className={`dot-live ${isOnline(tv.last_seen_at) ? 'on' : ''}`} />{' '}
                    {isOnline(tv.last_seen_at) ? 'Online' : <span className="muted">Offline</span>}
                    <div className="muted" style={{ fontSize: 11 }}>{timeAgo(tv.last_seen_at)}</div>
                  </td>
                  <td><b>{tv.name}</b></td>
                  <td>
                    {brands.length ? (
                      <div className="row" style={{ gap: 8, alignItems: 'center' }}>
                        {tv.brand_logo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img className="brand-logo-thumb" src={tv.brand_logo} alt={`${tv.brand_name} logo`} />
                        ) : null}
                        <select
                          value={tv.brand_id || ''}
                          onChange={(e) => setBrand(tv, e.target.value)}
                          style={{ minWidth: 130 }}
                        >
                          <option value="">— none —</option>
                          {brands.map((b) => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                  <td className="muted">{tv.department || '—'}</td>
                  <td>{showingLabel(tv)}</td>
                  <td>
                    <div className="copy-field">
                      <input readOnly className="mono" value={tvUrl(tv)} />
                      <button className="btn btn-sm" onClick={() => copyLink(tv)}>
                        {copiedId === tv.id ? 'Copied!' : 'Copy'}
                      </button>
                      <a className="btn btn-sm" href={`/tv/${tv.slug}`} target="_blank" rel="noreferrer">Open</a>
                    </div>
                    {!tv.brand_hostname && tv.brand_id ? (
                      <div className="muted" style={{ fontSize: 11, marginTop: 3 }}>
                        Set this brand’s hostname in Brands for a public link.
                      </div>
                    ) : null}
                  </td>
                  <td>
                    <div className="row" style={{ gap: 6 }}>
                      <button className="btn btn-sm btn-accent" onClick={() => setManageTv(tv)}>Manage</button>
                      <button className="btn btn-sm btn-danger" onClick={() => remove(tv)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {addOpen ? (
        <AddTvModal
          pages={pages}
          brands={brands}
          scoped={scoped}
          myDepartment={myDepartment}
          departments={departments}
          onClose={() => setAddOpen(false)}
          onCreated={(tv) => {
            setTvs((list) => [...list, tv]);
            setAddOpen(false);
          }}
        />
      ) : null}

      {manageTv ? (
        <PlaylistModal
          tv={manageTv}
          pages={pages}
          onClose={() => setManageTv(null)}
          onSaved={() => {
            setManageTv(null);
            refresh();
          }}
        />
      ) : null}
    </>
  );
}

// ---- Add TV ---------------------------------------------------------------
function AddTvModal({ pages, brands = [], scoped, myDepartment, departments, onClose, onCreated }) {
  const [name, setName] = useState('');
  const [department, setDepartment] = useState(scoped ? myDepartment : '');
  const [brandId, setBrandId] = useState(brands[0]?.id ? String(brands[0].id) : '');
  const [pageId, setPageId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/admin/tvs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, department, brandId: brandId || null, pageId: pageId || null }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed');
      onCreated(json.tv);
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  return (
    <div className="modal-back" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h2>Register a TV</h2>
        <label className="field">
          <span>Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Sales Floor 1" required />
        </label>
        {brands.length ? (
          <label className="field">
            <span>Brand <small>— determines the screen’s public domain</small></span>
            <select value={brandId} onChange={(e) => setBrandId(e.target.value)}>
              <option value="">— none —</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </label>
        ) : null}
        <label className="field">
          <span>Department</span>
          {scoped ? (
            <input value={myDepartment} disabled />
          ) : (
            <input
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="Sales"
              list="dept-list"
            />
          )}
          <datalist id="dept-list">
            {departments.map((d) => (
              <option key={d} value={d} />
            ))}
          </datalist>
        </label>
        <label className="field">
          <span>Assign a page now (optional)</span>
          <select value={pageId} onChange={(e) => setPageId(e.target.value)}>
            <option value="">— nothing —</option>
            {pages.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title} {p.status !== 'published' ? '(draft)' : ''}
              </option>
            ))}
          </select>
        </label>
        {error ? <div className="error">{error}</div> : null}
        <div className="row" style={{ justifyContent: 'flex-end', marginTop: 8 }}>
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Creating…' : 'Register TV'}</button>
        </div>
      </form>
    </div>
  );
}

// ---- Playlist & schedule --------------------------------------------------
function PlaylistModal({ tv, pages, onClose, onSaved }) {
  const [items, setItems] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/admin/tvs/${tv.id}/playlist`, { cache: 'no-store' });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load');
        setItems(
          json.playlist.map((p) => ({
            pageId: p.page_id,
            dwellSec: p.dwell_sec,
            days: p.days,
            startMin: p.start_min,
            endMin: p.end_min,
          }))
        );
      } catch (e) {
        setError(e.message);
        setItems([]);
      }
    })();
  }, [tv.id]);

  const setItem = (i, patch) => setItems((arr) => arr.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  const add = () =>
    setItems((arr) => [
      ...arr,
      { pageId: pages[0]?.id || '', dwellSec: 60, days: '', startMin: null, endMin: null },
    ]);
  const removeItem = (i) => setItems((arr) => arr.filter((_, idx) => idx !== i));
  const move = (i, dir) =>
    setItems((arr) => {
      const j = i + dir;
      if (j < 0 || j >= arr.length) return arr;
      const next = [...arr];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  const toggleDay = (i, day) =>
    setItems((arr) =>
      arr.map((x, idx) => {
        if (idx !== i) return x;
        const set = new Set(x.days ? x.days.split(',').map(Number) : []);
        set.has(day) ? set.delete(day) : set.add(day);
        return { ...x, days: [...set].sort((a, b) => a - b).join(',') };
      })
    );

  async function save() {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/tvs/${tv.id}/playlist`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Save failed');
      onSaved();
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 620 }} onClick={(e) => e.stopPropagation()}>
        <h2>Playlist — {tv.name}</h2>
        <p className="muted" style={{ marginTop: -8, fontSize: 13 }}>
          Multiple pages rotate in order, each for its dwell time. Add a schedule to only show a page on
          certain days/times. Leave the schedule blank for “always”.
        </p>
        {error ? <div className="error">{error}</div> : null}
        {items === null ? (
          <p className="muted">Loading…</p>
        ) : items.length === 0 ? (
          <p className="muted">No pages yet — add one below.</p>
        ) : (
          items.map((it, i) => (
            <div className="obj-item" key={i}>
              <div className="row-between" style={{ marginBottom: 10 }}>
                <b style={{ fontSize: 12, color: 'var(--muted)' }}>#{i + 1}</b>
                <div className="row" style={{ gap: 4 }}>
                  <button className="btn btn-sm" onClick={() => move(i, -1)}>↑</button>
                  <button className="btn btn-sm" onClick={() => move(i, 1)}>↓</button>
                  <button className="btn btn-sm btn-danger" onClick={() => removeItem(i)}>✕</button>
                </div>
              </div>
              <div className="row" style={{ gap: 10, alignItems: 'flex-end' }}>
                <label className="field" style={{ flex: 1, marginBottom: 0 }}>
                  <span>Page</span>
                  <select value={it.pageId} onChange={(e) => setItem(i, { pageId: Number(e.target.value) })}>
                    {pages.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} {p.status !== 'published' ? '(draft)' : ''}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field" style={{ width: 130, marginBottom: 0 }}>
                  <span>Show for (sec)</span>
                  <input
                    type="number"
                    min={5}
                    value={it.dwellSec}
                    onChange={(e) => setItem(i, { dwellSec: Number(e.target.value) })}
                  />
                </label>
              </div>
              <div style={{ marginTop: 10 }}>
                <span className="muted" style={{ fontSize: 12, fontWeight: 600 }}>Schedule (optional)</span>
                <div className="row" style={{ gap: 4, margin: '6px 0' }}>
                  {DAY_LABELS.map((d, day) => {
                    const on = it.days ? it.days.split(',').map(Number).includes(day) : false;
                    return (
                      <button
                        key={day}
                        type="button"
                        className={`btn btn-sm ${on ? 'btn-accent' : ''}`}
                        onClick={() => toggleDay(i, day)}
                        style={{ padding: '5px 8px' }}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
                <div className="row" style={{ gap: 10 }}>
                  <label style={{ fontSize: 12, color: 'var(--muted)' }}>
                    From{' '}
                    <input
                      type="time"
                      style={{ width: 120, display: 'inline-block' }}
                      value={minToTime(it.startMin)}
                      onChange={(e) => setItem(i, { startMin: timeToMin(e.target.value) })}
                    />
                  </label>
                  <label style={{ fontSize: 12, color: 'var(--muted)' }}>
                    to{' '}
                    <input
                      type="time"
                      style={{ width: 120, display: 'inline-block' }}
                      value={minToTime(it.endMin)}
                      onChange={(e) => setItem(i, { endMin: timeToMin(e.target.value) })}
                    />
                  </label>
                </div>
                <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>
                  {scheduleSummary(it)}
                </div>
              </div>
            </div>
          ))
        )}

        <button className="btn btn-sm" style={{ marginTop: 6 }} onClick={add} disabled={!pages.length}>
          + Add page
        </button>
        {!pages.length ? <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>No pages available to add.</div> : null}

        <div className="row" style={{ justifyContent: 'flex-end', marginTop: 16 }}>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={busy || items === null}>
            {busy ? 'Saving…' : 'Save playlist'}
          </button>
        </div>
      </div>
    </div>
  );
}

function scheduleSummary(it) {
  const parts = [];
  if (it.days) {
    parts.push(it.days.split(',').map((d) => DAY_LABELS[Number(d)]).join(', '));
  }
  if (it.startMin !== null || it.endMin !== null) {
    parts.push(`${minToTime(it.startMin) || '00:00'}–${minToTime(it.endMin) || '24:00'}`);
  }
  return parts.length ? `Active: ${parts.join(' · ')}` : 'Active: always';
}
