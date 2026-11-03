import * as React from 'react'
import { toast } from 'sonner'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Pill } from '@/components/app-shell'
import { WarrantyDialog } from '@/components/warranty-dialog'
import { formatDate, formatDateTime, warrantyCountdown, warrantyStatus, warrantyStatusTone } from '@/lib/calc'
import { useStore } from '@/lib/store'
import type { Warranty } from '@/lib/types'

export function WarrantyDetailSheet({ warranty, onClose }: { warranty: Warranty | null; onClose: () => void }) {
  const { warranties, orders, now, setWarrantyResolved, deleteWarranty } = useStore()
  const [editOpen, setEditOpen] = React.useState(false)
  // Always read the live record so status changes show immediately.
  const w = warranty ? (warranties.find((x) => x.id === warranty.id) ?? null) : null
  const st = w ? warrantyStatus(w, now) : null
  const linked = w?.orderId ? orders.find((o) => o.id === w.orderId) : null

  const rows: [string, React.ReactNode][] = w
    ? [
        ['Customer', w.customer],
        ['Application', w.application],
        ['User', w.user || '—'],
        ['Plan', w.plan || '—'],
        ['Durasi aktif', w.activeDurationDays ? `${w.activeDurationDays} hari` : '—'],
        ['Tanggal order', w.orderDate ? formatDate(w.orderDate) : '—'],
        ['Report', formatDateTime(w.reportAt)],
        ['Garansi selesai', formatDateTime(w.warrantyEndAt)],
        ['Sisa garansi', warrantyCountdown(w, now)],
        ['Order', w.orderId ? (linked ? `Linked · ${linked.id}` : 'Order tidak ditemukan') : 'Manual / order sudah dihapus'],
      ]
    : []

  return (
    <>
      <Sheet open={!!w} onOpenChange={(o) => !o && onClose()}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          {w && st && (
            <>
              <SheetHeader>
                <SheetTitle className="text-xl">𓆩♡𓆪 Warranty Detail</SheetTitle>
                <SheetDescription>Data order tersimpan sebagai snapshot saat laporan dibuat.</SheetDescription>
              </SheetHeader>
              <div className="flex flex-col gap-5 px-4 pb-6">
                <Pill tone={warrantyStatusTone[st]}>{st}</Pill>
                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                  {rows.map(([k, v]) => (
                    <React.Fragment key={k}>
                      <dt className="text-muted-foreground">{k}</dt>
                      <dd className="text-right font-semibold">{v}</dd>
                    </React.Fragment>
                  ))}
                </dl>
                <div>
                  <p className="mb-1 text-xs font-extrabold text-muted-foreground">Catatan masalah</p>
                  <p className="rounded-2xl bg-muted/60 p-3 text-sm">{w.issue || '—'}</p>
                </div>
                <div>
                  <p className="mb-2 text-xs font-extrabold text-muted-foreground">Riwayat status</p>
                  <ol className="flex flex-col gap-2 border-l-2 border-primary/40 pl-3">
                    {w.history.map((h, i) => (
                      <li key={i} className="text-xs">
                        <b>{h.label}</b>
                        <span className="block text-muted-foreground">{formatDateTime(h.at)}</span>
                      </li>
                    ))}
                  </ol>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    className="col-span-2 h-11 rounded-xl font-bold"
                    variant={w.resolved ? 'outline' : 'default'}
                    onClick={() => {
                      setWarrantyResolved(w.id, !w.resolved)
                      toast.success(w.resolved ? 'Laporan dibuka kembali.' : 'Marked as Completed ♡')
                    }}
                  >
                    {w.resolved ? 'Reopen report' : 'Mark as Completed'}
                  </Button>
                  <Button variant="secondary" className="h-11 rounded-xl" onClick={() => setEditOpen(true)}>
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    className="h-11 rounded-xl text-destructive"
                    onClick={() => {
                      if (confirm(`Hapus laporan garansi ${w.customer}? Tindakan ini tidak bisa dibatalkan.`)) {
                        deleteWarranty(w.id)
                        toast('Laporan garansi dihapus.')
                        onClose()
                      }
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
      <WarrantyDialog open={editOpen} onOpenChange={setEditOpen} warranty={w} />
    </>
  )
}
