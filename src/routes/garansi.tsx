import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PageHeader, Pill } from '@/components/app-shell'
import { FilterSelect, SearchBox, SortHeader } from '@/components/filters'
import { WarrantyDialog } from '@/components/warranty-dialog'
import { WarrantyDetailSheet } from '@/components/warranty-detail'
import { formatDateTime, formatShortDate, warrantyCountdown, warrantyStatus, warrantyStatusTone } from '@/lib/calc'
import { useStore } from '@/lib/store'
import type { Warranty, WarrantyStatus } from '@/lib/types'

export const Route = createFileRoute('/garansi')({
  head: () => ({ meta: [{ title: "Garansi · Primpaii's Way" }] }),
  component: Garansi,
})

const STATUSES: WarrantyStatus[] = ['Active Warranty', 'Expiring Soon', 'Expiring Today', 'Expired Warranty', 'Completed']
type SortKey = 'reportAt' | 'warrantyEndAt'

function Garansi() {
  const { warranties, appearance, now } = useStore()
  const [q, setQ] = React.useState('')
  const [status, setStatus] = React.useState('')
  const [sort, setSort] = React.useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'reportAt', dir: 'desc' })
  const [addOpen, setAddOpen] = React.useState(false)
  const [detail, setDetail] = React.useState<Warranty | null>(null)

  const rows = warranties
    .filter((w) => {
      const n = q.trim().toLowerCase()
      if (n && ![w.customer, w.application, w.plan, w.user, w.issue].some((v) => v.toLowerCase().includes(n))) return false
      if (status && warrantyStatus(w, now) !== status) return false
      return true
    })
    .sort((a, b) => (sort.dir === 'asc' ? 1 : -1) * a[sort.key].localeCompare(b[sort.key]))

  const toggle = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }))

  const counts = STATUSES.map((s) => ({ s, n: warranties.filter((w) => warrantyStatus(w, now) === s).length }))

  return (
    <div>
      <PageHeader
        symbol={appearance.symbols.garansi}
        title="Garansi"
        subtitle="Catat dan pantau laporan masalah / klaim garansi customer."
        actions={
          <Button className="h-11 rounded-xl font-bold" onClick={() => setAddOpen(true)}>
            <Plus /> Add Warranty Report
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
        {counts.map(({ s, n }) => (
          <button
            key={s}
            type="button"
            aria-pressed={status === s}
            onClick={() => setStatus(status === s ? '' : s)}
            className={`pw-card flex flex-col items-start gap-1 p-3 text-left transition ${status === s ? 'ring-2 ring-primary' : 'hover:bg-accent/40'}`}
          >
            <Pill tone={warrantyStatusTone[s]}>{s}</Pill>
            <span className="font-display text-xl font-extrabold tabular-nums">{n}</span>
          </button>
        ))}
      </div>

      <div className="pw-card mb-4 grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
        <SearchBox value={q} onChange={setQ} placeholder="Customer, app, masalah…" />
        <FilterSelect label="Status" value={status} onChange={setStatus} options={STATUSES} />
        <label className="flex flex-col gap-1 text-[11px] font-bold text-muted-foreground">
          Urutkan
          <select
            value={`${sort.key}:${sort.dir}`}
            onChange={(e) => {
              const [key, dir] = e.target.value.split(':') as [SortKey, 'asc' | 'desc']
              setSort({ key, dir })
            }}
            className="h-10 rounded-xl border border-input bg-background px-3 text-sm font-medium text-foreground"
          >
            <option value="reportAt:desc">Report terbaru</option>
            <option value="reportAt:asc">Report terlama</option>
            <option value="warrantyEndAt:asc">Garansi segera berakhir</option>
            <option value="warrantyEndAt:desc">Garansi berakhir paling lama</option>
          </select>
        </label>
      </div>

      {rows.length === 0 ? (
        <div className="pw-card py-14 text-center text-sm text-muted-foreground">Belum ada laporan garansi di sini 𓆩♡𓆪</div>
      ) : (
        <>
          <div className="pw-card hidden overflow-hidden md:block">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Application</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Durasi Aktif</TableHead>
                  <TableHead>Tgl Order</TableHead>
                  <TableHead><SortHeader label="Report" active={sort.key === 'reportAt'} dir={sort.dir} onClick={() => toggle('reportAt')} /></TableHead>
                  <TableHead><SortHeader label="Garansi Selesai" active={sort.key === 'warrantyEndAt'} dir={sort.dir} onClick={() => toggle('warrantyEndAt')} /></TableHead>
                  <TableHead>Sisa</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((w) => {
                  const st = warrantyStatus(w, now)
                  return (
                    <TableRow key={w.id} className="cursor-pointer" onClick={() => setDetail(w)}>
                      <TableCell className="font-bold">
                        <button type="button" className="text-left hover:underline" onClick={() => setDetail(w)}>{w.customer}</button>
                      </TableCell>
                      <TableCell>{w.application}</TableCell>
                      <TableCell>{w.user || '—'}</TableCell>
                      <TableCell>{w.plan || '—'}</TableCell>
                      <TableCell>{w.activeDurationDays ? `${w.activeDurationDays} hari` : '—'}</TableCell>
                      <TableCell className="whitespace-nowrap">{w.orderDate ? formatShortDate(w.orderDate) : '—'}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs">{formatDateTime(w.reportAt)}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs">{formatDateTime(w.warrantyEndAt)}</TableCell>
                      <TableCell className="text-xs font-bold whitespace-nowrap">{w.resolved ? '—' : warrantyCountdown(w, now)}</TableCell>
                      <TableCell><Pill tone={warrantyStatusTone[st]}>{st}</Pill></TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
          <ul className="flex flex-col gap-3 md:hidden">
            {rows.map((w) => {
              const st = warrantyStatus(w, now)
              return (
                <li key={w.id}>
                  <button type="button" onClick={() => setDetail(w)} className="pw-card w-full p-4 text-left">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-bold">{w.customer}</p>
                        <p className="text-xs text-muted-foreground">{w.application} · {w.plan || '—'} · {w.user || '—'}</p>
                      </div>
                      <Pill tone={warrantyStatusTone[st]}>{st}</Pill>
                    </div>
                    <div className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
                      <span className="text-muted-foreground">Order</span><span className="text-right">{w.orderDate ? formatShortDate(w.orderDate) : '—'} · {w.activeDurationDays || '—'}h</span>
                      <span className="text-muted-foreground">Report</span><span className="text-right">{formatDateTime(w.reportAt)}</span>
                      <span className="text-muted-foreground">Selesai</span><span className="text-right">{formatDateTime(w.warrantyEndAt)}</span>
                      <span className="font-bold">Sisa</span><span className="text-right font-bold">{w.resolved ? 'Handled ✓' : warrantyCountdown(w, now)}</span>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        </>
      )}

      <WarrantyDialog open={addOpen} onOpenChange={setAddOpen} />
      <WarrantyDetailSheet warranty={detail} onClose={() => setDetail(null)} />
    </div>
  )
}
