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

## Deployment readiness

- Demo customer, order, warranty, and playlist records have been removed.
- Supabase authentication is connected to the application shell (sign up, login, password reset, password recovery, logout).
- Orders, warranties, custom dropdown options, playlist items, and per-account settings load from and save to Supabase.
- Owner-only Row Level Security is defined in `supabase/migrations/0001_init.sql`.
- The production build and live Supabase round-trip still need to be run in the user's Netlify/Supabase environment. Do not treat the app as launch-verified until the SQL migration is applied and a test order survives a page refresh.

## Supabase + Netlify setup (required before launch)

1. In Supabase, open **SQL Editor**, paste and run `supabase/migrations/0001_init.sql`.
2. In Supabase **Authentication → URL Configuration**, set the Site URL to `https://primpaiisways.netlify.app` and add that URL (plus your Netlify deploy-preview URL if needed) to Redirect URLs.
3. In Netlify, open **Site configuration → Environment variables** and add:
   - `VITE_SUPABASE_URL` = `https://vflgcsubicihvmzetyjk.supabase.co`
   - `VITE_SUPABASE_PUBLISHABLE_KEY` = the publishable key already supplied for this project (or the same key from Supabase API Keys)
   - `VITE_SITE_URL` = `https://primpaiisways.netlify.app`
4. Trigger a fresh deploy so Vite bakes the public environment values into the client bundle.
5. Open the site, create an account, confirm the email, log in, create a test order, refresh, and verify it remains. Then delete the test order.

The browser uses only the Supabase publishable key. Never add a `service_role` or `sb_secret` key to a `VITE_` variable. Row Level Security is enabled by the SQL migration and scopes all records to the authenticated account.

A `.env.production` file is included for this Netlify site. You can alternatively set the same values as Netlify environment variables. The publishable key is intended for browser use; database access is protected by Supabase Auth and RLS. If the SQL migration has not been run, the app shows a visible data-load warning.
