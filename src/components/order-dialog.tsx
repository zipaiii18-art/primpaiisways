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
import { OptionCombo } from '@/components/option-combo'
import { expiryDate, formatDate, formatIDR, netIncome, todayISO } from '@/lib/calc'
import { useStore } from '@/lib/store'
import type { Order } from '@/lib/types'

type FormState = {
  customer: string
  application: string
  plan: string
  user: string
  durationDays: string
  fhName: string
  accountName: string
  orderDate: string
  income: string
  expense: string
  discount: string
  notes: string
  completed: boolean
}

const empty = (): FormState => ({
  customer: '',
  application: '',
  plan: '',
  user: '',
  durationDays: '30',
  fhName: '',
  accountName: '',
  orderDate: todayISO(),
  income: '',
  expense: '',
  discount: '0',
  notes: '',
  completed: false,
})

const fromOrder = (o: Order): FormState => ({
  ...o,
  durationDays: String(o.durationDays),
  income: String(o.income),
  expense: String(o.expense),
  discount: String(o.discount),
})

type Errors = Partial<Record<keyof FormState, string>>

function validate(f: FormState): Errors {
  const e: Errors = {}
  if (!f.customer.trim()) e.customer = 'Nama customer wajib diisi.'
  if (!f.application) e.application = 'Pilih application.'
  if (!f.plan) e.plan = 'Pilih plan.'
  if (!f.user) e.user = 'Pilih user.'
  const dur = Number(f.durationDays)
  if (!Number.isInteger(dur) || dur < 1) e.durationDays = 'Durasi minimal 1 hari (angka bulat).'
  if (!f.orderDate) e.orderDate = 'Tanggal order wajib diisi.'
  for (const k of ['income', 'expense', 'discount'] as const) {
    const n = Number(f[k])
    if (f[k] === '' && k !== 'discount') e[k] = 'Wajib diisi (boleh 0).'
    else if (!Number.isFinite(n) || n < 0) e[k] = 'Masukkan angka 0 atau lebih.'
  }
  return e
}

