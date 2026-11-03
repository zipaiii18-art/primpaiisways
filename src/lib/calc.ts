import type { Order, OrderStatus, Warranty, WarrantyStatus } from './types'

/** Days before expiry that count as "Renewal Soon". */
export const RENEWAL_SOON_DAYS = 3
/** Hours before warranty end that count as "Expiring Soon". */
export const WARRANTY_SOON_HOURS = 48

const DAY = 86_400_000

export function todayISO(now = new Date()): string {
  return toISODate(now)
}

export function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(iso: string, days: number): string {
  const d = parseLocalDate(iso)
  d.setDate(d.getDate() + days)
  return toISODate(d)
}

/** Whole local-calendar days from a to b. */
export function daysBetween(a: string, b: string): number {
  return Math.round((parseLocalDate(b).getTime() - parseLocalDate(a).getTime()) / DAY)
}

/** Expiry = order date + duration − 1 (order day is day 1). */
export function expiryDate(order: Pick<Order, 'orderDate' | 'durationDays'>): string {
  return addDays(order.orderDate, Math.max(1, order.durationDays) - 1)
}

/** Days remaining including today; 0 once expired. */
export function remainingDays(order: Order, today = todayISO()): number {
  return Math.max(0, daysBetween(today, expiryDate(order)) + 1)
}

export function orderStatus(order: Order, today = todayISO()): OrderStatus {
  if (order.completed) return 'Completed'
  const diff = daysBetween(today, expiryDate(order))
  if (diff < 0) return 'Expired'
  if (diff === 0) return 'Expiring Today'
  if (diff <= RENEWAL_SOON_DAYS) return 'Renewal Soon'
  return 'Active'
}

export const orderStatusTone: Record<OrderStatus, string> = {
  'Expiring Today': 'pw-blue',
  'Renewal Soon': 'pw-yellow',
  Active: 'pw-green',
  Expired: 'pw-grey',
  Completed: 'pw-grey',
}

export function netIncome(o: Pick<Order, 'income' | 'expense' | 'discount'>) {
  return o.income - o.expense - o.discount
}

export function warrantyStatus(w: Warranty, now = new Date()): WarrantyStatus {
  if (w.resolved) return 'Completed'
  const end = new Date(w.warrantyEndAt)
  const ms = end.getTime() - now.getTime()
  if (ms <= 0) return 'Expired Warranty'
  if (toISODate(end) === toISODate(now)) return 'Expiring Today'
  if (ms <= WARRANTY_SOON_HOURS * 3_600_000) return 'Expiring Soon'
  return 'Active Warranty'
}

export const warrantyStatusTone: Record<WarrantyStatus, string> = {
  'Active Warranty': 'pw-blue',
  'Expiring Soon': 'pw-yellow',
  'Expiring Today': 'pw-pink',
  'Expired Warranty': 'pw-grey',
  Completed: 'pw-green',
}

export function warrantyCountdown(w: Warranty, now = new Date()): string {
  const ms = new Date(w.warrantyEndAt).getTime() - now.getTime()
  if (ms <= 0) return 'Expired'
  const hours = Math.floor(ms / 3_600_000)
  if (hours >= 24) {
    const days = Math.floor(hours / 24)
    return `${days} day${days === 1 ? '' : 's'} left`
  }
  if (hours >= 1) return `${hours} hour${hours === 1 ? '' : 's'} left`
  const mins = Math.max(1, Math.floor(ms / 60_000))
  return `${mins} min left`
}

const idr = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})
export const formatIDR = (n: number) => idr.format(n)

const monthsId = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

export function formatDate(iso: string): string {
  const d = parseLocalDate(iso)
  return `${String(d.getDate()).padStart(2, '0')} ${monthsId[d.getMonth()]} ${d.getFullYear()}`
}

export function formatShortDate(iso: string): string {
  const d = parseLocalDate(iso)
  return `${String(d.getDate()).padStart(2, '0')} ${monthsId[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`
}

/** e.g. "03 November 2026 · 14:30" */
export function formatDateTime(isoTs: string): string {
  const d = new Date(isoTs)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${formatDate(toISODate(d))} · ${hh}:${mm}`
}

/** Value for <input type="datetime-local">. */
export function toLocalInput(isoTs: string): string {
  const d = new Date(isoTs)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${toISODate(d)}T${hh}:${mm}`
}

/** Returns every entry that shares the highest count (ties included). */
export function topByCount(values: string[]): { names: string[]; count: number } {
  const counts = new Map<string, number>()
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1)
  let max = 0
  for (const c of counts.values()) max = Math.max(max, c)
  const names = [...counts.entries()].filter(([, c]) => c === max && max > 0).map(([n]) => n)
  return { names, count: max }
}

/** Client-generated UUID — doubles as the database primary key (idempotent inserts). */
export function uid(_prefix?: string): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  // RFC 4122 v4 fallback for very old browsers.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}
