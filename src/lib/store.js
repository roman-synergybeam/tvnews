import { db, nowIso } from './db.js';
import { hashPassword } from './password.js';
import { normalizeContent, newPageContent } from './slideModel.js';

// --------------------------------------------------------------------------
// Slug helpers
// --------------------------------------------------------------------------
export function slugify(input, fallback = 'item') {
  const base = String(input || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return base || fallback;
}

function uniqueSlug(table, desired, fallback) {
  let slug = slugify(desired, fallback);
  let candidate = slug;
  let n = 2;
  const stmt = db.prepare(`SELECT 1 FROM ${table} WHERE slug = ?`);
  while (stmt.get(candidate)) {
    candidate = `${slug}-${n++}`;
  }
  return candidate;
}

// --------------------------------------------------------------------------
// Pages
// --------------------------------------------------------------------------
function rowToPage(row) {
  if (!row) return null;
  let content;
  try {
    content = normalizeContent(JSON.parse(row.content));
  } catch {
    content = newPageContent();
  }
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    status: row.status,
    department: row.department || '',
    brand_id: row.brand_id || null,
    brand_name: row.brand_name || null,
    brand_hostname: row.brand_hostname || null,
    brand_logo: row.brand_logo || null,
    version: row.version,
    content,
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
    author: row.author || null,
  };
}

const PAGE_SELECT = `
  SELECT p.*, u.name AS author, b.name AS brand_name, b.hostname AS brand_hostname,
    b.logo_url AS brand_logo
  FROM pages p
  LEFT JOIN users u ON u.id = p.created_by
  LEFT JOIN brands b ON b.id = p.brand_id
`;

// listPages({ department, brandId }) — omitted filters list everything.
export function listPages({ department, brandId } = {}) {
  const where = [];
  const args = [];
  if (department) { where.push('p.department = ?'); args.push(department); }
  if (brandId) { where.push('p.brand_id = ?'); args.push(brandId); }
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  return db.prepare(`${PAGE_SELECT} ${clause} ORDER BY p.updated_at DESC`).all(...args).map(rowToPage);
}

export function getPage(id) {
  return rowToPage(db.prepare(`${PAGE_SELECT} WHERE p.id = ?`).get(id));
}

export function getPageBySlug(slug) {
  return rowToPage(db.prepare(`${PAGE_SELECT} WHERE p.slug = ?`).get(slug));
}

export function createPage({ title, content, status = 'draft', department = '', brandId = null, userId = null }) {
  const now = nowIso();
  const safeContent = normalizeContent(content);
  const slug = uniqueSlug('pages', title, 'page');
  const info = db
    .prepare(
      `INSERT INTO pages (title, slug, status, department, brand_id, content, version, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`
    )
    .run(title || 'Untitled page', slug, status, department || '', brandId || null, JSON.stringify(safeContent), userId, now, now);
  return getPage(info.lastInsertRowid);
}

export function updatePage(id, { title, content, status, department, brandId }) {
  const existing = getPage(id);
  if (!existing) return null;
  const now = nowIso();
  const newContent = content ? normalizeContent(content) : existing.content;
  db.prepare(
    `UPDATE pages SET title = ?, status = ?, department = ?, brand_id = ?, content = ?, version = version + 1, updated_at = ?
     WHERE id = ?`
  ).run(
    title ?? existing.title,
    status ?? existing.status,
    department === undefined ? existing.department : department || '',
    brandId === undefined ? existing.brand_id : brandId || null,
    JSON.stringify(newContent),
    now,
    id
  );
  return getPage(id);
}

export function deletePage(id) {
  return db.prepare('DELETE FROM pages WHERE id = ?').run(id).changes > 0;
}

export function clonePage(id, userId = null) {
  const src = getPage(id);
  if (!src) return null;
  const now = nowIso();
  const title = `${src.title} (copy)`;
  const slug = uniqueSlug('pages', title, 'page');
  const info = db
    .prepare(
      `INSERT INTO pages (title, slug, status, department, brand_id, content, version, created_by, created_at, updated_at)
       VALUES (?, ?, 'draft', ?, ?, ?, 1, ?, ?, ?)`
    )
    .run(title, slug, src.department || '', src.brand_id || null, JSON.stringify(src.content), userId, now, now);
  return getPage(info.lastInsertRowid);
}

