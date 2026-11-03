import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { OrderDialog } from '@/components/order-dialog'
import { PageHeader, Pill } from '@/components/app-shell'
import { FilterDate, FilterSelect, SearchBox, SortHeader } from '@/components/filters'
import { formatIDR, formatShortDate, netIncome, orderStatus, orderStatusTone, toISODate, topByCount } from '@/lib/calc'
import { useStore } from '@/lib/store'
import type { Order, OrderStatus } from '@/lib/types'

export const Route = createFileRoute('/rekapan')({
  head: () => ({ meta: [{ title: "Rekapan · Primpaii's Way" }] }),
  component: Rekapan,
})

type SortKey = 'orderDate' | 'customer' | 'application' | 'income' | 'net'
const STATUSES: OrderStatus[] = ['Active', 'Renewal Soon', 'Expiring Today', 'Expired', 'Completed']
const PAGE = 10

function Rekapan() {
  const { orders, deleteOrder, appearance, now } = useStore()
  const today = toISODate(now)
  const [q, setQ] = React.useState('')
  const [from, setFrom] = React.useState('')
  const [to, setTo] = React.useState('')
  const [customer, setCustomer] = React.useState('')
  const [app, setApp] = React.useState('')
  const [status, setStatus] = React.useState('')
  const [sort, setSort] = React.useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'orderDate', dir: 'desc' })
  const [page, setPage] = React.useState(1)
  const [editing, setEditing] = React.useState<Order | null>(null)
  const [dialogOpen, setDialogOpen] = React.useState(false)

  const customers = [...new Set(orders.map((o) => o.customer))].sort()
  const apps = [...new Set(orders.map((o) => o.application))].sort()

  const rows = React.useMemo(() => {
    const needle = q.trim().toLowerCase()
    const list = orders.filter((o) => {
      if (needle && ![o.customer, o.application, o.plan, o.user, o.fhName, o.accountName, o.notes].some((v) => v.toLowerCase().includes(needle))) return false
      if (from && o.orderDate < from) return false
      if (to && o.orderDate > to) return false
      if (customer && o.customer !== customer) return false
      if (app && o.application !== app) return false
      if (status && orderStatus(o, today) !== status) return false
      return true
    })
    const val = (o: Order) => (sort.key === 'net' ? netIncome(o) : o[sort.key])
    list.sort((a, b) => {
      const va = val(a)
      const vb = val(b)
      const c = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb))
      return sort.dir === 'asc' ? c : -c
    })
    return list
  }, [orders, q, from, to, customer, app, status, sort, today])

  React.useEffect(() => setPage(1), [q, from, to, customer, app, status])
  const pages = Math.max(1, Math.ceil(rows.length / PAGE))
  const visible = rows.slice((page - 1) * PAGE, page * PAGE)

  const topCustomer = topByCount(orders.map((o) => o.customer))
  const topApp = topByCount(orders.map((o) => o.application))
  const totals = rows.reduce(
    (a, o) => ({ income: a.income + o.income, expense: a.expense + o.expense, discount: a.discount + o.discount }),
    { income: 0, expense: 0, discount: 0 },
  )

  const toggleSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' }))

  const edit = (o: Order) => {
    setEditing(o)
    setDialogOpen(true)
  }
  const remove = (o: Order) => {
    if (confirm(`Hapus order ${o.customer} (${o.application})? Laporan garansi terkait tetap disimpan.`)) {
      deleteOrder(o.id)
      toast('Order dihapus.')
    }
  }

  const sh = (label: string, key: SortKey, className?: string) => (
    <SortHeader label={label} active={sort.key === key} dir={sort.dir} onClick={() => toggleSort(key)} className={className} />
  )

  return (
    <div>
      <PageHeader
        symbol={appearance.symbols.rekapan}
        title="Rekapan"
        subtitle="Seluruh riwayat order, lengkap dengan keuangannya."
        actions={
          <Button
            className="h-11 rounded-xl font-bold"
            onClick={() => {
              setEditing(null)
              setDialogOpen(true)
            }}
          >
            <Plus /> New Order
          </Button>
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <div className="pw-card bg-accent/40 p-4">
          <p className="text-xs font-bold text-muted-foreground">♡ Most Ordered Customer</p>
          <p className="mt-1 font-display text-lg font-extrabold">{topCustomer.names.join(', ') || '—'}</p>
          <p className="text-xs text-muted-foreground">{topCustomer.count} order</p>
        </div>
        <div className="pw-card bg-[var(--pw-baby-blue)]/40 p-4 dark:bg-secondary">
          <p className="text-xs font-bold text-muted-foreground">✧ Most Ordered Application</p>
          <p className="mt-1 font-display text-lg font-extrabold">{topApp.names.join(', ') || '—'}</p>
          <p className="text-xs text-muted-foreground">{topApp.count} order</p>
        </div>
      </div>

      <div className="pw-card mb-4 grid grid-cols-2 gap-3 p-4 sm:grid-cols-4 lg:grid-cols-8">
        <SearchBox value={q} onChange={setQ} placeholder="Customer, app, FH, akun…" />
        <FilterDate label="Dari tanggal" value={from} onChange={setFrom} />
        <FilterDate label="Sampai tanggal" value={to} onChange={setTo} />
        <FilterSelect label="Customer" value={customer} onChange={setCustomer} options={customers} />
        <FilterSelect label="Application" value={app} onChange={setApp} options={apps} />
        <FilterSelect label="Status" value={status} onChange={setStatus} options={STATUSES} />
        <div className="flex items-end">
          <Button
            variant="ghost"
            className="h-10 w-full rounded-xl text-xs"
            onClick={() => {
              setQ(''); setFrom(''); setTo(''); setCustomer(''); setApp(''); setStatus('')
            }}
          >
            Reset
          </Button>
        </div>
      </div>

      <p className="mb-3 text-xs text-muted-foreground">
        {rows.length} order · Omzet <b>{formatIDR(totals.income)}</b> · Pengeluaran <b>{formatIDR(totals.expense)}</b> · Bersih{' '}
        <b>{formatIDR(totals.income - totals.expense - totals.discount)}</b>
      </p>

      {rows.length === 0 ? (
        <div className="pw-card py-14 text-center text-sm text-muted-foreground">Tidak ada order yang cocok dengan filter ☁️</div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="pw-card hidden overflow-hidden md:block">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>{sh('Tanggal', 'orderDate')}</TableHead>
                  <TableHead>{sh('Customer', 'customer')}</TableHead>
                  <TableHead>{sh('Application', 'application')}</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Durasi</TableHead>
                  <TableHead>FH</TableHead>
                  <TableHead className="text-right">{sh('Pemasukan', 'income')}</TableHead>
                  <TableHead className="text-right">Pengeluaran</TableHead>
                  <TableHead className="text-right">Diskon</TableHead>
                  <TableHead className="text-right">{sh('Bersih', 'net')}</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="sr-only">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((o) => {
                  const st = orderStatus(o, today)
                  return (
                    <TableRow key={o.id}>
                      <TableCell className="whitespace-nowrap">{formatShortDate(o.orderDate)}</TableCell>
                      <TableCell className="font-bold">{o.customer}</TableCell>
                      <TableCell>{o.application}</TableCell>
                      <TableCell>{o.plan}</TableCell>
                      <TableCell>{o.user}</TableCell>
                      <TableCell>{o.durationDays}h</TableCell>
                      <TableCell>{o.fhName || '—'}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatIDR(o.income)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatIDR(o.expense)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatIDR(o.discount)}</TableCell>
                      <TableCell className="text-right font-bold tabular-nums">{formatIDR(netIncome(o))}</TableCell>
                      <TableCell><Pill tone={orderStatusTone[st]}>{st}</Pill></TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button size="icon-sm" variant="ghost" aria-label={`Edit order ${o.customer}`} onClick={() => edit(o)}><Pencil /></Button>
                          <Button size="icon-sm" variant="ghost" aria-label={`Delete order ${o.customer}`} onClick={() => remove(o)}><Trash2 /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <ul className="flex flex-col gap-3 md:hidden">
            {visible.map((o) => {
              const st = orderStatus(o, today)
              return (
                <li key={o.id} className="pw-card p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-bold">{o.customer}</p>
                      <p className="text-xs text-muted-foreground">{o.application} · {o.plan} · {o.user} · {o.durationDays}h</p>
                    </div>
                    <Pill tone={orderStatusTone[st]}>{st}</Pill>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                    <span className="text-muted-foreground">Tanggal</span><span className="text-right">{formatShortDate(o.orderDate)}</span>
                    <span className="text-muted-foreground">FH</span><span className="text-right">{o.fhName || '—'}</span>
                    <span className="text-muted-foreground">Pemasukan</span><span className="text-right tabular-nums">{formatIDR(o.income)}</span>
                    <span className="text-muted-foreground">Pengeluaran</span><span className="text-right tabular-nums">{formatIDR(o.expense)}</span>
                    <span className="text-muted-foreground">Diskon</span><span className="text-right tabular-nums">{formatIDR(o.discount)}</span>
                    <span className="font-bold">Bersih</span><span className="text-right font-bold tabular-nums">{formatIDR(netIncome(o))}</span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Button variant="secondary" className="h-10 rounded-xl" onClick={() => edit(o)}><Pencil /> Edit</Button>
                    <Button variant="outline" className="h-10 rounded-xl text-destructive" onClick={() => remove(o)}><Trash2 /> Delete</Button>
                  </div>
                </li>
              )
            })}
          </ul>

          {pages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm">
              <Button variant="outline" size="sm" className="rounded-xl" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
              <span className="tabular-nums">{page} / {pages}</span>
              <Button variant="outline" size="sm" className="rounded-xl" disabled={page === pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          )}
        </>
      )}

      <OrderDialog open={dialogOpen} onOpenChange={setDialogOpen} order={editing} />
    </div>
  )
}
