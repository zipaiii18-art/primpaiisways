import * as React from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { OrderDialog } from '@/components/order-dialog'
import { Pill } from '@/components/app-shell'
import { WarrantyDetailSheet } from '@/components/warranty-detail'
import {
  daysBetween,
  expiryDate,
  formatDateTime,
  formatIDR,
  formatShortDate,
  orderStatus,
  orderStatusTone,
  remainingDays,
  toISODate,
  warrantyCountdown,
  warrantyStatus,
  warrantyStatusTone,
} from '@/lib/calc'
import { useStore } from '@/lib/store'
import type { Warranty } from '@/lib/types'

export const Route = createFileRoute('/')({
  component: Dashboard,
})

function Stat({ label, value, hint, tone = 'bg-card' }: { label: string; value: React.ReactNode; hint?: string; tone?: string }) {
  return (
    <div className={`pw-card ${tone} flex flex-col justify-between p-4`}>
      <p className="text-xs font-bold text-muted-foreground">{label}</p>
      <p className="mt-2 truncate font-display text-xl font-extrabold tabular-nums sm:text-2xl">{value}</p>
      {hint && <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  )
}

function Dashboard() {
  const { orders, warranties, now, appearance } = useStore()
  const [orderOpen, setOrderOpen] = React.useState(false)
  const [detail, setDetail] = React.useState<Warranty | null>(null)
  const today = toISODate(now)

  const s = React.useMemo(() => {
    const statuses = orders.map((o) => orderStatus(o, today))
    const income = orders.reduce((a, o) => a + o.income, 0)
    const expense = orders.reduce((a, o) => a + o.expense, 0)
    const discount = orders.reduce((a, o) => a + o.discount, 0)
    const wStatuses = warranties.map((w) => warrantyStatus(w, now))
    return {
      total: orders.length,
      active: statuses.filter((x) => x === 'Active' || x === 'Renewal Soon' || x === 'Expiring Today').length,
      renewalToday: statuses.filter((x) => x === 'Expiring Today').length,
      upcoming: statuses.filter((x) => x === 'Renewal Soon').length,
      completed: statuses.filter((x) => x === 'Expired' || x === 'Completed').length,
      income,
      expense,
      profit: income - expense,
      net: income - expense - discount,
      activeW: wStatuses.filter((x) => x === 'Active Warranty' || x === 'Expiring Soon' || x === 'Expiring Today').length,
      reportsToday: warranties.filter((w) => toISODate(new Date(w.reportAt)) === today).length,
      expiringW: wStatuses.filter((x) => x === 'Expiring Soon' || x === 'Expiring Today').length,
    }
  }, [orders, warranties, today, now])

  const message =
    s.renewalToday > 0
      ? "Don't forget to check your renewals, pretty girl!"
      : s.total === 0
        ? "Let's see what we have today, shall we?"
        : orders.some((o) => o.orderDate === today)
          ? 'Your orders are growing, Pipay! ♡'
          : s.upcoming > 0
            ? 'One order at a time, one profit at a time. You’re doing great!'
            : 'Everything is under control. Keep going, Pipay!'

  const renewals = orders
    .filter((o) => !o.completed && daysBetween(expiryDate(o), today) <= 7)
    .sort((a, b) => expiryDate(a).localeCompare(expiryDate(b)))
    .slice(0, 8)

  const wOrder = { 'Expiring Today': 0, 'Expiring Soon': 1, 'Active Warranty': 2, 'Expired Warranty': 3, Completed: 4 }
  const attention = [...warranties]
    .sort((a, b) => wOrder[warrantyStatus(a, now)] - wOrder[warrantyStatus(b, now)])
    .slice(0, 5)

  return (
    <div className="flex flex-col gap-8">
      <section className="pw-card overflow-hidden bg-gradient-to-br from-[var(--pw-blush)] via-card to-[var(--pw-baby-blue)] p-6 sm:p-8 dark:from-accent dark:via-card dark:to-secondary">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">Welcome back, Pipay! ♡</h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
              Your little space to manage orders, count the money, and keep everything organized!
            </p>
            <p className="mt-3 inline-block rounded-full bg-card/80 px-3 py-1 text-xs font-bold text-[#b0436f] dark:text-primary">
              {appearance.symbols.dashboard} {message}
            </p>
          </div>
          <Button onClick={() => setOrderOpen(true)} className="h-12 rounded-2xl px-6 text-base font-bold shadow-md">
            <Plus className="size-5" /> New Order
          </Button>
        </div>
      </section>

      <section aria-labelledby="orders-stats">
        <h2 id="orders-stats" className="mb-3 text-sm font-extrabold text-muted-foreground">Orders</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <Stat label="Total Orders" value={s.total} />
          <Stat label="Active Orders" value={s.active} />
          <Stat label="Renewal Today" value={s.renewalToday} tone="bg-[var(--pw-baby-blue)]/50" />
          <Stat label="Upcoming Renewals" value={s.upcoming} hint="≤ 3 hari lagi" />
          <Stat label="Completed Orders" value={s.completed} hint="selesai / expired" />
        </div>
        <h2 className="mt-6 mb-3 text-sm font-extrabold text-muted-foreground">Money</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Total Omzet" value={formatIDR(s.income)} />
          <Stat label="Total Pengeluaran" value={formatIDR(s.expense)} />
          <Stat label="Total Profit" value={formatIDR(s.profit)} hint="omzet − pengeluaran" tone="bg-accent/60" />
          <Stat label="Pendapatan Bersih" value={formatIDR(s.net)} hint="profit − diskon" tone="bg-accent/60" />
        </div>
        <h2 className="mt-6 mb-3 text-sm font-extrabold text-muted-foreground">Warranty</h2>
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Active Warranties" value={s.activeW} />
          <Stat label="Reports Today" value={s.reportsToday} />
          <Stat label="Expiring Soon" value={s.expiringW} />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-5">
        <section className="pw-card p-4 sm:p-6 xl:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-extrabold">♡ Renewal Reminder</h2>
            <Link to="/reminder" className="text-xs font-bold text-[#b0436f] hover:underline dark:text-primary">
              See all →
            </Link>
          </div>
          {renewals.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Tidak ada renewal dalam waktu dekat ☁️</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {renewals.map((o) => {
                const st = orderStatus(o, today)
                const left = remainingDays(o, today)
                return (
                  <li key={o.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate font-bold">{o.customer}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {o.application} · {o.plan} · {o.user}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {formatShortDate(o.orderDate)} → {formatShortDate(expiryDate(o))}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                      <Pill tone={orderStatusTone[st]}>{st}</Pill>
                      <span className="text-xs font-semibold text-muted-foreground">
                        {left > 0 ? `${left} hari tersisa` : 'Expired'}
                      </span>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section className="pw-card p-4 sm:p-6 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-extrabold">𓆩♡𓆪 Warranty Reminder</h2>
            <Link to="/garansi" className="text-xs font-bold text-[#b0436f] hover:underline dark:text-primary">
              See all →
            </Link>
          </div>
          {attention.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Belum ada laporan garansi.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {attention.map((w) => {
                const st = warrantyStatus(w, now)
                const isNew = now.getTime() - new Date(w.reportAt).getTime() < 86_400_000
                return (
                  <li key={w.id}>
                    <button
                      type="button"
                      onClick={() => setDetail(w)}
                      className="w-full rounded-2xl border border-border bg-background/60 p-3 text-left transition-colors hover:bg-accent/50"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold">
                            {w.customer} {isNew && <span className="ml-1 rounded-full bg-primary/30 px-1.5 text-[10px]">new</span>}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">{w.application}</p>
                        </div>
                        <Pill tone={warrantyStatusTone[st]}>{st}</Pill>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-1 text-[11px] text-muted-foreground">
                        <span>Report: {formatDateTime(w.reportAt)}</span>
                        <span className="text-right">Ends: {formatDateTime(w.warrantyEndAt)}</span>
                      </div>
                      <p className="mt-1 text-xs font-bold">{w.resolved ? 'Handled ✓' : warrantyCountdown(w, now)}</p>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>

      <OrderDialog open={orderOpen} onOpenChange={setOrderOpen} />
      <WarrantyDetailSheet warranty={detail} onClose={() => setDetail(null)} />
    </div>
  )
}
