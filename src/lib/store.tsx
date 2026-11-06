import * as React from 'react'
import { uid } from './calc'
import { DEFAULT_APPEARANCE, DEFAULT_OPTIONS } from './fixtures'
import { getSupabase } from './supabase'
import { toast } from 'sonner'
import { useAuth } from './auth'
import type { AppearanceSettings, CustomOption, OptionCategory, Order, PlaylistItem, Warranty } from './types'

interface Store {
  orders: Order[]; warranties: Warranty[]; customOptions: CustomOption[]; playlist: PlaylistItem[]
  appearance: AppearanceSettings; appsScriptUrl: string; now: Date; loading: boolean; loadError: string | null
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

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { user, status } = useAuth()
  const [orders, setOrders] = React.useState<Order[]>([])
  const [warranties, setWarranties] = React.useState<Warranty[]>([])
  const [customOptions, setCustomOptions] = React.useState<CustomOption[]>([])
  const [playlistState, setPlaylistState] = React.useState<PlaylistItem[]>([])
  const [appearance, setAppearanceState] = React.useState<AppearanceSettings>(DEFAULT_APPEARANCE)
  const [appsScriptUrl, setAppsScriptUrlState] = React.useState('')
  const [now, setNow] = React.useState(() => new Date())
  const [loading, setLoading] = React.useState(false)
  const [loadError, setLoadError] = React.useState<string | null>(null)
  const ready = React.useRef(false)
  const userId = user?.id ?? null

