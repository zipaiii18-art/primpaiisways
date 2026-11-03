/**
 * Seed data for the product surface.
 *
 * Everything the screens read comes from here through `src/lib/store.tsx`.
 * When the cloud database lands (see PLAN.md, milestone 2), the store swaps
 * these seeds for real queries — no screen needs to change.
 */
import { addDays, todayISO } from './calc'
import type {
  AppearanceSettings,
  OptionCategory,
  Order,
  PlaylistItem,
  Warranty,
} from './types'

export const DEFAULT_OPTIONS: Record<OptionCategory, string[]> = {
  application: [
    'Netflix', 'Disney+', 'Viu', 'YouTube', 'Prime Video', 'Vidio', 'Canva',
    'ChatGPT', 'WeTV', 'iQIYI', 'Loklok', 'HBO', 'BS Station', 'GagaOla',
    'CapCut', 'Youku', 'Claude AI',
  ],
  plan: [
    'Sharing', 'Private', 'Go sharing', 'Go private', 'Plus sharing',
    'Plus private', 'Pro', 'Education', 'STD', 'Basic', 'Premium', 'Famplan',
    'Indplan', 'Mix Plan', 'Semi private', 'Sharing basic', 'Sharing standart',
    'Private basic', 'Private standart', 'Mobile only sharing',
    'Mobile only private', 'Tv only sharing', 'Tv only private',
    'All device sharing', 'All device private',
  ],
  user: ['1p1u', '1p2u', '2u', '3u', '4u', '5u', '6u', '7u', '8u'],
}

export const FONT_OPTIONS = ['Nunito', 'Quicksand', 'Poppins', 'DM Sans', 'Lora']
export const TITLE_FONT_OPTIONS = [
  'Dancing Script',
  'Cormorant Garamond',
  'Playfair Display',
  'Lora',
  'Quicksand',
]

export const SYMBOL_CHOICES = ['♡', '✧', '𝜗𝜚', '𓆩♡𓆪', 'ꕤ', '☁️', '𑄝੭', '⭑', '✿', '❀', '☾', '♫']

export const DEFAULT_APPEARANCE: AppearanceSettings = {
  dark: false,
  bodyFont: 'Nunito',
  titleFont: 'Dancing Script',
  titleSize: 'md',
  symbols: {
    dashboard: '♡',
    rekapan: '✧',
    reminder: '𝜗𝜚',
    garansi: '𓆩♡𓆪',
    setting: 'ꕤ',
  },
}

export const SPREADSHEET_URL =
  'https://docs.google.com/spreadsheets/d/1F95-UMgaSWF8zIapli2j40NehaGPvCszQvnxsuxSmcM/edit?usp=sharing'
export const SPREADSHEET_PREVIEW_URL =
  'https://docs.google.com/spreadsheets/d/1F95-UMgaSWF8zIapli2j40NehaGPvCszQvnxsuxSmcM/preview'

type Seed = Omit<Order, 'id' | 'orderDate' | 'createdAt' | 'completed' | 'notes' | 'accountName'> & {
  daysAgo: number
  accountName?: string
  notes?: string
  completed?: boolean
}

const seeds: Seed[] = [
  { customer: 'Alya Putri', application: 'Netflix', plan: 'Sharing', user: '1p1u', durationDays: 30, fhName: 'FH Sakura', daysAgo: 27, income: 35000, expense: 22000, discount: 0, accountName: 'nf.sakura01' },
  { customer: 'Rara Anindya', application: 'Disney+', plan: 'Private', user: '1p2u', durationDays: 30, fhName: 'FH Mochi', daysAgo: 29, income: 55000, expense: 38000, discount: 5000, accountName: 'dsn.mochi' },
  { customer: 'Alya Putri', application: 'Canva', plan: 'Pro', user: '1p1u', durationDays: 30, fhName: 'FH Peony', daysAgo: 10, income: 20000, expense: 9000, discount: 0, accountName: 'canva.peony' },
  { customer: 'Nadine K.', application: 'ChatGPT', plan: 'Plus sharing', user: '3u', durationDays: 30, fhName: 'FH Lumi', daysAgo: 26, income: 75000, expense: 52000, discount: 0, accountName: 'gpt.lumi' },
  { customer: 'Salsa Ayu', application: 'Netflix', plan: 'Private', user: '1p1u', durationDays: 7, fhName: 'FH Sakura', daysAgo: 6, income: 25000, expense: 15000, discount: 2000, accountName: 'nf.sakura02' },
  { customer: 'Rara Anindya', application: 'Viu', plan: 'Premium', user: '2u', durationDays: 30, fhName: 'FH Mochi', daysAgo: 40, income: 15000, expense: 7000, discount: 0, accountName: 'viu.mochi' },
  { customer: 'Bunga Lestari', application: 'YouTube', plan: 'Famplan', user: '5u', durationDays: 30, fhName: 'FH Cotton', daysAgo: 3, income: 18000, expense: 9500, discount: 0, accountName: 'yt.cotton' },
  { customer: 'Nadine K.', application: 'Netflix', plan: 'Semi private', user: '1p2u', durationDays: 30, fhName: 'FH Sakura', daysAgo: 1, income: 42000, expense: 28000, discount: 0, accountName: 'nf.sakura03' },
  { customer: 'Keisha M.', application: 'Prime Video', plan: 'Sharing', user: '4u', durationDays: 30, fhName: 'FH Peony', daysAgo: 0, income: 17000, expense: 8000, discount: 1000, accountName: 'prime.peony' },
  { customer: 'Bunga Lestari', application: 'Claude AI', plan: 'Pro', user: '1p1u', durationDays: 30, fhName: 'FH Lumi', daysAgo: 15, income: 90000, expense: 68000, discount: 5000, accountName: 'claude.lumi' },
  { customer: 'Salsa Ayu', application: 'CapCut', plan: 'Pro', user: '1p1u', durationDays: 30, fhName: 'FH Cotton', daysAgo: 45, income: 22000, expense: 11000, discount: 0, accountName: 'capcut.cotton', completed: true },
  { customer: 'Keisha M.', application: 'WeTV', plan: 'Sharing', user: '3u', durationDays: 14, fhName: 'FH Mochi', daysAgo: 12, income: 12000, expense: 5000, discount: 0, accountName: 'wetv.mochi' },
]