// --------------------------------------------------------------------------
// TVs
// --------------------------------------------------------------------------
function rowToTv(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    department: row.department,
    slug: row.slug,
    brand_id: row.brand_id || null,
    brand_name: row.brand_name || null,
    brand_hostname: row.brand_hostname || null,
    brand_logo: row.brand_logo || null,
    item_count: row.item_count ?? 0,
    scheduled_count: row.scheduled_count ?? 0,
    first_title: row.first_title || null,
    last_seen_at: row.last_seen_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

const TV_SELECT = `
  SELECT t.*, b.name AS brand_name, b.hostname AS brand_hostname, b.logo_url AS brand_logo,
    (SELECT COUNT(*) FROM tv_pages tp WHERE tp.tv_id = t.id) AS item_count,
    (SELECT COUNT(*) FROM tv_pages tp WHERE tp.tv_id = t.id
       AND (tp.days <> '' OR tp.start_min IS NOT NULL OR tp.end_min IS NOT NULL)) AS scheduled_count,
    (SELECT p.title FROM tv_pages tp JOIN pages p ON p.id = tp.page_id
       WHERE tp.tv_id = t.id ORDER BY tp.position LIMIT 1) AS first_title
  FROM tvs t LEFT JOIN brands b ON b.id = t.brand_id
`;

export function listTvs({ department, brandId } = {}) {
  const where = [];
  const args = [];
  if (department) { where.push('t.department = ?'); args.push(department); }
  if (brandId) { where.push('t.brand_id = ?'); args.push(brandId); }
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  return db.prepare(`${TV_SELECT} ${clause} ORDER BY t.department, t.name`).all(...args).map(rowToTv);
}

export function getTv(id) {
  return rowToTv(db.prepare(`${TV_SELECT} WHERE t.id = ?`).get(id));
}

export function getTvBySlug(slug) {
  return rowToTv(db.prepare(`${TV_SELECT} WHERE t.slug = ?`).get(slug));
}

export function createTv({ name, department = '', brandId = null, pageId = null }) {
  const now = nowIso();
  const slug = uniqueSlug('tvs', name, 'tv');
  const info = db
    .prepare(
      `INSERT INTO tvs (name, department, brand_id, slug, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(name || 'New TV', department || '', brandId || null, slug, now, now);
  const tvId = info.lastInsertRowid;
  if (pageId) {
    db.prepare(
      `INSERT INTO tv_pages (tv_id, page_id, position, dwell_sec, days) VALUES (?, ?, 0, 60, '')`
    ).run(tvId, Number(pageId));
  }
  return getTv(tvId);
}

export function updateTv(id, { name, department, brandId }) {
  const existing = getTv(id);
  if (!existing) return null;
  db.prepare(`UPDATE tvs SET name = ?, department = ?, brand_id = ?, updated_at = ? WHERE id = ?`).run(
    name ?? existing.name,
    department === undefined ? existing.department : department || '',
    brandId === undefined ? existing.brand_id : brandId || null,
    nowIso(),
    id
  );
  return getTv(id);
}

export function deleteTv(id) {
  return db.prepare('DELETE FROM tvs WHERE id = ?').run(id).changes > 0;
}

export function touchTv(id) {
  db.prepare('UPDATE tvs SET last_seen_at = ? WHERE id = ?').run(nowIso(), id);
}

// --------------------------------------------------------------------------
// Brands (tenants) — each serves its TVs on its own public hostname
// --------------------------------------------------------------------------
function rowToBrand(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    hostname: row.hostname || '',
    logo_url: row.logo_url || '',
    turnstile_site_key: row.turnstile_site_key || '', // public; safe to expose to the client
    tv_count: row.tv_count ?? 0,
    created_at: row.created_at,
  };
}

// Server-only: fetch a brand's Turnstile keys by request hostname. The secret
// key is intentionally NOT part of rowToBrand so it never reaches the client.
export function getBrandTurnstile(hostname) {
  const h = String(hostname || '').split(':')[0].trim().toLowerCase();
  if (!h) return null;
  const row = db
    .prepare('SELECT turnstile_site_key, turnstile_secret_key FROM brands WHERE hostname = ?')
    .get(h);
  if (!row) return null;
  return { siteKey: row.turnstile_site_key || '', secretKey: row.turnstile_secret_key || '' };
}

const BRAND_SELECT = `
  SELECT b.*, (SELECT COUNT(*) FROM tvs t WHERE t.brand_id = b.id) AS tv_count
  FROM brands b
`;

export function listBrands() {
  return db.prepare(`${BRAND_SELECT} ORDER BY b.name`).all().map(rowToBrand);
}

export function getBrand(id) {
  return rowToBrand(db.prepare(`${BRAND_SELECT} WHERE b.id = ?`).get(id));
}

// Resolve a brand from a request hostname (e.g. "news.go4rex.com"). Case/port
// insensitive. Used to serve each brand's news at its own domain root.
export function getBrandByHostname(hostname) {
  const h = String(hostname || '').split(':')[0].trim().toLowerCase();
  if (!h) return null;
  return rowToBrand(db.prepare(`${BRAND_SELECT} WHERE b.hostname = ?`).get(h));
}

export function createBrand({ name, hostname = '', logoUrl = '' }) {
  const now = nowIso();
  const slug = uniqueSlug('brands', name, 'brand');
  const info = db
    .prepare(`INSERT INTO brands (name, slug, hostname, logo_url, created_at) VALUES (?, ?, ?, ?, ?)`)
    .run(name || 'Brand', slug, (hostname || '').trim().toLowerCase(), (logoUrl || '').trim(), now);
  return getBrand(info.lastInsertRowid);
}

export function updateBrand(id, { name, hostname, logoUrl }) {
  const existing = getBrand(id);
  if (!existing) return null;
  db.prepare(`UPDATE brands SET name = ?, hostname = ?, logo_url = ? WHERE id = ?`).run(
    name ?? existing.name,
    hostname === undefined ? existing.hostname : (hostname || '').trim().toLowerCase(),
    logoUrl === undefined ? existing.logo_url : (logoUrl || '').trim(),
    id
  );
  return getBrand(id);
}

export function deleteBrand(id) {
  // TVs/pages keep their rows; brand_id is cleared by the app layer on read (FK not enforced here).
  db.prepare('UPDATE tvs SET brand_id = NULL WHERE brand_id = ?').run(id);
  db.prepare('UPDATE pages SET brand_id = NULL WHERE brand_id = ?').run(id);
  return db.prepare('DELETE FROM brands WHERE id = ?').run(id).changes > 0;
}

// --------------------------------------------------------------------------
// TV playlists (scheduled / rotating pages)
// --------------------------------------------------------------------------
function toMin(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.max(0, Math.min(1439, n)) : null;
}

function cleanDays(v) {
  const arr = String(v || '')
    .split(',')
    .map((x) => parseInt(x, 10))
    .filter((x) => Number.isInteger(x) && x >= 0 && x <= 6);
  return [...new Set(arr)].sort((a, b) => a - b).join(',');
}

export function getTvPlaylist(tvId) {
  return db
    .prepare(
      `SELECT tp.id, tp.page_id, tp.position, tp.dwell_sec, tp.days, tp.start_min, tp.end_min,
              p.title AS page_title, p.status AS page_status, p.slug AS page_slug
       FROM tv_pages tp JOIN pages p ON p.id = tp.page_id
       WHERE tp.tv_id = ? ORDER BY tp.position`
    )
    .all(tvId);
}

// Replace a TV's whole playlist with the provided items (ordered).
// item = { pageId, dwellSec, days, startMin, endMin }
export function setTvPlaylist(tvId, items) {
  const tv = db.prepare('SELECT id FROM tvs WHERE id = ?').get(tvId);
  if (!tv) return null;
  const pageExists = db.prepare('SELECT 1 FROM pages WHERE id = ?');
  const clean = (Array.isArray(items) ? items : [])
    .filter((it) => it && pageExists.get(Number(it.pageId)))
    .map((it) => ({
      pageId: Number(it.pageId),
      dwellSec: Math.max(5, Math.round(Number(it.dwellSec)) || 60),
      days: cleanDays(it.days),
      startMin: toMin(it.startMin),
      endMin: toMin(it.endMin),
    }));
  const tx = db.transaction((rows) => {
    db.prepare('DELETE FROM tv_pages WHERE tv_id = ?').run(tvId);
    const ins = db.prepare(
      `INSERT INTO tv_pages (tv_id, page_id, position, dwell_sec, days, start_min, end_min)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );
    rows.forEach((r, i) => ins.run(tvId, r.pageId, i, r.dwellSec, r.days, r.startMin, r.endMin));
    db.prepare('UPDATE tvs SET updated_at = ? WHERE id = ?').run(nowIso(), tvId);
  });
  tx(clean);
  return getTvPlaylist(tvId);
}

