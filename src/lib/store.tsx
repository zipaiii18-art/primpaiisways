import * as React from 'react'
import { uid } from './calc'
import {
  DEFAULT_APPEARANCE,
  DEFAULT_OPTIONS,
  SEED_PLAYLIST,
  seedOrders,
  seedWarranties,
} from './fixtures'
import type {
  AppearanceSettings,
  CustomOption,
  OptionCategory,
  Order,
  PlaylistItem,
  Warranty,
} from './types'

/**
 * Single data boundary for every screen. Today it holds seeded, in-session
 * state; the cloud-database milestone replaces the bodies of these actions
 * with real queries + realtime subscriptions while keeping the same API.
 */
interface Store {
  orders: Order[]
  warranties: Warranty[]
  customOptions: CustomOption[]
  playlist: PlaylistItem[]
  appearance: AppearanceSettings
  appsScriptUrl: string
  now: Date

  saveOrder: (order: Omit<Order, 'id' | 'createdAt'> & { id?: string }) => Order
  deleteOrder: (id: string) => void
  saveWarranty: (w: Omit<Warranty, 'id' | 'createdAt' | 'history'> & { id?: string }) => void
  setWarrantyResolved: (id: string, resolved: boolean) => void
  deleteWarranty: (id: string) => void

  optionsFor: (category: OptionCategory) => { name: string; custom?: CustomOption }[]
  addOption: (category: OptionCategory, name: string) => string | null
  renameOption: (id: string, name: string) => string | null
  deleteOption: (id: string) => void

  setPlaylist: React.Dispatch<React.SetStateAction<PlaylistItem[]>>
  setAppearance: (patch: Partial<AppearanceSettings>) => void
  setAppsScriptUrl: (url: string) => void
}

const StoreContext = React.createContext<Store | null>(null)