export function seedOrders(): Order[] {
  const today = todayISO()
  return seeds.map((s, i) => {
    const { daysAgo, accountName, notes, completed, ...rest } = s
    const orderDate = addDays(today, -daysAgo)
    return {
      ...rest,
      id: `ord_seed_${String(i + 1).padStart(2, '0')}`,
      orderDate,
      accountName: accountName ?? '',
      notes: notes ?? '',
      completed: completed ?? false,
      createdAt: `${orderDate}T09:00:00`,
    }
  })
}

function at(dayOffset: number, hh: number, mm = 0): string {
  const d = new Date()
  d.setHours(hh, mm, 0, 0)
  d.setDate(d.getDate() + dayOffset)
  return d.toISOString()
}

export function seedWarranties(orders: Order[]): Warranty[] {
  const pick = (id: string) => orders.find((o) => o.id === id)!
  const fromOrder = (o: Order) => ({
    orderId: o.id,
    customer: o.customer,
    application: o.application,
    user: o.user,
    plan: o.plan,
    activeDurationDays: o.durationDays,
    orderDate: o.orderDate,
  })
  const list: Warranty[] = [
    {
      id: 'war_seed_01', ...fromOrder(pick('ord_seed_08')),
      reportAt: at(0, 9, 15), warrantyEndAt: at(3, 9, 15),
      issue: 'Profile terkunci, minta reset PIN.', resolved: false,
      history: [{ at: at(0, 9, 15), label: 'Report created' }], createdAt: at(0, 9, 15),
    },
    {
      id: 'war_seed_02', ...fromOrder(pick('ord_seed_04')),
      reportAt: at(-2, 14, 30), warrantyEndAt: at(0, 23, 0),
      issue: 'Akun logout sendiri dari semua device.', resolved: false,
      history: [{ at: at(-2, 14, 30), label: 'Report created' }], createdAt: at(-2, 14, 30),
    },
    {
      id: 'war_seed_03', ...fromOrder(pick('ord_seed_10')),
      reportAt: at(-1, 20, 0), warrantyEndAt: at(1, 20, 0),
      issue: 'Limit usage tidak sesuai plan.', resolved: false,
      history: [{ at: at(-1, 20, 0), label: 'Report created' }], createdAt: at(-1, 20, 0),
    },
    {
      id: 'war_seed_04', ...fromOrder(pick('ord_seed_02')),
      reportAt: at(-9, 11, 0), warrantyEndAt: at(-2, 11, 0),
      issue: 'Tidak bisa streaming di TV.', resolved: false,
      history: [{ at: at(-9, 11, 0), label: 'Report created' }], createdAt: at(-9, 11, 0),
    },
    {
      id: 'war_seed_05', ...fromOrder(pick('ord_seed_01')),
      reportAt: at(-5, 16, 45), warrantyEndAt: at(2, 16, 45),
      issue: 'Password diganti pihak lain, sudah diganti akun baru.', resolved: true,
      history: [
        { at: at(-5, 16, 45), label: 'Report created' },
        { at: at(-4, 10, 0), label: 'Marked as Completed' },
      ],
      createdAt: at(-5, 16, 45),
    },
  ]
  return list
}

export const SEED_PLAYLIST: PlaylistItem[] = [
  {
    id: 'pl_seed_1',
    title: 'Gymnopédie No.1',
    artist: 'Erik Satie (Kevin MacLeod)',
    source: 'audio',
    url: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Gymnopedie%20No%201.mp3',
    favorite: true,
  },
  {
    id: 'pl_seed_2',
    title: 'Lofi study session',
    artist: 'Lofi Girl',
    source: 'youtube',
    url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk',
    favorite: false,
  },
]
