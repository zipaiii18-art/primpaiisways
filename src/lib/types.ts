export type OptionCategory = 'application' | 'plan' | 'user'

export interface CustomOption {
  id: string
  category: OptionCategory
  name: string
}

export interface Order {
  id: string
  customer: string
  /** Text snapshots — renaming a custom option never rewrites history. */
  application: string
  plan: string
  user: string
  durationDays: number
  fhName: string
  accountName: string
  /** Local calendar date, YYYY-MM-DD. Day of order counts as day 1. */
  orderDate: string
  income: number
  expense: number
  discount: number
  notes: string
  /** Manually marked as finished before the expiry date. */
  completed: boolean
  createdAt: string
}

export type OrderStatus =
  | 'Active'
  | 'Renewal Soon'
  | 'Expiring Today'
  | 'Expired'
  | 'Completed'

export interface WarrantyHistoryEntry {
  at: string
  label: string
}

export interface Warranty {
  id: string
  /** Link to the source order; null when entered manually or the order was removed. */
  orderId: string | null
  customer: string
  application: string
  user: string
  plan: string
  activeDurationDays: number
  orderDate: string
  /** ISO timestamps. */
  reportAt: string
  warrantyEndAt: string
  issue: string
  resolved: boolean
  history: WarrantyHistoryEntry[]
  createdAt: string
}

export type WarrantyStatus =
  | 'Active Warranty'
  | 'Expiring Soon'
  | 'Expiring Today'
  | 'Expired Warranty'
  | 'Completed'

export type MusicSource = 'audio' | 'spotify' | 'youtube'

export interface PlaylistItem {
  id: string
  title: string
  artist: string
  source: MusicSource
  url: string
  favorite: boolean
}

export type NavKey = 'dashboard' | 'rekapan' | 'reminder' | 'garansi' | 'setting'

export interface AppearanceSettings {
  dark: boolean
  bodyFont: string
  titleFont: string
  titleSize: 'sm' | 'md' | 'lg'
  symbols: Record<NavKey, string>
}
