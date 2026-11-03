import * as React from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatShortDate, toISODate, toLocalInput } from '@/lib/calc'
import { useStore } from '@/lib/store'
import type { Warranty } from '@/lib/types'

type Mode = 'order' | 'manual'

interface FormState {
  orderId: string
  customer: string
  application: string
  user: string
  plan: string
  activeDurationDays: string
  orderDate: string
  reportDate: string
  reportTime: string
  endDate: string
  endTime: string
  warrantyDays: string
  issue: string
  resolved: boolean
}

function nowParts() {
  const [d, t] = toLocalInput(new Date().toISOString()).split('T')
  return { d, t }
}

const blank = (): FormState => {
  const { d, t } = nowParts()
  return {
    orderId: '', customer: '', application: '', user: '', plan: '',
    activeDurationDays: '', orderDate: '', reportDate: d, reportTime: t,
    endDate: '', endTime: '', warrantyDays: '', issue: '', resolved: false,
  }
}

const fromWarranty = (w: Warranty): FormState => {
  const [rd, rt] = toLocalInput(w.reportAt).split('T')
  const [ed, et] = toLocalInput(w.warrantyEndAt).split('T')
  return {
    orderId: w.orderId ?? '', customer: w.customer, application: w.application,
    user: w.user, plan: w.plan, activeDurationDays: String(w.activeDurationDays),
    orderDate: w.orderDate, reportDate: rd, reportTime: rt, endDate: ed, endTime: et,
    warrantyDays: '', issue: w.issue, resolved: w.resolved,
  }
}

const localToISO = (d: string, t: string) => new Date(`${d}T${t}`).toISOString()

