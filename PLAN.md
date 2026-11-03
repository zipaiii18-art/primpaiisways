# Primpaii's Way — Product Roadmap

Primpaii's Way is Pipay's personal store-management dashboard: orders, renewals,
warranties, money, and a little playlist — in one soft-pink space that works on
phone and laptop with the same link.

The work is split into small milestones. Each one ships something usable.

## ✅ Milestone 1 — Product surface (done)

The full branded app, clickable end to end, running on seeded sample data held in
`src/lib/fixtures.ts` and served through one store (`src/lib/store.tsx`).

- Brand: palette, title + ornament `꒷꒦︶꒷꒦︶ ๋ ࣭ ⭑꒷꒦`, floating decorations (pointer-events none, reduced-motion aware).
- Navigation in the required order — Dashboard, Rekapan, Reminder, Garansi, Setting — as a left sidebar on desktop and a bottom bar on mobile.
- Dashboard: welcome copy, situational message, 12 statistics, Renewal Reminder, Warranty Reminder, New Order.
- New Order / Edit Order form with validation, live expiry + net-income preview, double-submit guard.
- Searchable Application / Plan / User dropdowns with add / rename / delete custom options and duplicate prevention; orders store text snapshots.
- Rekapan: search, date/customer/app/status filters, sorting, pagination, edit, delete-with-confirm, Most Ordered Customer / Application (ties shown).
- Reminder: expiry = order date + duration − 1, remaining days, five statuses, status/date filters; recalculates every minute.
- Garansi: list, Add/Edit report (auto-fill from an order or manual), date + time for report and end, optional duration calculator, countdown, five statuses, detail sheet with status history, complete/reopen, delete-with-confirm. Deleting an order keeps its warranty reports (link cleared, snapshot kept).
- Setting: light/dark, 5 body fonts, 5 title fonts + size, per-menu symbol picker (saved on device); My Little Playlist (audio URL / Spotify / YouTube embeds, play, pause, next, prev, volume, mute, repeat, shuffle, progress, rename, reorder, favorite, delete, no autoplay, one source at a time); spreadsheet preview + Open button + Apps Script URL field; Export CSV and Backup JSON.

## Milestone 2 — Cloud database & accounts

**Decision to confirm first:** the brief names an existing Supabase project
(`primpaiisway`). Netlify also offers a built-in managed Postgres (Netlify Database)
plus Netlify Identity, which needs no external keys. Pick one; the store API stays
the same either way.

- Tables: `orders`, `custom_options` (unique per user + category + lower(name)), `user_settings` (appearance, Apps Script URL), `warranties` (fields from the brief; `order_id` nullable, `ON DELETE SET NULL`), `playlist_items`, `warranty_history`.
- Owner-scoped access on every table (RLS on Supabase, or per-user server checks on Netlify Database).
- Sign up, login, logout, session persistence, protected pages, loading + error states.
- Replace the seeded state in `src/lib/store.tsx` with real queries; remove the preview banner.
- Additive migrations only — never reset tables.

## Milestone 3 — Multi-device sync & resilience

- Realtime subscription (or safe polling) so phone ↔ laptop stay in step.
- Online / offline indicator, sync status, retry queue when the connection returns.
- Client-generated order IDs (idempotent inserts) to block double transactions.
- `updated_at` conflict check on edit with a friendly "this changed on another device" prompt.

## Milestone 4 — Google Sheets sync

- Apps Script Web App template (upsert by transaction ID) + setup guide.
- Server-side sync on create / update / delete with per-order sync status.
- "Test connection" — status turns *Connected* only after a successful test row.
- Retry failed syncs (manual button + automatic on next save).

## Milestone 5 — Import & restore

- Import CSV and Restore JSON with schema validation, preview, duplicate detection by ID, and explicit confirmation before overwriting.
- Playlist and appearance settings synced via the database (localStorage stays as a cache).

## Milestone 6 — Polish & verification

- Full test pass from the brief (sync, RLS isolation, dropdown persistence, finance math, 7-day reminder, warranty status edges, sheet duplication, music player, responsive on phone + laptop).
- Redirect URLs for the Netlify domain in the auth provider.
