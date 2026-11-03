import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PageHeader, Pill } from '@/components/app-shell'
import { FilterDate, FilterSelect, SearchBox } from '@/components/filters'
import {
  RENEWAL_SOON_DAYS,
  expiryDate,
  formatShortDate,
  orderStatus,
  orderStatusTone,
  remainingDays,
  toISODate,
} from '@/lib/calc'
import { useStore } from '@/lib/store'
import type { OrderStatus } from '@/lib/types'

export const Route = createFileRoute('/reminder')({
  head: () => ({ meta: [{ title: "Reminder · Primpaii's Way" }] }),
  component: Reminder,
})

const STATUSES: OrderStatus[] = ['Active', 'Renewal Soon', 'Expiring Today', 'Expired', 'Completed']
const RANK: Record<OrderStatus, number> = { 'Expiring Today': 0, 'Renewal Soon': 1, Active: 2, Expired: 3, Completed: 4 }

function Reminder() {
  const { orders, appearance, now } = useStore()
  const today = toISODate(now)
  const [q, setQ] = React.useState('')
  const [status, setStatus] = React.useState('')
  const [from, setFrom] = React.useState('')
  const [to, setTo] = React.useState('')

  const rows = orders
    .map((o) => ({ o, st: orderStatus(o, today), exp: expiryDate(o), left: remainingDays(o, today) }))
    .filter(({ o, st, exp }) => {
      const n = q.trim().toLowerCase()
      if (n && ![o.customer, o.application, o.accountName, o.fhName].some((v) => v.toLowerCase().includes(n))) return false
      if (status && st !== status) return false
      if (from && exp < from) return false
      if (to && exp > to) return false
      return true
    })
    .sort((a, b) => RANK[a.st] - RANK[b.st] || a.exp.localeCompare(b.exp))

  const counts = STATUSES.map((s) => ({ s, n: orders.filter((o) => orderStatus(o, today) === s).length }))

  return (
    <div>
      <PageHeader
        symbol={appearance.symbols.reminder}
        title="Reminder"
        subtitle={`Pantau masa aktif order. Hari order = hari ke-1 · "Renewal Soon" = ≤ ${RENEWAL_SOON_DAYS} hari lagi.`}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {counts.map(({ s, n }) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(status === s ? '' : s)}
            aria-pressed={status === s}
            className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${status === s ? 'border-primary bg-accent' : 'border-border bg-card hover:bg-accent/50'}`}
          >
            <Pill tone={orderStatusTone[s]}>{s}</Pill> <span className="ml-1 tabular-nums">{n}</span>
          </button>
        ))}
      </div>

      <div className="pw-card mb-4 grid grid-cols-2 gap-3 p-4 sm:grid-cols-5">
        <SearchBox value={q} onChange={setQ} placeholder="Customer, app, akun, FH…" />
        <FilterSelect label="Status" value={status} onChange={setStatus} options={STATUSES} />
        <FilterDate label="Habis dari" value={from} onChange={setFrom} />
        <FilterDate label="Habis sampai" value={to} onChange={setTo} />
      </div>

      {rows.length === 0 ? (
        <div className="pw-card py-14 text-center text-sm text-muted-foreground">Tidak ada order untuk filter ini ☁️</div>
      ) : (
        <>
          <div className="pw-card hidden overflow-hidden md:block">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Application</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Nama Akun</TableHead>
                  <TableHead>Tgl Order</TableHead>
                  <TableHead>Durasi</TableHead>
                  <TableHead>Tersisa</TableHead>
                  <TableHead>FH</TableHead>
                  <TableHead>Tgl Habis</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(({ o, st, exp, left }) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-bold">{o.customer}</TableCell>
                    <TableCell>{o.application}</TableCell>
                    <TableCell>{o.plan}</TableCell>
                    <TableCell>{o.user}</TableCell>
                    <TableCell>{o.accountName || '—'}</TableCell>
                    <TableCell className="whitespace-nowrap">{formatShortDate(o.orderDate)}</TableCell>
                    <TableCell>{o.durationDays} hari</TableCell>
                    <TableCell className="font-bold tabular-nums">{st === 'Completed' ? '—' : left > 0 ? `${left} hari` : 'Expired'}</TableCell>
                    <TableCell>{o.fhName || '—'}</TableCell>
                    <TableCell className="whitespace-nowrap">{formatShortDate(exp)}</TableCell>
                    <TableCell><Pill tone={orderStatusTone[st]}>{st}</Pill></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <ul className="flex flex-col gap-3 md:hidden">
            {rows.map(({ o, st, exp, left }) => (
              <li key={o.id} className="pw-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-bold">{o.customer}</p>
                    <p className="text-xs text-muted-foreground">{o.application} · {o.plan} · {o.user}</p>
                  </div>
                  <Pill tone={orderStatusTone[st]}>{st}</Pill>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                  <span className="text-muted-foreground">Akun</span><span className="text-right">{o.accountName || '—'}</span>
                  <span className="text-muted-foreground">FH</span><span className="text-right">{o.fhName || '—'}</span>
                  <span className="text-muted-foreground">Order</span><span className="text-right">{formatShortDate(o.orderDate)} · {o.durationDays}h</span>
                  <span className="text-muted-foreground">Habis</span><span className="text-right">{formatShortDate(exp)}</span>
                  <span className="font-bold">Tersisa</span><span className="text-right font-bold">{st === 'Completed' ? '—' : left > 0 ? `${left} hari` : 'Expired'}</span>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
