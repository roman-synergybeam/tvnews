'use client';
import { useState } from 'react';

export default function BrandsManager({ initialBrands }) {
  const [brands, setBrands] = useState(initialBrands);
  const [editing, setEditing] = useState(null); // brand object or {} for new
  const [error, setError] = useState('');

  async function remove(b) {
    if (!confirm(`Delete brand "${b.name}"? Its TVs and pages stay but become unbranded.`)) return;
    setError('');
    const res = await fetch(`/api/admin/brands/${b.id}`, { method: 'DELETE' });
    if (res.ok) setBrands((list) => list.filter((x) => x.id !== b.id));
    else setError('Delete failed');
  }

  return (
    <>
      <div className="admin-topbar">
        <h1>Brands</h1>
        <button className="btn btn-primary" onClick={() => setEditing({})}>+ Add brand</button>
      </div>
      <div className="admin-content">
        {error ? <div className="error">{error}</div> : null}
        <div className="notice">
          Each brand serves its TV screens on its own public hostname (via the Cloudflare tunnel).
          A TV’s display link is built from its brand’s hostname, e.g.{' '}
          <span className="mono">https://news.go4rex.com/tv/&lt;slug&gt;</span>.
        </div>
        <table className="tbl">
          <thead>
            <tr><th>Logo</th><th>Brand</th><th>Public hostname</th><th>TVs</th><th></th></tr>
          </thead>
          <tbody>
            {brands.length === 0 ? (
              <tr><td colSpan={5} className="muted">No brands yet — add Go4Rex and Intermagnum.</td></tr>
            ) : (
              brands.map((b) => (
                <tr key={b.id}>
                  <td>
                    {b.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img className="brand-logo-thumb" src={b.logo_url} alt={`${b.name} logo`} />
                    ) : (
                      <span className="muted">— none —</span>
                    )}
                  </td>
                  <td><b>{b.name}</b> <span className="muted mono">/{b.slug}</span></td>
                  <td className="mono">{b.hostname || <span className="muted">— not set —</span>}</td>
                  <td className="muted">{b.tv_count}</td>
                  <td>
                    <div className="row" style={{ gap: 6 }}>
                      <button className="btn btn-sm" onClick={() => setEditing(b)}>Edit</button>
                      <button className="btn btn-sm btn-danger" onClick={() => remove(b)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editing ? (
        <BrandModal
          brand={editing.id ? editing : null}
          onClose={() => setEditing(null)}
          onSaved={(saved, isNew) => {
            setBrands((list) => (isNew ? [...list, saved] : list.map((x) => (x.id === saved.id ? saved : x))));
            setEditing(null);
          }}
        />
      ) : null}
    </>
  );
}

function BrandModal({ brand, onClose, onSaved }) {
  const [name, setName] = useState(brand?.name || '');
  const [hostname, setHostname] = useState(brand?.hostname || '');
  const [logoUrl, setLogoUrl] = useState(brand?.logo_url || '');
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function uploadLogo(file) {
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Upload failed');
      setLogoUrl(json.url);
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const url = brand ? `/api/admin/brands/${brand.id}` : '/api/admin/brands';
      const method = brand ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, hostname, logoUrl }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed');
      onSaved(json.brand, !brand);
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  return (
    <div className="modal-back" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h2>{brand ? `Edit ${brand.name}` : 'Add brand'}</h2>
        <label className="field">
          <span>Brand name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Go4Rex" required />
        </label>
        <label className="field">
          <span>Public hostname <small>— where this brand’s screens are served</small></span>
          <input value={hostname} onChange={(e) => setHostname(e.target.value)} placeholder="news.go4rex.com" />
        </label>
        <div className="field">
          <span>Logo <small>— shown on this brand’s news screens and here in admin</small></span>
          <div className="row" style={{ alignItems: 'center', gap: 12 }}>
            <div className="brand-logo-preview">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="Brand logo" />
              ) : (
                <span className="muted" style={{ fontSize: 12 }}>No logo</span>
              )}
            </div>
            <div className="row" style={{ gap: 6 }}>
              <label className="btn btn-sm" style={{ cursor: 'pointer' }}>
                {uploading ? 'Uploading…' : logoUrl ? 'Replace' : 'Upload logo'}
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => uploadLogo(e.target.files?.[0])}
                />
              </label>
              {logoUrl ? (
                <button type="button" className="btn btn-sm btn-danger" onClick={() => setLogoUrl('')}>
                  Remove
                </button>
              ) : null}
            </div>
          </div>
        </div>
        {error ? <div className="error">{error}</div> : null}
        <div className="row" style={{ justifyContent: 'flex-end', marginTop: 8 }}>
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
        </div>
      </form>
    </div>
  );
}