// Is a schedule active at the given Date?
export function scheduleActive(date, days, startMin, endMin) {
  if (days) {
    const set = days.split(',').map(Number);
    if (!set.includes(date.getDay())) return false;
  }
  if (startMin === null && endMin === null) return true;
  const nowMin = date.getHours() * 60 + date.getMinutes();
  if (startMin !== null && endMin !== null) {
    return startMin <= endMin
      ? nowMin >= startMin && nowMin < endMin
      : nowMin >= startMin || nowMin < endMin; // overnight window
  }
  if (startMin !== null) return nowMin >= startMin;
  return nowMin < endMin;
}

// Compute what a TV should be showing right now: the ordered list of active,
// published pages (with content), plus flags for the display's holding screens.
export function getActivePlaylist(tvId, date = new Date()) {
  const rows = db
    .prepare(
      `SELECT tp.dwell_sec, tp.days, tp.start_min, tp.end_min,
              p.id, p.slug, p.title, p.status, p.version, p.content,
              b.logo_url AS brand_logo
       FROM tv_pages tp JOIN pages p ON p.id = tp.page_id
       LEFT JOIN brands b ON b.id = p.brand_id
       WHERE tp.tv_id = ? ORDER BY tp.position`
    )
    .all(tvId);

  const active = [];
  let hasUnpublished = false;
  for (const r of rows) {
    if (r.status !== 'published') {
      hasUnpublished = true;
      continue;
    }
    if (!scheduleActive(date, r.days, r.start_min, r.end_min)) continue;
    let content;
    try {
      content = normalizeContent(JSON.parse(r.content));
    } catch {
      content = newPageContent();
    }
    active.push({
      dwellSec: r.dwell_sec,
      page: { id: r.id, slug: r.slug, title: r.title, version: r.version, content, brandLogo: r.brand_logo || null },
    });
  }
  return { active, totalItems: rows.length, hasUnpublished };
}

