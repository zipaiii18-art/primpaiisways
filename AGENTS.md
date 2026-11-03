# AGENTS.md — Primpaii's Way

Personal store-management dashboard (orders, renewals, warranties, finances, playlist).
**Continue from [PLAN.md](PLAN.md)** — milestone 1 (product surface) is done; the next
milestone is the cloud database + accounts.

## Stack

TanStack Start + React 19 + TanStack Router (file routes), Vite 8, Tailwind CSS 4,
shadcn/ui components in `src/components/ui`, sonner, lucide-react, TypeScript strict.
Netlify deploy via `@netlify/vite-plugin-tanstack-start`.

## Layout

```
src/
  lib/
    types.ts      # Order, Warranty, CustomOption, PlaylistItem, AppearanceSettings
    calc.ts       # ALL date/status/finance rules (expiry, remaining days, warranty status, countdown, IDR + date formatting, topByCount)
    fixtures.ts   # Seed data, default dropdown options, font/symbol choices, spreadsheet URLs
    store.tsx     # StoreProvider/useStore — the single data boundary every screen uses
  components/
    app-shell.tsx      # Sidebar (desktop) / bottom nav (mobile), BrandTitle + ornament, floating decorations, PageHeader, Pill
    music-player.tsx   # MusicProvider (one HTMLAudio, embeds), PlayerControls, EmbedFrame, MusicMiniPlayer
    option-combo.tsx   # Searchable dropdown with add/rename/delete custom options
    order-dialog.tsx   # New/Edit order form
    warranty-dialog.tsx, warranty-detail.tsx
    filters.tsx        # Shared filter/search/sort controls
  routes/  index (Dashboard), rekapan, reminder, garansi, setting
```

## Rules & decisions

- Nav order is fixed: Dashboard, Rekapan, Reminder, **Garansi**, Setting (`NAV` in app-shell).
- Brand palette lives in `src/styles.css` (`--pw-*`); don't change the five hex values. The ornament under the title must stay `꒷꒦︶꒷꒦︶ ๋ ࣭ ⭑꒷꒦`.
- Order day counts as day 1: `expiry = orderDate + duration − 1`. Renewal Soon = ≤ `RENEWAL_SOON_DAYS` (3). Warranty Expiring Soon = ≤ `WARRANTY_SOON_HOURS` (48h). Change rules only in `calc.ts`.
- Profit = income − expense; Pendapatan Bersih = income − expense − discount.
- Orders and warranties store **text snapshots** of application/plan/user/customer; renaming a custom option or editing an order never rewrites history.
- Deleting an order keeps its warranties (orderId → null).
- "Completed" for warranties is a resolution flag (`resolved`), separate from validity.
- Appearance + Apps Script URL are cached in localStorage (read in `useEffect` only, to avoid hydration mismatch). Everything else is in-memory until milestone 2.
- Music: never autoplay; `MusicProvider.play` always stops the previous source first.
- Don't claim Google Sheets is connected until a test write succeeds.
- When wiring persistence, keep the `useStore()` API and swap the action bodies; then delete the preview banner in `app-shell.tsx`.

## Conventions

PascalCase components, camelCase utils, kebab-case files. Import via `@/`. UI copy mixes
Indonesian (labels) with the English brand phrases from the brief.