const APPEARANCE_KEY = 'pw.appearance'
const SHEETS_KEY = 'pw.appsScriptUrl'

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = React.useState<Order[]>(seedOrders)
  const [warranties, setWarranties] = React.useState<Warranty[]>(() =>
    seedWarranties(seedOrders()),
  )
  const [customOptions, setCustomOptions] = React.useState<CustomOption[]>([
    { id: 'opt_seed_1', category: 'application', name: 'Spotify' },
    { id: 'opt_seed_2', category: 'plan', name: 'Duo plan' },
  ])
  const [playlist, setPlaylist] = React.useState<PlaylistItem[]>(SEED_PLAYLIST)
  const [appearance, setAppearanceState] =
    React.useState<AppearanceSettings>(DEFAULT_APPEARANCE)
  const [appsScriptUrl, setAppsScriptUrlState] = React.useState('')
  const [now, setNow] = React.useState(() => new Date())

  // Local preferences (cache only) — read after mount to keep SSR in sync.
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(APPEARANCE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<AppearanceSettings>
        setAppearanceState((a) => ({
          ...a,
          ...parsed,
          symbols: { ...a.symbols, ...(parsed.symbols ?? {}) },
        }))
      }
      setAppsScriptUrlState(localStorage.getItem(SHEETS_KEY) ?? '')
    } catch {
      /* ignore corrupted cache */
    }
  }, [])

  // Keep countdowns and day-based statuses fresh.
  React.useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(t)
  }, [])

  React.useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', appearance.dark)
    root.style.setProperty('--font-body', `'${appearance.bodyFont}', ui-sans-serif, system-ui, sans-serif`)
    root.style.setProperty('--font-title', `'${appearance.titleFont}', 'Lora', serif`)
  }, [appearance])

  const setAppearance = React.useCallback((patch: Partial<AppearanceSettings>) => {
    setAppearanceState((a) => {
      const next = { ...a, ...patch }
      try {
        localStorage.setItem(APPEARANCE_KEY, JSON.stringify(next))
      } catch {
        /* storage unavailable */
      }
      return next
    })
  }, [])

  const setAppsScriptUrl = React.useCallback((url: string) => {
    setAppsScriptUrlState(url)
    try {
      localStorage.setItem(SHEETS_KEY, url)
    } catch {
      /* storage unavailable */
    }
  }, [])

  const saveOrder: Store['saveOrder'] = (input) => {
    if (input.id) {
      const existing = orders.find((o) => o.id === input.id)
      const updated = { ...(existing as Order), ...input } as Order
      setOrders((list) => list.map((o) => (o.id === input.id ? updated : o)))
      return updated
    }
    const created: Order = { ...input, id: uid('ord'), createdAt: new Date().toISOString() }
    setOrders((list) => [created, ...list])
    return created
  }

  const deleteOrder = (id: string) => {
    setOrders((list) => list.filter((o) => o.id !== id))
    // Warranty reports survive: they keep their snapshot, only the link is cleared.
    setWarranties((list) => list.map((w) => (w.orderId === id ? { ...w, orderId: null } : w)))
  }

  const saveWarranty: Store['saveWarranty'] = (input) => {
    const ts = new Date().toISOString()
    if (input.id) {
      setWarranties((list) =>
        list.map((w) =>
          w.id === input.id
            ? { ...w, ...input, history: [...w.history, { at: ts, label: 'Report edited' }] }
            : w,
        ),
      )
      return
    }
    setWarranties((list) => [
      { ...input, id: uid('war'), createdAt: ts, history: [{ at: ts, label: 'Report created' }] },
      ...list,
    ])
  }

  const setWarrantyResolved = (id: string, resolved: boolean) => {
    const ts = new Date().toISOString()
    setWarranties((list) =>
      list.map((w) =>
        w.id === id
          ? {
              ...w,
              resolved,
              history: [...w.history, { at: ts, label: resolved ? 'Marked as Completed' : 'Reopened' }],
            }
          : w,
      ),
    )
  }

  const deleteWarranty = (id: string) => setWarranties((list) => list.filter((w) => w.id !== id))

  const optionsFor = (category: OptionCategory) => [
    ...DEFAULT_OPTIONS[category].map((name) => ({ name })),
    ...customOptions.filter((c) => c.category === category).map((c) => ({ name: c.name, custom: c })),
  ]

  const isDuplicate = (category: OptionCategory, name: string, exceptId?: string) => {
    const n = name.trim().toLowerCase()
    return (
      DEFAULT_OPTIONS[category].some((d) => d.toLowerCase() === n) ||
      customOptions.some((c) => c.category === category && c.id !== exceptId && c.name.toLowerCase() === n)
    )
  }

  const addOption = (category: OptionCategory, name: string) => {
    const clean = name.trim()
    if (!clean) return 'Nama tidak boleh kosong.'
    if (isDuplicate(category, clean)) return `"${clean}" sudah ada di daftar.`
    setCustomOptions((list) => [...list, { id: uid('opt'), category, name: clean }])
    return null
  }

  const renameOption = (id: string, name: string) => {
    const clean = name.trim()
    const opt = customOptions.find((c) => c.id === id)
    if (!opt) return 'Pilihan tidak ditemukan.'
    if (!clean) return 'Nama tidak boleh kosong.'
    if (isDuplicate(opt.category, clean, id)) return `"${clean}" sudah ada di daftar.`
    setCustomOptions((list) => list.map((c) => (c.id === id ? { ...c, name: clean } : c)))
    return null
  }

  const deleteOption = (id: string) => setCustomOptions((list) => list.filter((c) => c.id !== id))

  const value: Store = {
    orders, warranties, customOptions, playlist, appearance, appsScriptUrl, now,
    saveOrder, deleteOrder, saveWarranty, setWarrantyResolved, deleteWarranty,
    optionsFor, addOption, renameOption, deleteOption,
    setPlaylist, setAppearance, setAppsScriptUrl,
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): Store {
  const ctx = React.useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>')
  return ctx
}
