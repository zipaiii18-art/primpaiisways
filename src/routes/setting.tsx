import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { ArrowDown, ArrowUp, Download, ExternalLink, Heart, Pause, Pencil, Play, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BrandTitle, NAV, PageHeader } from '@/components/app-shell'
import { EmbedFrame, PlayerControls, isAudioUrl, spotifyEmbed, useMusic, youtubeEmbed } from '@/components/music-player'
import { FONT_OPTIONS, SPREADSHEET_PREVIEW_URL, SPREADSHEET_URL, SYMBOL_CHOICES, TITLE_FONT_OPTIONS } from '@/lib/fixtures'
import { expiryDate, netIncome, orderStatus, uid } from '@/lib/calc'
import { useStore } from '@/lib/store'
import type { MusicSource } from '@/lib/types'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/setting')({
  head: () => ({ meta: [{ title: "Setting · Primpaii's Way" }] }),
  component: Setting,
})

function Section({ title, desc, children, className }: { title: string; desc?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn('pw-card p-4 sm:p-6', className)}>
      <h2 className="font-display text-lg font-extrabold">{title}</h2>
      {desc && <p className="mb-4 text-sm text-muted-foreground">{desc}</p>}
      {children}
    </section>
  )
}

function Setting() {
  const { appearance } = useStore()
  return (
    <div>
      <PageHeader symbol={appearance.symbols.setting} title="Setting" subtitle="Atur tampilan, musik, spreadsheet, dan backup data." />
      <Tabs defaultValue="appearance">
        <TabsList className="mb-4 grid h-auto w-full grid-cols-2 gap-1 rounded-2xl p-1 sm:inline-flex sm:w-auto">
          <TabsTrigger value="appearance" className="rounded-xl py-2">✿ Appearance</TabsTrigger>
          <TabsTrigger value="playlist" className="rounded-xl py-2">♫ My Little Playlist</TabsTrigger>
          <TabsTrigger value="sheets" className="rounded-xl py-2">▦ Spreadsheet</TabsTrigger>
          <TabsTrigger value="backup" className="rounded-xl py-2">☁️ Backup</TabsTrigger>
        </TabsList>
        <TabsContent value="appearance"><Appearance /></TabsContent>
        <TabsContent value="playlist"><Playlist /></TabsContent>
        <TabsContent value="sheets"><Sheets /></TabsContent>
        <TabsContent value="backup"><Backup /></TabsContent>
      </Tabs>
    </div>
  )
}

