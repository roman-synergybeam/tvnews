'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Carousel from '@/components/Carousel.jsx';
import {
  SLIDE_TYPES,
  SLIDE_TYPE_KEYS,
  THEMES,
  THEME_KEYS,
  makeSlide,
  makeId,
} from '@/lib/slideModel.js';
import {
  TextInput,
  SelectInput,
  CheckboxInput,
  ListEditor,
  ObjListEditor,
  ImageField,
} from './Fields.jsx';

export default function PageEditor({ initialPage, departments = [], brands = [], scoped = false, myDepartment = '' }) {
  const router = useRouter();
  const [title, setTitle] = useState(initialPage.title);
  const [status, setStatus] = useState(initialPage.status);
  const [department, setDepartment] = useState(initialPage.department || '');
  const [brandId, setBrandId] = useState(initialPage.brand_id ? String(initialPage.brand_id) : '');
  const [content, setContent] = useState(initialPage.content);
  const [selected, setSelected] = useState('settings'); // 'settings' | slide id
  const [autoplay, setAutoplay] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [dragId, setDragId] = useState(null);
  const [overId, setOverId] = useState(null);

  // Dirty tracking against the last saved snapshot.
  const snapshot = useRef(
    JSON.stringify({ title: initialPage.title, status: initialPage.status, department: initialPage.department || '', brandId: initialPage.brand_id ? String(initialPage.brand_id) : '', content: initialPage.content })
  );
  const current = JSON.stringify({ title, status, department, brandId, content });
  const dirty = current !== snapshot.current;

  useEffect(() => {
    const handler = (e) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const save = useCallback(async () => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/pages/${initialPage.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, status, department, brandId: brandId || null, content }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Save failed');
      snapshot.current = JSON.stringify({ title, status, department, brandId, content });
      // trigger re-render of the dirty flag
      setContent((c) => ({ ...c }));
      router.refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }, [initialPage.id, title, status, department, brandId, content, router]);

  // Ctrl/Cmd+S to save
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (dirty && !saving) save();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dirty, saving, save]);

  // ---- content mutators ---------------------------------------------------
  const patch = (p) => setContent((c) => ({ ...c, ...p }));
  const patchSlide = (id, dataPatch) =>
    setContent((c) => ({
      ...c,
      slides: c.slides.map((s) => (s.id === id ? { ...s, data: { ...s.data, ...dataPatch } } : s)),
    }));

  const addSlide = (type) => {
    const s = makeSlide(type);
    setContent((c) => ({ ...c, slides: [...c.slides, s] }));
    setSelected(s.id);
    setPickerOpen(false);
  };
  const dupSlide = (id) =>
    setContent((c) => {
      const idx = c.slides.findIndex((s) => s.id === id);
      if (idx < 0) return c;
      const copy = { id: makeId('slide'), type: c.slides[idx].type, data: JSON.parse(JSON.stringify(c.slides[idx].data)) };
      const arr = [...c.slides];
      arr.splice(idx + 1, 0, copy);
      return { ...c, slides: arr };
    });
  const moveSlide = (id, dir) =>
    setContent((c) => {
      const idx = c.slides.findIndex((s) => s.id === id);
      const j = idx + dir;
      if (idx < 0 || j < 0 || j >= c.slides.length) return c;
      const arr = [...c.slides];
      [arr[idx], arr[j]] = [arr[j], arr[idx]];
      return { ...c, slides: arr };
    });
  const delSlide = (id) => {
    setContent((c) => (c.slides.length <= 1 ? c : { ...c, slides: c.slides.filter((s) => s.id !== id) }));
    if (selected === id) setSelected('settings');
  };

  // Drag-to-reorder: drop `fromId` onto `toId`, taking its place.
  const reorder = (fromId, toId) => {
    if (!fromId || fromId === toId) return;
    setContent((c) => {
      const from = c.slides.findIndex((s) => s.id === fromId);
      const to = c.slides.findIndex((s) => s.id === toId);
      if (from < 0 || to < 0) return c;
      const arr = [...c.slides];
      const [moved] = arr.splice(from, 1);
      arr.splice(to, 0, moved);
      return { ...c, slides: arr };
    });
  };
  const onDrop = (targetId) => {
    reorder(dragId, targetId);
    setDragId(null);
    setOverId(null);
  };

  const selectedSlide = content.slides.find((s) => s.id === selected) || null;
  const previewIndex = useMemo(() => {
    if (autoplay) return null;
    const i = content.slides.findIndex((s) => s.id === selected);
    return i >= 0 ? i : 0;
  }, [autoplay, selected, content.slides]);

  return (
    <>
      <div className="admin-topbar">
        <div className="row" style={{ gap: 12 }}>
          <button className="btn btn-sm" onClick={() => (dirty ? confirm('Discard unsaved changes?') && router.push('/admin/pages') : router.push('/admin/pages'))}>
            ← Pages
          </button>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ width: 320, fontWeight: 700 }}
          />
        </div>
        <div className="row" style={{ gap: 10 }}>
          {error ? <span className="error" style={{ margin: 0 }}>{error}</span> : null}
          <span className="muted" style={{ fontSize: 13 }}>
            {dirty ? '● Unsaved' : 'All changes saved'}
          </span>
          <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ width: 130 }}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
          <a className="btn btn-sm" href={`/preview/${initialPage.id}`} target="_blank" rel="noreferrer">
            Full preview
          </a>
          <button className="btn btn-primary" onClick={save} disabled={saving || !dirty}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      <div className="editor-layout">
        {/* --- Left: slide list --- */}
        <div className="editor-list">
          <div
            className={`slide-chip ${selected === 'settings' ? 'active' : ''}`}
            onClick={() => setSelected('settings')}
          >
            <div className="ic">⚙</div>
            <div className="t">
              <b>Page settings</b>
              <small>Brand, theme, ticker, popups</small>
            </div>
          </div>

          <div className="muted" style={{ fontSize: 12, margin: '14px 4px 8px', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Slides ({content.slides.length})
          </div>

          {content.slides.map((s, i) => {
            const def = SLIDE_TYPES[s.type];
            const heading = s.data.title || s.data.heading || s.data.leftHeading || def.label;
            return (
              <div
                key={s.id}
                className={`slide-chip ${selected === s.id ? 'active' : ''} ${
                  overId === s.id && dragId !== s.id ? 'drop-target' : ''
                } ${dragId === s.id ? 'dragging' : ''}`}
                onClick={() => setSelected(s.id)}
                draggable
                onDragStart={(e) => {
                  setDragId(s.id);
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (overId !== s.id) setOverId(s.id);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  onDrop(s.id);
                }}
                onDragEnd={() => {
                  setDragId(null);
                  setOverId(null);
                }}
              >
                <div className="drag-handle" title="Drag to reorder">⠿</div>
                <div className="ic">{def.icon}</div>
                <div className="t">
                  <b style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {i + 1}. {stripAccent(heading)}
                  </b>
                  <small>{def.label}</small>
                </div>
                <div className="mv" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => moveSlide(s.id, -1)} title="Move up">↑</button>
                  <button onClick={() => moveSlide(s.id, 1)} title="Move down">↓</button>
                </div>
                <div className="mv" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => dupSlide(s.id)} title="Duplicate">⧉</button>
                  <button onClick={() => delSlide(s.id)} title="Delete" style={{ color: 'var(--danger)' }}>✕</button>
                </div>
              </div>
            );
          })}

          <button className="btn" style={{ width: '100%', justifyContent: 'center', marginTop: 10 }} onClick={() => setPickerOpen(true)}>
            + Add slide
          </button>
        </div>

        {/* --- Middle: form --- */}
        <div className="editor-form">
          {selected === 'settings' ? (
            <PageSettingsForm
              content={content}
              patch={patch}
              department={department}
              setDepartment={setDepartment}
              departments={departments}
              brandId={brandId}
              setBrandId={setBrandId}
              brands={brands}
              scoped={scoped}
              myDepartment={myDepartment}
            />
          ) : selectedSlide ? (
            <SlideForm slide={selectedSlide} onField={(k, v) => patchSlide(selectedSlide.id, { [k]: v })} />
          ) : (
            <p className="muted">Select a slide.</p>
          )}
        </div>

        {/* --- Right: live preview --- */}
        <div className="editor-preview">
          <div className="row-between">
            <b style={{ fontSize: 13 }}>Live preview</b>
            <label className="row" style={{ gap: 6, fontSize: 13 }}>
              <input type="checkbox" checked={autoplay} onChange={(e) => setAutoplay(e.target.checked)} style={{ width: 'auto' }} />
              Auto-play
            </label>
          </div>
          <div className="preview-stage">
            <Carousel
              content={content}
              controlledIndex={previewIndex}
              logoUrl={brands.find((b) => String(b.id) === String(brandId))?.logo_url || null}
            />
          </div>
          <div className="muted" style={{ fontSize: 12 }}>
            Tip: wrap words in *asterisks* to highlight them in the theme accent color.
          </div>
        </div>
      </div>

      {pickerOpen ? (
        <div className="modal-back" onClick={() => setPickerOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Add a slide</h2>
            <div className="type-grid">
              {SLIDE_TYPE_KEYS.map((k) => (
                <button key={k} className="btn" onClick={() => addSlide(k)}>
                  <b>
                    {SLIDE_TYPES[k].icon} {SLIDE_TYPES[k].label}
                  </b>
                  <small>{SLIDE_TYPES[k].hint}</small>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

// Renders a slide's auto-generated form from its type's field descriptors.
function SlideForm({ slide, onField }) {
  const def = SLIDE_TYPES[slide.type];
  const d = slide.data || {};
  return (
    <div>
      <div className="row-between" style={{ marginBottom: 14 }}>
        <h2 style={{ fontSize: 16, margin: 0 }}>
          {def.icon} {def.label}
        </h2>
        <span className="muted" style={{ fontSize: 12 }}>{def.hint}</span>
      </div>
      {def.fields.map((f) => {
        const value = d[f.key];
        const set = (v) => onField(f.key, v);
        switch (f.type) {
          case 'textarea':
            return <TextInput key={f.key} label={f.label} textarea value={value} onChange={set} />;
          case 'select':
            return (
              <SelectInput
                key={f.key}
                label={f.label}
                value={value}
                options={f.options.map((o) => ({ value: o, label: String(o) }))}
                onChange={(v) => set(f.key === 'columns' ? Number(v) : v)}
              />
            );
          case 'list':
            return <ListEditor key={f.key} label={f.label} items={value} onChange={set} multiline />;
          case 'objlist':
            return (
              <ObjListEditor key={f.key} label={f.label} items={value} itemFields={f.item} onChange={set} />
            );
          case 'image':
            return <ImageField key={f.key} label={f.label} value={value} onChange={set} />;
          default:
            return <TextInput key={f.key} label={f.label} value={value} onChange={set} />;
        }
      })}
    </div>
  );
}

function PageSettingsForm({ content, patch, department, setDepartment, departments, brandId, setBrandId, brands = [], scoped, myDepartment }) {
  return (
    <div>
      <h2 style={{ fontSize: 16, marginTop: 0, marginBottom: 14 }}>Page settings</h2>
      {brands.length ? (
        <label className="field">
          <span>Brand <small>— which brand this page belongs to (optional; blank = shared)</small></span>
          <select value={brandId} onChange={(e) => setBrandId(e.target.value)}>
            <option value="">— shared / none —</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </label>
      ) : null}
      <label className="field">
        <span>Department {scoped ? <small>— locked to your department</small> : <small>— controls who can edit it</small>}</span>
        {scoped ? (
          <input value={myDepartment} disabled />
        ) : (
          <>
            <input
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="(none — visible to all)"
              list="page-dept-list"
            />
            <datalist id="page-dept-list">
              {departments.map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
          </>
        )}
      </label>
      <TextInput label="Brand / channel name" value={content.brand} onChange={(v) => patch({ brand: v })} />
      <TextInput
        label="Event label (top-right pill)"
        help="optional"
        value={content.eventLabel}
        onChange={(v) => patch({ eventLabel: v })}
      />
      <SelectInput
        label="Theme"
        value={content.theme}
        options={THEME_KEYS.map((k) => ({ value: k, label: THEMES[k].label }))}
        onChange={(v) => patch({ theme: v })}
      />
      <SelectInput
        label="Screen format"
        value={content.format}
        options={[
          { value: '4k', label: '4K — 3840×2160 (default)' },
          { value: '1080', label: '1080p — 1920×1080' },
        ]}
        onChange={(v) => patch({ format: v })}
      />
      <p className="muted" style={{ fontSize: 12, marginTop: -6 }}>
        Both fill any screen; 4K renders at higher resolution for 4K TVs (heavier), 1080p is lighter.
      </p>
      <TextInput
        label="Seconds per slide"
        type="number"
        value={content.durationSec}
        onChange={(v) => patch({ durationSec: Math.max(2, Number(v) || 10) })}
      />
      <CheckboxInput label="Show live clock" value={content.showClock} onChange={(v) => patch({ showClock: v })} />
      <ListEditor
        label="Ticker messages"
        help="scrolling bar at the bottom"
        items={content.ticker}
        onChange={(v) => patch({ ticker: v })}
        multiline
      />
      <ObjListEditor
        label="Popups"
        help="rotate in the corner"
        items={content.popups}
        itemFields={[
          { key: 'tag', label: 'Tag' },
          { key: 'title', label: 'Title' },
          { key: 'text', label: 'Text', type: 'textarea' },
        ]}
        onChange={(v) => patch({ popups: v })}
      />
    </div>
  );
}

function stripAccent(s) {
  return String(s || '').replace(/\*/g, '');
}