  React.useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(timer)
  }, [])

  // Load each account's private records before enabling persistence writes.
  React.useEffect(() => {
    let cancelled = false
    ready.current = false
    setLoadError(null)
    setOrders([]); setWarranties([]); setCustomOptions([]); setPlaylistState([])
    if (status !== 'signedIn' || !userId) { setLoading(false); return }
    setLoading(true)
    const load = async () => {
      const sb = getSupabase()
      const [o, w, c, p, s] = await Promise.all([
        sb.from('orders').select('*').order('created_at', { ascending: false }),
        sb.from('warranties').select('*').order('created_at', { ascending: false }),
        sb.from('custom_options').select('*').order('created_at'),
        sb.from('playlist_items').select('*').order('position'),
        sb.from('user_settings').select('*').maybeSingle(),
      ])
      const firstError = [o.error, w.error, c.error, p.error, s.error].find(Boolean)
      if (firstError) throw firstError
      if (cancelled) return
      setOrders((o.data ?? []).map((r: any) => ({ id:r.id, customer:r.customer, application:r.application, plan:r.plan, user:r.user_type, durationDays:r.duration_days, fhName:r.fh_name, accountName:r.account_name, orderDate:r.order_date, income:Number(r.income), expense:Number(r.expense), discount:Number(r.discount), notes:r.notes, completed:r.completed, createdAt:r.created_at })))
      setWarranties((w.data ?? []).map((r: any) => ({ id:r.id, orderId:r.order_id, customer:r.customer, application:r.application, user:r.user_type, plan:r.plan, activeDurationDays:r.active_duration_days, orderDate:r.order_date ?? '', reportAt:r.report_at, warrantyEndAt:r.warranty_end_at, issue:r.issue, resolved:r.resolved, history:r.history ?? [], createdAt:r.created_at })))
      setCustomOptions((c.data ?? []).map((r: any) => ({ id:r.id, category:r.category, name:r.name })))
      setPlaylistState((p.data ?? []).map((r: any) => ({ id:r.id, title:r.title, artist:r.artist, source:r.source, url:r.url, favorite:r.favorite })))
      if (s.data) {
        setAppearanceState({ ...DEFAULT_APPEARANCE, ...(s.data.appearance ?? {}), symbols:{ ...DEFAULT_APPEARANCE.symbols, ...(s.data.appearance?.symbols ?? {}) } })
        setAppsScriptUrlState(s.data.apps_script_url ?? '')
      } else { setAppearanceState(DEFAULT_APPEARANCE); setAppsScriptUrlState('') }
      ready.current = true
      setLoading(false)
    }
    load().catch((error) => { console.error('Gagal memuat data Supabase:', error); if (!cancelled) { setLoadError(error instanceof Error ? error.message : 'Tidak dapat memuat data dari Supabase.'); setLoading(false) } })
    return () => { cancelled = true }
  }, [status, userId])

  React.useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', appearance.dark)
    root.style.setProperty('--font-body', `'${appearance.bodyFont}', ui-sans-serif, system-ui, sans-serif`)
    root.style.setProperty('--font-title', `'${appearance.titleFont}', 'Lora', serif`)
  }, [appearance])

  // Persist the complete account snapshot after each local change. RLS scopes all writes to auth.uid().
  React.useEffect(() => {
    if (!ready.current || !userId) return
    const rows = orders.map(o => ({ id:o.id, user_id:userId, customer:o.customer, application:o.application, plan:o.plan, user_type:o.user, duration_days:o.durationDays, fh_name:o.fhName, account_name:o.accountName, order_date:o.orderDate, income:o.income, expense:o.expense, discount:o.discount, notes:o.notes, completed:o.completed, created_at:o.createdAt }))
    void getSupabase().from('orders').upsert(rows).then(({ error }) => { if (error) { console.error('Gagal menyimpan pesanan:', error); toast.error('Pesanan belum tersimpan ke cloud. Periksa koneksi dan database.') } })
  }, [orders, userId])
  React.useEffect(() => {
    if (!ready.current || !userId) return
    const rows = warranties.map(w => ({ id:w.id, user_id:userId, order_id:w.orderId, customer:w.customer, application:w.application, user_type:w.user, plan:w.plan, active_duration_days:w.activeDurationDays, order_date:w.orderDate || null, report_at:w.reportAt, warranty_end_at:w.warrantyEndAt, issue:w.issue, resolved:w.resolved, history:w.history, created_at:w.createdAt }))
    void getSupabase().from('warranties').upsert(rows).then(({ error }) => { if (error) { console.error('Gagal menyimpan garansi:', error); toast.error('Data garansi belum tersimpan ke cloud.') } })
  }, [warranties, userId])
  React.useEffect(() => {
    if (!ready.current || !userId) return
    const rows = customOptions.map(c => ({ id:c.id, user_id:userId, category:c.category, name:c.name }))
    void getSupabase().from('custom_options').upsert(rows).then(({ error }) => { if (error) { console.error('Gagal menyimpan pilihan:', error); toast.error('Pilihan dropdown belum tersimpan ke cloud.') } })
  }, [customOptions, userId])
  React.useEffect(() => {
    if (!ready.current || !userId) return
    const rows = playlistState.map((p, position) => ({ id:p.id, user_id:userId, title:p.title, artist:p.artist, source:p.source, url:p.url, favorite:p.favorite, position }))
    void getSupabase().from('playlist_items').upsert(rows).then(({ error }) => { if (error) { console.error('Gagal menyimpan playlist:', error); toast.error('Playlist belum tersimpan ke cloud.') } })
  }, [playlistState, userId])
  React.useEffect(() => {
    if (!ready.current || !userId) return
    void getSupabase().from('user_settings').upsert({ user_id:userId, appearance, apps_script_url:appsScriptUrl }).then(({ error }) => { if (error) { console.error('Gagal menyimpan pengaturan:', error); toast.error('Pengaturan belum tersimpan ke cloud.') } })
  }, [appearance, appsScriptUrl, userId])

  const saveOrder: Store['saveOrder'] = (input) => {
    const existing = input.id ? orders.find(o => o.id === input.id) : undefined
    const value: Order = { ...input, id: input.id ?? uid(), createdAt: existing?.createdAt ?? new Date().toISOString() }
    setOrders(list => input.id ? list.map(o => o.id === input.id ? value : o) : [value, ...list])
    return value
  }
  const deleteOrder = (id: string) => {
    setOrders(list => list.filter(o => o.id !== id))
    setWarranties(list => list.map(w => w.orderId === id ? { ...w, orderId:null } : w))
    if (userId) void getSupabase().from('orders').delete().eq('id', id).then(({ error }) => { if (error) toast.error('Pesanan gagal dihapus dari cloud.') })
  }
  const saveWarranty: Store['saveWarranty'] = (input) => {
    const ts = new Date().toISOString()
    setWarranties(list => {
      if (input.id) return list.map(w => w.id === input.id ? { ...w, ...input, history:[...w.history, { at:ts, label:'Report edited' }] } : w)
      return [{ ...input, id:uid(), createdAt:ts, history:[{ at:ts, label:'Report created' }] }, ...list]
    })
  }
  const setWarrantyResolved = (id: string, resolved: boolean) => {
    const ts = new Date().toISOString()
    setWarranties(list => list.map(w => w.id === id ? { ...w, resolved, history:[...w.history, { at:ts, label:resolved ? 'Marked as Completed' : 'Reopened' }] } : w))
  }
  const deleteWarranty = (id: string) => { setWarranties(list => list.filter(w => w.id !== id)); if (userId) void getSupabase().from('warranties').delete().eq('id', id).then(({ error }) => { if (error) toast.error('Garansi gagal dihapus dari cloud.') }) }
  const optionsFor = (category: OptionCategory) => [...DEFAULT_OPTIONS[category].map(name => ({ name })), ...customOptions.filter(c => c.category === category).map(custom => ({ name:custom.name, custom }))]
  const isDuplicate = (category: OptionCategory, name: string, exceptId?: string) => DEFAULT_OPTIONS[category].some(d => d.toLowerCase() === name.trim().toLowerCase()) || customOptions.some(c => c.category === category && c.id !== exceptId && c.name.toLowerCase() === name.trim().toLowerCase())
  const addOption = (category: OptionCategory, name: string) => { const clean=name.trim(); if (!clean) return 'Nama tidak boleh kosong.'; if (isDuplicate(category, clean)) return `"${clean}" sudah ada di daftar.`; setCustomOptions(list => [...list, { id:uid(), category, name:clean }]); return null }
  const renameOption = (id: string, name: string) => { const clean=name.trim(); const opt=customOptions.find(c => c.id===id); if (!opt) return 'Pilihan tidak ditemukan.'; if (!clean) return 'Nama tidak boleh kosong.'; if (isDuplicate(opt.category, clean, id)) return `"${clean}" sudah ada di daftar.`; setCustomOptions(list => list.map(c => c.id===id ? { ...c, name:clean } : c)); return null }
  const deleteOption = (id: string) => { setCustomOptions(list => list.filter(c => c.id!==id)); if (userId) void getSupabase().from('custom_options').delete().eq('id', id).then(({ error }) => { if (error) toast.error('Pilihan gagal dihapus dari cloud.') }) }
  const setPlaylist: React.Dispatch<React.SetStateAction<PlaylistItem[]>> = action => {
    const next = typeof action === 'function' ? action(playlistState) : action
    const removed = playlistState.filter(item => !next.some(candidate => candidate.id === item.id))
    if (userId && removed.length) void getSupabase().from('playlist_items').delete().in('id', removed.map(item => item.id)).then(({ error }) => { if (error) toast.error('Playlist gagal diperbarui di cloud.') })
    setPlaylistState(next)
  }
  const setAppearance = (patch: Partial<AppearanceSettings>) => setAppearanceState(a => ({ ...a, ...patch }))
  const setAppsScriptUrl = (url: string) => setAppsScriptUrlState(url)
  const value: Store = { orders,warranties,customOptions,playlist:playlistState,appearance,appsScriptUrl,now,loading,loadError,saveOrder,deleteOrder,saveWarranty,setWarrantyResolved,deleteWarranty,optionsFor,addOption,renameOption,deleteOption,setPlaylist,setAppearance,setAppsScriptUrl }
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}
export function useStore(): Store { const ctx=React.useContext(StoreContext); if (!ctx) throw new Error('useStore must be used inside <StoreProvider>'); return ctx }
