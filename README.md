# Primpaii's Way

A soft, feminine personal online-store dashboard for managing subscription orders,
renewals, warranty claims, income, expenses and profit — with a tiny built-in music
player. Built for phone and laptop from the same link.

## Screens

- **Dashboard** — welcome, 12 live statistics, renewal + warranty reminders, New Order.
- **Rekapan** — full order history with search, filters, sorting, edit/delete and top customer/app.
- **Reminder** — expiry dates, remaining days and renewal status for every order.
- **Garansi** — warranty reports with report/end date-time, countdown, status and history.
- **Setting** — appearance (dark mode, fonts, title, toolbar symbols), My Little Playlist, spreadsheet preview, export/backup.

## Tech

TanStack Start (React 19, TanStack Router), Vite, Tailwind CSS 4, shadcn/ui (Radix),
sonner toasts, lucide icons. Deployed on Netlify.

## Run locally

```bash
pnpm install
pnpm dev          # http://localhost:3000
# or, with Netlify emulation:
netlify dev
```

## Status

The product surface is complete and interactive, currently running on sample data
(`src/lib/fixtures.ts`) — changes reset on refresh. Cloud storage, accounts,
multi-device sync, Google Sheets sync and import/restore are next. See
[PLAN.md](PLAN.md) for the roadmap.