function Appearance() {
  const { appearance, setAppearance } = useStore()
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Section title="Theme & font" desc="Tersimpan otomatis di perangkat ini.">
        <label className="mb-5 flex items-center justify-between gap-3 rounded-2xl bg-muted/50 p-3 text-sm font-bold">
          <span>{appearance.dark ? '☾ Dark Mode' : '☀︎ Light Mode'}</span>
          <Switch checked={appearance.dark} onCheckedChange={(dark) => setAppearance({ dark })} aria-label="Dark mode" />
        </label>
        <p className="mb-2 text-xs font-bold text-muted-foreground">Font isi</p>
        <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {FONT_OPTIONS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setAppearance({ bodyFont: f })}
              aria-pressed={appearance.bodyFont === f}
              style={{ fontFamily: `'${f}'` }}
              className={cn('rounded-xl border p-3 text-left text-sm', appearance.bodyFont === f ? 'border-primary bg-accent' : 'border-border hover:bg-accent/40')}
            >
              <span className="block font-bold">{f}</span>
              <span className="text-xs text-muted-foreground">Aa Bb 123</span>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Title appearance" desc="Font dan ukuran judul Primpaii's Way.">
        <div className="mb-4 rounded-2xl bg-[var(--pw-blush)]/60 py-5 dark:bg-accent">
          <BrandTitle />
        </div>
        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {TITLE_FONT_OPTIONS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setAppearance({ titleFont: f })}
              aria-pressed={appearance.titleFont === f}
              className={cn('rounded-xl border p-2 text-lg', appearance.titleFont === f ? 'border-primary bg-accent' : 'border-border hover:bg-accent/40')}
              style={{ fontFamily: `'${f}'` }}
            >
              Primpaii&apos;s
              <span className="block font-sans text-[10px] text-muted-foreground">{f}</span>
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {(['sm', 'md', 'lg'] as const).map((s) => (
            <Button key={s} variant={appearance.titleSize === s ? 'default' : 'outline'} size="sm" className="rounded-xl" onClick={() => setAppearance({ titleSize: s })}>
              {s === 'sm' ? 'Small' : s === 'md' ? 'Medium' : 'Large'}
            </Button>
          ))}
        </div>
      </Section>

      <Section title="Toolbar symbols" desc="Pilih simbol untuk setiap menu.">
        <div className="flex flex-col gap-3">
          {NAV.map((n) => (
            <div key={n.key} className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <span className="w-24 text-sm font-bold">{n.label}</span>
              <div className="flex flex-wrap gap-1">
                {SYMBOL_CHOICES.map((sym) => (
                  <button
                    key={sym}
                    type="button"
                    aria-label={`Use ${sym} for ${n.label}`}
                    aria-pressed={appearance.symbols[n.key] === sym}
                    onClick={() => setAppearance({ symbols: { ...appearance.symbols, [n.key]: sym } })}
                    className={cn('grid h-9 min-w-9 place-items-center rounded-lg border px-1.5 text-sm', appearance.symbols[n.key] === sym ? 'border-primary bg-accent' : 'border-border hover:bg-accent/40')}
                  >
                    {sym}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  )
}

function validate(source: MusicSource, url: string): string | null {
  if (!url.trim()) return 'Link wajib diisi.'
  if (source === 'audio' && !isAudioUrl(url)) return 'Gunakan link audio langsung yang berakhiran .mp3, .wav, atau .ogg.'
  if (source === 'spotify' && !spotifyEmbed(url)) return 'Link Spotify tidak dikenali (track, album, playlist, atau podcast).'
  if (source === 'youtube' && !youtubeEmbed(url)) return 'Link YouTube tidak dikenali (video atau playlist).'
  return null
}

function Playlist() {
  const { playlist, setPlaylist } = useStore()
  const music = useMusic()
  const [source, setSource] = React.useState<MusicSource>('audio')
  const [title, setTitle] = React.useState('')
  const [artist, setArtist] = React.useState('')
  const [url, setUrl] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)
  const [renaming, setRenaming] = React.useState<{ id: string; title: string } | null>(null)

  const add = (e: React.FormEvent) => {
    e.preventDefault()
    const err = !title.trim() ? 'Nama lagu wajib diisi.' : validate(source, url)
    setError(err)
    if (err) return
    setPlaylist((p) => [...p, { id: uid('pl'), title: title.trim(), artist: artist.trim() || '—', source, url: url.trim(), favorite: false }])
    setTitle('')
    setArtist('')
    setUrl('')
    toast.success('Added to playlist ♫')
  }

  const move = (i: number, d: -1 | 1) =>
    setPlaylist((p) => {
      const j = i + d
      if (j < 0 || j >= p.length) return p
      const next = [...p]
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })

  const openUrl = music.current?.url ?? null

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <div className="flex flex-col gap-4 lg:col-span-2">
        <Section title="♫ Now playing">
          <p className="truncate font-bold">{music.current?.title ?? 'Nothing playing'}</p>
          <p className="mb-3 truncate text-xs text-muted-foreground">{music.current ? `${music.current.artist} · ${music.current.source}` : 'Tekan Play pada lagu di playlist. Tidak ada autoplay.'}</p>
          <div className="mb-3"><EmbedFrame /></div>
          <PlayerControls full />
          {openUrl && music.current?.source !== 'audio' && (
            <Button asChild variant="outline" size="sm" className="mt-3 rounded-xl">
              <a href={openUrl} target="_blank" rel="noreferrer">
                <ExternalLink /> Open {music.current?.source === 'spotify' ? 'Spotify' : 'YouTube'}
              </a>
            </Button>
          )}
        </Section>

        <Section title="Add to playlist" desc="Prioritas: Custom Audio URL. Spotify & YouTube memakai embed resmi.">
          <div className="mb-3 grid grid-cols-3 gap-1 rounded-2xl bg-muted p-1 text-xs font-bold">
            {(['audio', 'spotify', 'youtube'] as const).map((s) => (
              <button key={s} type="button" onClick={() => { setSource(s); setError(null) }} className={cn('rounded-xl py-2', source === s ? 'bg-card shadow-sm' : 'text-muted-foreground')} aria-pressed={source === s}>
                {s === 'audio' ? 'Audio URL' : s === 'spotify' ? 'Spotify' : 'YouTube'}
              </button>
            ))}
          </div>
          <form onSubmit={add} noValidate className="flex flex-col gap-3">
            <div>
              <Label htmlFor="pl-title" className="mb-1.5 text-xs font-bold">Nama Lagu</Label>
              <Input id="pl-title" value={title} onChange={(e) => setTitle(e.target.value)} className="h-11 rounded-xl" />
            </div>
            <div>
              <Label htmlFor="pl-artist" className="mb-1.5 text-xs font-bold">Nama Penyanyi</Label>
              <Input id="pl-artist" value={artist} onChange={(e) => setArtist(e.target.value)} className="h-11 rounded-xl" />
            </div>
            <div>
              <Label htmlFor="pl-url" className="mb-1.5 text-xs font-bold">
                {source === 'audio' ? 'Direct Audio URL (MP3 / WAV / OGG)' : source === 'spotify' ? 'Link Spotify (lagu, album, playlist, podcast)' : 'Link YouTube / YouTube Music (video atau playlist)'}
              </Label>
              <Input id="pl-url" type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" className="h-11 rounded-xl" />
            </div>
            {error && <p className="text-xs font-semibold text-destructive">{error}</p>}
            <Button type="submit" className="h-11 rounded-xl font-bold">Add to Playlist</Button>
          </form>
        </Section>
      </div>

      <Section title="My Little Playlist ♡" desc={`${playlist.length} lagu`} className="lg:col-span-3">
        <ul className="flex flex-col gap-2">
          {playlist.map((p, i) => {
            const isCurrent = music.current?.id === p.id
            return (
              <li key={p.id} className={cn('flex items-center gap-2 rounded-2xl border p-2', isCurrent ? 'border-primary bg-accent/60' : 'border-border')}>
                <Button
                  size="icon"
                  className="shrink-0 rounded-full"
                  aria-label={isCurrent && music.playing ? `Pause ${p.title}` : `Play ${p.title}`}
                  onClick={() => (isCurrent ? music.toggle() : music.play(p.id))}
                >
                  {isCurrent && music.playing ? <Pause /> : <Play />}
                </Button>
                <div className="min-w-0 flex-1">
                  {renaming?.id === p.id ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault()
                        if (!renaming.title.trim()) return
                        setPlaylist((list) => list.map((x) => (x.id === p.id ? { ...x, title: renaming.title.trim() } : x)))
                        setRenaming(null)
                      }}
                    >
                      <Input autoFocus value={renaming.title} onChange={(e) => setRenaming({ ...renaming, title: e.target.value })} onBlur={() => setRenaming(null)} className="h-8" aria-label="Rename song" />
                    </form>
                  ) : (
                    <p className="truncate text-sm font-bold">{p.title}</p>
                  )}
                  <p className="truncate text-xs text-muted-foreground">
                    {p.artist} · <span className="uppercase">{p.source === 'audio' ? 'audio url' : p.source}</span>
                  </p>
                </div>
                <div className="flex shrink-0 items-center">
                  <Button size="icon-sm" variant="ghost" aria-label={p.favorite ? 'Unfavorite' : 'Favorite'} onClick={() => setPlaylist((l) => l.map((x) => (x.id === p.id ? { ...x, favorite: !x.favorite } : x)))}>
                    <Heart className={cn(p.favorite && 'fill-[var(--pw-sweet)] text-[var(--pw-sweet)]')} />
                  </Button>
                  <Button size="icon-sm" variant="ghost" aria-label="Rename" onClick={() => setRenaming({ id: p.id, title: p.title })}><Pencil /></Button>
                  <Button size="icon-sm" variant="ghost" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp /></Button>
                  <Button size="icon-sm" variant="ghost" aria-label="Move down" disabled={i === playlist.length - 1} onClick={() => move(i, 1)}><ArrowDown /></Button>
                  <Button size="icon-sm" variant="ghost" aria-label={`Delete ${p.title}`} onClick={() => { if (confirm(`Hapus "${p.title}" dari playlist?`)) setPlaylist((l) => l.filter((x) => x.id !== p.id)) }}><Trash2 /></Button>
                </div>
              </li>
            )
          })}
          {playlist.length === 0 && <li className="py-8 text-center text-sm text-muted-foreground">Playlist masih kosong ♫</li>}
        </ul>
      </Section>
    </div>
  )
}