// Compute what a brand's public domain root should show right now: a rotation
// of that brand's published pages plus company-wide (unbranded) published
// pages. Brand pages come first. Each page dwells long enough to play through
// its slides once. Returns the same shape as getActivePlaylist consumers use.
export function getActiveBrandPlaylist(brandId) {
  const brand = getBrand(brandId);
  const rows = db
    .prepare(
      `SELECT p.id, p.slug, p.title, p.version, p.content, p.brand_id
       FROM pages p
       WHERE p.status = 'published' AND (p.brand_id = ? OR p.brand_id IS NULL)
       ORDER BY (p.brand_id IS NULL) ASC, p.updated_at DESC`
    )
    .all(brandId);

  const active = [];
  for (const r of rows) {
    let content;
    try {
      content = normalizeContent(JSON.parse(r.content));
    } catch {
      content = newPageContent();
    }
    const dwellSec = Math.max(10, Math.min(600, content.slides.length * (content.durationSec || 10)));
    active.push({
      dwellSec,
      page: { id: r.id, slug: r.slug, title: r.title, version: r.version, content, brandLogo: brand?.logo_url || null },
    });
  }
  return { active, totalItems: rows.length, hasUnpublished: false, brand };
}

export function listDepartments() {
  const rows = db
    .prepare(
      `SELECT department AS d FROM tvs WHERE department <> ''
       UNION SELECT department AS d FROM pages WHERE department <> ''
       UNION SELECT department AS d FROM users WHERE department <> ''
       ORDER BY d`
    )
    .all();
  return rows.map((r) => r.d);
}

// --------------------------------------------------------------------------
// Users (admins)
// --------------------------------------------------------------------------
function rowToUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    department: row.department || '',
    created_at: row.created_at,
  };
}

const USER_COLS = 'id, email, name, role, department, created_at';

export function listUsers() {
  return db.prepare(`SELECT ${USER_COLS} FROM users ORDER BY created_at`).all().map(rowToUser);
}

export function getUserByEmail(email) {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(String(email).toLowerCase().trim());
}

export function getUser(id) {
  return rowToUser(db.prepare(`SELECT ${USER_COLS} FROM users WHERE id = ?`).get(id));
}

export function countSuperAdmins() {
  return db.prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'super_admin'").get().n;
}

export function createUser({ email, name, password, role = 'editor', department = '' }) {
  const now = nowIso();
  const info = db
    .prepare(
      `INSERT INTO users (email, name, password_hash, role, department, created_at) VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(String(email).toLowerCase().trim(), name || '', hashPassword(password), role, department || '', now);
  return getUser(info.lastInsertRowid);
}

export function updateUser(id, { name, role, password, department }) {
  const existing = getUser(id);
  if (!existing) return null;
  db.prepare(
    `UPDATE users SET name = ?, role = ?, department = ?, password_hash = COALESCE(?, password_hash) WHERE id = ?`
  ).run(
    name ?? existing.name,
    role ?? existing.role,
    department === undefined ? existing.department : department || '',
    password ? hashPassword(password) : null,
    id
  );
  return getUser(id);
}

export function deleteUser(id) {
  return db.prepare('DELETE FROM users WHERE id = ?').run(id).changes > 0;
}

// --------------------------------------------------------------------------
// Department scoping helpers (used by API routes)
// --------------------------------------------------------------------------
// An editor with a non-empty department is scoped to it. Super admins and
// editors without a department see everything.
export function isScoped(user) {
  return user?.role !== 'super_admin' && !!user?.department;
}

export function departmentFilterFor(user, requested) {
  if (isScoped(user)) return user.department;
  return requested || undefined; // super admin / unscoped editor: honor request or all
}

export function canAccessDepartment(user, department) {
  if (!isScoped(user)) return true;
  return (department || '') === user.department;
}
