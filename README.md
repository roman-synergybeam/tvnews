# News Control Center

A control center for running news/announcement pages on TVs across departments.
Admins build pages from slide layouts (no HTML), then assign them to registered
TVs. Each TV auto-updates when its page is reassigned or edited.

**Stack:** Next.js (App Router) · SQLite (better-sqlite3) · bcrypt sessions.

## Features

- **Slide builder** — compose pages from typed layouts (Hero, Cards/Stats,
  Checklist, Steps, Pricing, Do/Don't, CTA, Image). Form-based, with a live
  1920×1080 preview. Wrap words in `*asterisks*` to highlight them in the theme
  accent color. 5 themes (Gold, Emerald, Sapphire, Crimson, Slate).
- **Pages** — create, **clone** (start from an existing design), edit, delete,
  publish/draft. Page-level ticker, corner popups, live clock, per-slide timing.
- **TVs** — register a screen (name + department), get a unique display link.
  **Manage** opens a per-TV **playlist**: one page, or several that **rotate**
  (each with its own dwell time), and each item can be **scheduled** to only show
  on chosen days of the week and/or a time window (supports overnight windows).
  The screen polls every 5s and refreshes automatically on any change — including
  when a scheduled window opens or closes. A heartbeat shows online/offline.
- **Admins** — two roles. **Super admin** manages accounts, pages and TVs across
  all departments. **Editor** manages pages and TVs; an editor may be **scoped to
  a department**, in which case they only see and manage that department's pages
  and TVs, and everything they create is tagged to it. Guards prevent deleting your
  own account or removing the last super admin.
- **Departments** — pages and TVs carry a department. Super admins get a
  department filter; scoped editors are locked to theirs. Pages/TVs with no
  department are company-wide and managed by super admins.

## Run

```bash
npm install
npm run seed          # creates the DB, super admin, sample pages + TVs
npm run build && npm start   # or: npm run dev
```

Open <http://localhost:3000> and sign in.

**Default super admin:** `admin@news.local` / `ChangeMe123!` — change it after
first login (Admins → Edit). Override at seed time:

```bash
NC_ADMIN_EMAIL=you@company.com NC_ADMIN_PASSWORD='a-strong-password' npm run seed
```

## How TVs work

1. In **TVs**, register a screen and copy its display link, e.g.
   `http://<host>:3000/tv/sales-floor-1`.
2. Open that link on the TV (press the ⛶ button or F11 for fullscreen).
3. Click **Manage** and add one or more **published** pages. With one page it just
   shows; with several it rotates in order, each for its dwell time. Add a schedule
   (days + from/to time) to only show a page at certain times. Leave the schedule
   blank for “always”. It updates within a few seconds — no need to touch the TV.
   (Pages left as *draft*, or with no window active right now, fall back to a
   holding screen.)

## Layout

```
src/
  lib/         db, auth/sessions, password, data store, slide model, formatting
  components/  Carousel + SlideView (the renderer), TvDisplay, AdminShell
  app/
    login/                  sign-in
    admin/                  dashboard, pages (+ /[id] editor), tvs, admins
    tv/[slug]/              public TV display (polls + auto-refresh)
    preview/[id]/           fullscreen page preview (login-only)
    api/                    auth, admin CRUD, upload, public tv state
scripts/seed.mjs            idempotent seed (super admin, template pages, TVs)
data/app.db                 SQLite database (created by seed; gitignored)
```

## Notes

- The database is a single file at `data/app.db`. Back it up by copying it.
- Uploaded images go to `public/uploads/`.
- Sessions are httpOnly cookies backed by a `sessions` table (30-day expiry).
- Set `NC_DB_PATH` to relocate the database.