function Sheets() {
  const { appsScriptUrl, setAppsScriptUrl } = useStore()
  const [draft, setDraft] = React.useState(appsScriptUrl)
  React.useEffect(() => setDraft(appsScriptUrl), [appsScriptUrl])
  const valid = /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(draft.trim())

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Section title="Spreadsheet preview" desc="Database tetap jadi sumber utama; Google Sheets adalah salinan & laporan." className="lg:col-span-2">
        <div>
          <iframe title="Primpaii's Way spreadsheet" src={SPREADSHEET_PREVIEW_URL} className="mb-3 h-80 w-full rounded-2xl border border-border bg-white" loading="lazy" />
          <Button asChild className="rounded-xl">
            <a href={SPREADSHEET_URL} target="_blank" rel="noreferrer"><ExternalLink /> Open Spreadsheet</a>
          </Button>
        </div>
      </Section>
      <Section title="Apps Script sync" desc="Tempel URL Web App dari Google Apps Script (berakhiran /exec).">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!valid) return
            setAppsScriptUrl(draft.trim())
            toast.success('URL Apps Script disimpan. Uji koneksi tersedia saat sinkronisasi diaktifkan.')
          }}
          className="flex flex-col gap-3"
        >
          <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="https://script.google.com/macros/s/…/exec" className="h-11 rounded-xl" aria-label="Apps Script Web App URL" />
          {draft && !valid && <p className="text-xs font-semibold text-destructive">Format URL belum sesuai.</p>}
          <Button type="submit" disabled={!valid} className="h-11 rounded-xl font-bold">Save URL</Button>
        </form>
        <div className="mt-4 rounded-2xl bg-muted/60 p-3 text-xs">
          <p className="font-bold">Status integrasi</p>
          <p className="mt-1"><span className="pw-pill pw-grey">Belum terhubung</span></p>
          <p className="mt-2 text-muted-foreground">Status berubah menjadi “Connected” hanya setelah tes kirim baris pertama berhasil.</p>
        </div>
      </Section>
    </div>
  )
}