export function OrderDialog({
  open,
  onOpenChange,
  order,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  order?: Order | null
}) {
  const { saveOrder } = useStore()
  const [form, setForm] = React.useState<FormState>(empty)
  const [errors, setErrors] = React.useState<Errors>({})
  const [submitting, setSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      setForm(order ? fromOrder(order) : empty())
      setErrors({})
      setSubmitting(false)
    }
  }, [open, order])

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((f) => ({ ...f, [k]: v }))
    setErrors((e) => ({ ...e, [k]: undefined }))
  }

  const dur = Math.max(1, Number(form.durationDays) || 1)
  const preview = form.orderDate ? expiryDate({ orderDate: form.orderDate, durationDays: dur }) : null
  const net = netIncome({
    income: Number(form.income) || 0,
    expense: Number(form.expense) || 0,
    discount: Number(form.discount) || 0,
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return // guard against double submission
    const errs = validate(form)
    setErrors(errs)
    if (Object.keys(errs).length) {
      toast.error('Ada data yang belum lengkap, cek lagi ya ♡')
      return
    }
    setSubmitting(true)
    saveOrder({
      id: order?.id,
      customer: form.customer.trim(),
      application: form.application,
      plan: form.plan,
      user: form.user,
      durationDays: Number(form.durationDays),
      fhName: form.fhName.trim(),
      accountName: form.accountName.trim(),
      orderDate: form.orderDate,
      income: Number(form.income),
      expense: Number(form.expense),
      discount: Number(form.discount) || 0,
      notes: form.notes.trim(),
      completed: form.completed,
    })
    toast.success(order ? 'Order updated ♡' : 'New order saved ♡')
    onOpenChange(false)
  }

  const field = (k: keyof FormState, label: string, node: React.ReactNode, span2 = false) => (
    <div className={span2 ? 'sm:col-span-2' : undefined}>
      <Label htmlFor={`f-${k}`} className="mb-1.5 text-xs font-bold">
        {label}
      </Label>
      {node}
      {errors[k] && <p className="mt-1 text-xs font-semibold text-destructive">{errors[k]}</p>}
    </div>
  )

  const input = (k: 'customer' | 'fhName' | 'accountName', placeholder: string) => (
    <Input
      id={`f-${k}`}
      value={form[k]}
      placeholder={placeholder}
      aria-invalid={!!errors[k] || undefined}
      onChange={(e) => set(k, e.target.value)}
      className="h-11 rounded-xl"
    />
  )

  const money = (k: 'income' | 'expense' | 'discount') => (
    <div className="relative">
      <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-xs font-bold text-muted-foreground">Rp</span>
      <Input
        id={`f-${k}`}
        inputMode="numeric"
        type="number"
        min={0}
        value={form[k]}
        placeholder="0"
        aria-invalid={!!errors[k] || undefined}
        onChange={(e) => set(k, e.target.value)}
        className="h-11 rounded-xl pl-9"
      />
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto rounded-3xl sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">{order ? '✎ Edit Order' : '+ New Order'}</DialogTitle>
          <DialogDescription>
            {order ? 'Perbarui detail transaksi ini.' : 'Catat transaksi baru — Dashboard, Rekapan, dan Reminder langsung ikut update.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
          {field('customer', 'Nama Customer', input('customer', 'mis. Alya Putri'), true)}
          {field('application', 'Application', <OptionCombo id="f-application" category="application" value={form.application} onChange={(v) => set('application', v)} invalid={!!errors.application} />)}
          {field('plan', 'Plan', <OptionCombo id="f-plan" category="plan" value={form.plan} onChange={(v) => set('plan', v)} invalid={!!errors.plan} />)}
          {field('user', 'User', <OptionCombo id="f-user" category="user" value={form.user} onChange={(v) => set('user', v)} invalid={!!errors.user} />)}
          {field(
            'durationDays',
            'Durasi (hari)',
            <Input id="f-durationDays" type="number" min={1} inputMode="numeric" value={form.durationDays} aria-invalid={!!errors.durationDays || undefined} onChange={(e) => set('durationDays', e.target.value)} className="h-11 rounded-xl" />,
          )}
          {field('fhName', 'Nama FH', input('fhName', 'mis. FH Sakura'))}
          {field('accountName', 'Nama Akun', input('accountName', 'mis. nf.sakura01'))}
          {field(
            'orderDate',
            'Tanggal Order',
            <Input id="f-orderDate" type="date" value={form.orderDate} aria-invalid={!!errors.orderDate || undefined} onChange={(e) => set('orderDate', e.target.value)} className="h-11 rounded-xl" />,
          )}
          <div className="flex items-end">
            <p className="w-full rounded-xl bg-secondary/60 px-3 py-2.5 text-xs text-secondary-foreground">
              Berakhir: <b>{preview ? formatDate(preview) : '—'}</b>
              <br />
              <span className="opacity-80">Hari order dihitung sebagai hari ke-1.</span>
            </p>
          </div>
          {field('income', 'Pemasukan', money('income'))}
          {field('expense', 'Pengeluaran', money('expense'))}
          {field('discount', 'Diskon', money('discount'))}
          <div className="flex items-end">
            <p className="w-full rounded-xl bg-accent px-3 py-2.5 text-xs">
              Pendapatan bersih: <b className="text-sm">{formatIDR(net)}</b>
            </p>
          </div>
          {field(
            'notes',
            'Catatan tambahan',
            <Textarea id="f-notes" value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Opsional" className="rounded-xl" />,
            true,
          )}
          {order && (
            <label className="flex items-center gap-3 text-sm font-semibold sm:col-span-2">
              <Switch checked={form.completed} onCheckedChange={(c) => set('completed', c)} />
              Tandai order sebagai selesai (Completed)
            </label>
          )}
          <DialogFooter className="gap-2 sm:col-span-2">
            <Button type="button" variant="outline" className="h-11 rounded-xl" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="h-11 rounded-xl px-6 font-bold">
              {order ? 'Save changes' : 'Save order ♡'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
