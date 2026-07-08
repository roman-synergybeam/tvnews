'use client';
import { useState } from 'react';

// ---- Primitive inputs -----------------------------------------------------
export function TextInput({ label, help, value, onChange, textarea, type = 'text' }) {
  return (
    <label className="field">
      <span>
        {label} {help ? <small>— {help}</small> : null}
      </span>
      {textarea ? (
        <textarea value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input type={type} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
      )}
    </label>
  );
}

export function SelectInput({ label, value, options, onChange }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={String(o.value ?? o)} value={o.value ?? o}>
            {o.label ?? String(o)}
          </option>
        ))}
      </select>
    </label>
  );
}

export function CheckboxInput({ label, value, onChange }) {
  return (
    <label className="field" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <input
        type="checkbox"
        checked={!!value}
        onChange={(e) => onChange(e.target.checked)}
        style={{ width: 'auto' }}
      />
      <span style={{ margin: 0 }}>{label}</span>
    </label>
  );
}

// ---- List of strings ------------------------------------------------------
export function ListEditor({ label, help, items, onChange, multiline }) {
  const arr = Array.isArray(items) ? items : [];
  const set = (i, v) => onChange(arr.map((x, idx) => (idx === i ? v : x)));
  const add = () => onChange([...arr, '']);
  const remove = (i) => onChange(arr.filter((_, idx) => idx !== i));
  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    const next = [...arr];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <div className="field">
      <span style={{ display: 'block', fontSize: 13, color: 'var(--muted)', marginBottom: 6, fontWeight: 600 }}>
        {label} {help ? <small>— {help}</small> : null}
      </span>
      {arr.map((it, i) => (
        <div className="list-item-row" key={i}>
          {multiline ? (
            <textarea value={it} onChange={(e) => set(i, e.target.value)} rows={2} />
          ) : (
            <input value={it} onChange={(e) => set(i, e.target.value)} />
          )}
          <div className="mv">
            <button className="btn btn-sm" type="button" onClick={() => move(i, -1)} title="Up">↑</button>
            <button className="btn btn-sm" type="button" onClick={() => move(i, 1)} title="Down">↓</button>
          </div>
          <button className="btn btn-sm btn-danger" type="button" onClick={() => remove(i)}>✕</button>
        </div>
      ))}
      <button className="btn btn-sm" type="button" onClick={add}>+ Add</button>
    </div>
  );
}

// ---- List of objects ------------------------------------------------------
export function ObjListEditor({ label, help, items, itemFields, onChange }) {
  const arr = Array.isArray(items) ? items : [];
  const setItem = (i, key, v) =>
    onChange(arr.map((x, idx) => (idx === i ? { ...x, [key]: v } : x)));
  const add = () => {
    const blank = {};
    itemFields.forEach((f) => (blank[f.key] = ''));
    onChange([...arr, blank]);
  };
  const remove = (i) => onChange(arr.filter((_, idx) => idx !== i));
  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    const next = [...arr];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <div className="field">
      <span style={{ display: 'block', fontSize: 13, color: 'var(--muted)', marginBottom: 6, fontWeight: 600 }}>
        {label} {help ? <small>— {help}</small> : null}
      </span>
      {arr.map((obj, i) => (
        <div className="obj-item" key={i}>
          <div className="row-between" style={{ marginBottom: 8 }}>
            <b style={{ fontSize: 12, color: 'var(--muted)' }}>#{i + 1}</b>
            <div className="row" style={{ gap: 4 }}>
              <button className="btn btn-sm" type="button" onClick={() => move(i, -1)}>↑</button>
              <button className="btn btn-sm" type="button" onClick={() => move(i, 1)}>↓</button>
              <button className="btn btn-sm btn-danger" type="button" onClick={() => remove(i)}>✕</button>
            </div>
          </div>
          {itemFields.map((f) =>
            f.type === 'textarea' ? (
              <TextInput
                key={f.key}
                label={f.label}
                textarea
                value={obj[f.key]}
                onChange={(v) => setItem(i, f.key, v)}
              />
            ) : (
              <TextInput
                key={f.key}
                label={f.label}
                value={obj[f.key]}
                onChange={(v) => setItem(i, f.key, v)}
              />
            )
          )}
        </div>
      ))}
      <button className="btn btn-sm" type="button" onClick={add}>+ Add</button>
    </div>
  );
}

// ---- Image field (URL + upload) ------------------------------------------
export function ImageField({ label, value, onChange }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function upload(file) {
    if (!file) return;
    setBusy(true);
    setErr('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Upload failed');
      onChange(json.url);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="field">
      <span style={{ display: 'block', fontSize: 13, color: 'var(--muted)', marginBottom: 6, fontWeight: 600 }}>
        {label}
      </span>
      <input
        placeholder="https://… or upload below"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="row" style={{ marginTop: 8 }}>
        <label className="btn btn-sm" style={{ cursor: 'pointer' }}>
          {busy ? 'Uploading…' : 'Upload image'}
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => upload(e.target.files?.[0])}
          />
        </label>
        {value ? (
          <button className="btn btn-sm btn-danger" type="button" onClick={() => onChange('')}>
            Remove
          </button>
        ) : null}
      </div>
      {err ? <div className="error">{err}</div> : null}
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={value}
          alt=""
          style={{ marginTop: 10, maxHeight: 120, borderRadius: 8, border: '1px solid var(--border)' }}
        />
      ) : null}
    </div>
  );
}