function download(name: string, content: string, type: string) {
  const blob = new Blob([content], { type })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

const csvCell = (v: unknown) => {
  const s = String(v ?? '')
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function Backup() {
  const { orders, warranties, customOptions, playlist, appearance } = useStore()
  const stamp = new Date().toISOString().slice(0, 10)

  const exportCsv = () => {
    const head = ['id', 'tanggal_order', 'customer', 'application', 'plan', 'user', 'durasi', 'tanggal_habis', 'nama_fh', 'nama_akun', 'pemasukan', 'pengeluaran', 'diskon', 'pendapatan_bersih', 'status', 'catatan']
    const lines = orders.map((o) =>
      [o.id, o.orderDate, o.customer, o.application, o.plan, o.user, o.durationDays, expiryDate(o), o.fhName, o.accountName, o.income, o.expense, o.discount, netIncome(o), orderStatus(o), o.notes].map(csvCell).join(','),
    )
    download(`primpaiis-way-orders-${stamp}.csv`, [head.join(','), ...lines].join('\n'), 'text/csv;charset=utf-8')
    toast.success(`${orders.length} order diekspor ke CSV.`)
  }

  const exportJson = () => {
    const data = { app: "Primpaii's Way", version: 1, exportedAt: new Date().toISOString(), orders, warranties, customOptions, playlist, appearance }
    download(`primpaiis-way-backup-${stamp}.json`, JSON.stringify(data, null, 2), 'application/json')
    toast.success('Backup JSON diunduh.')
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Section title="Export" desc="Unduh salinan data kamu kapan saja.">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button onClick={exportCsv} className="h-11 rounded-xl font-bold"><Download /> Export CSV</Button>
          <Button onClick={exportJson} variant="secondary" className="h-11 rounded-xl font-bold"><Download /> Backup JSON</Button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          CSV berisi {orders.length} order. Backup JSON berisi order, garansi, custom option, playlist, dan pengaturan tampilan.
        </p>
      </Section>
      <Section title="Import & restore" desc="Pulihkan data dari CSV atau JSON.">
        <p className="rounded-2xl bg-muted/60 p-3 text-sm text-muted-foreground">
          Import CSV dan Restore JSON aktif bersamaan dengan cloud sync, supaya data bisa divalidasi, dicek duplikasinya berdasarkan ID transaksi, dan dikonfirmasi sebelum menimpa data yang ada.
        </p>
      </Section>
    </div>
  )
}