export function WarrantyDialog({
  open,
  onOpenChange,
  warranty,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  warranty?: Warranty | null
}) {
  const { orders, saveWarranty } = useStore()
  const [mode, setMode] = React.useState<Mode>('order')
  const [form, setForm] = React.useState<FormState>(blank)
  const [errors, setErrors] = React.useState<Partial<Record<keyof FormState, string>>>({})

  React.useEffect(() => {
    if (!open) return
    setErrors({})
    if (warranty) {
      setForm(fromWarranty(warranty))
      setMode(warranty.orderId ? 'order' : 'manual')
    } else {
      setForm(blank())
      setMode('order')
    }
  }, [open, warranty])

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((f) => ({ ...f, [k]: v }))
    setErrors((e) => ({ ...e, [k]: undefined }))
  }

  const pickOrder = (id: string) => {
    const o = orders.find((x) => x.id === id)
    if (!o) return
    // Snapshot the order so later edits to it never rewrite this report.
    setForm((f) => ({
      ...f,
      orderId: o.id,
      customer: o.customer,
      application: o.application,
      user: o.user,
      plan: o.plan,
      activeDurationDays: String(o.durationDays),
      orderDate: o.orderDate,
    }))
    setErrors({})
  }

  const applyDuration = () => {
    const days = Number(form.warrantyDays)
    if (!form.reportDate || !form.reportTime || !(days > 0)) {
      setErrors((e) => ({ ...e, warrantyDays: 'Isi tanggal/jam report dan durasi garansi (hari) dulu.' }))
      return
    }
    const end = new Date(`${form.reportDate}T${form.reportTime}`)
    end.setDate(end.getDate() + days)
    const [d, t] = toLocalInput(end.toISOString()).split('T')
    setForm((f) => ({ ...f, endDate: d, endTime: t }))
    setErrors((e) => ({ ...e, warrantyDays: undefined, endDate: undefined }))
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const errs: typeof errors = {}
    if (mode === 'order' && !form.orderId) errs.orderId = 'Pilih order terlebih dahulu.'
    if (!form.customer.trim()) errs.customer = 'Nama customer wajib diisi.'
    if (!form.application.trim()) errs.application = 'Application wajib diisi.'
    if (!form.reportDate || !form.reportTime) errs.reportDate = 'Tanggal dan jam report wajib diisi.'
    if (!form.endDate || !form.endTime) errs.endDate = 'Tentukan tanggal dan jam garansi selesai.'
    if (!errs.reportDate && !errs.endDate && localToISO(form.endDate, form.endTime) <= localToISO(form.reportDate, form.reportTime))
      errs.endDate = 'Garansi selesai harus setelah waktu report.'
    setErrors(errs)
    if (Object.keys(errs).length) return

    saveWarranty({
      id: warranty?.id,
      orderId: mode === 'order' ? form.orderId : null,
      customer: form.customer.trim(),
      application: form.application.trim(),
      user: form.user.trim(),
      plan: form.plan.trim(),
      activeDurationDays: Number(form.activeDurationDays) || 0,
      orderDate: form.orderDate || toISODate(new Date()),
      reportAt: localToISO(form.reportDate, form.reportTime),
      warrantyEndAt: localToISO(form.endDate, form.endTime),
      issue: form.issue.trim(),
      resolved: form.resolved,
    })
    toast.success(warranty ? 'Warranty report updated ♡' : 'Warranty report saved ♡')
    onOpenChange(false)
  }

  const err = (k: keyof FormState) =>
    errors[k] ? <p className="mt-1 text-xs font-semibold text-destructive">{errors[k]}</p> : null
  const locked = mode === 'order'
  const text = (k: 'customer' | 'application' | 'user' | 'plan', label: string) => (
    <div>
      <Label htmlFor={`w-${k}`} className="mb-1.5 text-xs font-bold">{label}</Label>
      <Input id={`w-${k}`} value={form[k]} readOnly={locked} onChange={(e) => set(k, e.target.value)} className="h-11 rounded-xl read-only:bg-muted/50" />
      {err(k)}
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto rounded-3xl sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">{warranty ? '✎ Edit Warranty Report' : '+ Add Warranty Report'}</DialogTitle>
          <DialogDescription>Pilih order yang sudah ada agar data terisi otomatis, atau isi manual.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-muted p-1 text-sm font-bold" role="tablist">
          {(['order', 'manual'] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => setMode(m)}
              className={`rounded-xl py-2 ${mode === m ? 'bg-card shadow-sm' : 'text-muted-foreground'}`}
            >
              {m === 'order' ? 'Dari order tercatat' : 'Isi manual'}
            </button>
          ))}
        </div>

        <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
          {mode === 'order' && (
            <div className="sm:col-span-2">
              <Label className="mb-1.5 text-xs font-bold">Pilih Order</Label>
              <Select value={form.orderId} onValueChange={pickOrder}>
                <SelectTrigger className="h-11 w-full rounded-xl">
                  <SelectValue placeholder="Cari order customer…" />
                </SelectTrigger>
                <SelectContent>
                  {orders.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.customer} — {o.application} {o.plan} · {formatShortDate(o.orderDate)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {err('orderId')}
            </div>
          )}
          {text('customer', 'Nama Customer')}
          {text('application', 'Application')}
          {text('user', 'User')}
          {text('plan', 'Plan')}
          <div>
            <Label htmlFor="w-dur" className="mb-1.5 text-xs font-bold">Durasi Aktif (hari)</Label>
            <Input id="w-dur" type="number" min={0} value={form.activeDurationDays} readOnly={locked} onChange={(e) => set('activeDurationDays', e.target.value)} className="h-11 rounded-xl read-only:bg-muted/50" />
          </div>
          <div>
            <Label htmlFor="w-od" className="mb-1.5 text-xs font-bold">Tanggal Order</Label>
            <Input id="w-od" type="date" value={form.orderDate} readOnly={locked} onChange={(e) => set('orderDate', e.target.value)} className="h-11 rounded-xl read-only:bg-muted/50" />
          </div>

          <fieldset className="grid gap-3 rounded-2xl border border-border p-3 sm:col-span-2 sm:grid-cols-2">
            <legend className="px-1 text-xs font-extrabold text-muted-foreground">Report</legend>
            <div>
              <Label htmlFor="w-rd" className="mb-1.5 text-xs font-bold">Tanggal Report</Label>
              <Input id="w-rd" type="date" value={form.reportDate} onChange={(e) => set('reportDate', e.target.value)} className="h-11 rounded-xl" />
            </div>
            <div>
              <Label htmlFor="w-rt" className="mb-1.5 text-xs font-bold">Jam Report</Label>
              <Input id="w-rt" type="time" value={form.reportTime} onChange={(e) => set('reportTime', e.target.value)} className="h-11 rounded-xl" />
            </div>
            <div className="sm:col-span-2">{err('reportDate')}</div>
          </fieldset>

          <fieldset className="grid gap-3 rounded-2xl border border-border p-3 sm:col-span-2 sm:grid-cols-2">
            <legend className="px-1 text-xs font-extrabold text-muted-foreground">Garansi selesai</legend>
            <div className="flex items-end gap-2 sm:col-span-2">
              <div className="flex-1">
                <Label htmlFor="w-wd" className="mb-1.5 text-xs font-bold">Hitung dari durasi garansi (opsional)</Label>
                <Input id="w-wd" type="number" min={1} placeholder="mis. 3 hari" value={form.warrantyDays} onChange={(e) => set('warrantyDays', e.target.value)} className="h-11 rounded-xl" />
              </div>
              <Button type="button" variant="secondary" className="h-11 rounded-xl" onClick={applyDuration}>
                Hitung
              </Button>
            </div>
            <div className="sm:col-span-2">{err('warrantyDays')}</div>
            <div>
              <Label htmlFor="w-ed" className="mb-1.5 text-xs font-bold">Tanggal Garansi Selesai</Label>
              <Input id="w-ed" type="date" value={form.endDate} onChange={(e) => set('endDate', e.target.value)} className="h-11 rounded-xl" />
            </div>
            <div>
              <Label htmlFor="w-et" className="mb-1.5 text-xs font-bold">Jam Garansi Selesai</Label>
              <Input id="w-et" type="time" value={form.endTime} onChange={(e) => set('endTime', e.target.value)} className="h-11 rounded-xl" />
            </div>
            <div className="sm:col-span-2">{err('endDate')}</div>
          </fieldset>

          <div className="sm:col-span-2">
            <Label htmlFor="w-issue" className="mb-1.5 text-xs font-bold">Catatan / Deskripsi Masalah</Label>
            <Textarea id="w-issue" value={form.issue} onChange={(e) => set('issue', e.target.value)} placeholder="Ceritakan masalahnya…" className="rounded-xl" />
          </div>
          <label className="flex items-center gap-3 text-sm font-semibold sm:col-span-2">
            <Switch checked={form.resolved} onCheckedChange={(c) => set('resolved', c)} />
            Status: laporan sudah selesai ditangani (Completed)
          </label>
          <DialogFooter className="gap-2 sm:col-span-2">
            <Button type="button" variant="outline" className="h-11 rounded-xl" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="h-11 rounded-xl px-6 font-bold">{warranty ? 'Save changes' : 'Save report ♡'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
