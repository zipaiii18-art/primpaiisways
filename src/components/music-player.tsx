import * as React from 'react'
import { Pause, Play, Repeat, Shuffle, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react'
import { toast } from 'sonner'
import { useStore } from '@/lib/store'
import type { PlaylistItem } from '@/lib/types'
import { cn } from '@/lib/utils'

export function spotifyEmbed(url: string): string | null {
  const m = url.match(/open\.spotify\.com\/(?:intl-[a-z]+\/)?(track|album|playlist|episode|show)\/([A-Za-z0-9]+)/)
  return m ? `https://open.spotify.com/embed/${m[1]}/${m[2]}` : null
}

export function youtubeEmbed(url: string): string | null {
  try {
    const u = new URL(url)
    const list = u.searchParams.get('list')
    let id: string | null = null
    if (u.hostname.includes('youtu.be')) id = u.pathname.slice(1)
    else if (u.hostname.includes('youtube.com')) {
      id = u.searchParams.get('v')
      if (!id && u.pathname.startsWith('/embed/')) id = u.pathname.split('/')[2]
    }
    if (id) return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0${list ? `&list=${list}` : ''}`
    if (list) return `https://www.youtube-nocookie.com/embed/videoseries?list=${list}&autoplay=1`
    return null
  } catch {
    return null
  }
}

export function isAudioUrl(url: string): boolean {
  try {
    const u = new URL(url)
    return /^https?:$/.test(u.protocol) && /\.(mp3|wav|ogg|oga|m4a)(\?.*)?$/i.test(u.pathname + u.search)
  } catch {
    return false
  }
}

interface Music {
  current: PlaylistItem | null
  playing: boolean
  progress: number
  duration: number
  volume: number
  muted: boolean
  repeat: boolean
  shuffle: boolean
  play: (id: string) => void
  toggle: () => void
  stop: () => void
  next: () => void
  prev: () => void
  seek: (t: number) => void
  setVolume: (v: number) => void
  setMuted: (m: boolean) => void
  setRepeat: (r: boolean) => void
  setShuffle: (s: boolean) => void
}

const MusicContext = React.createContext<Music | null>(null)

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const { playlist } = useStore()
  const audioRef = React.useRef<HTMLAudioElement | null>(null)
  const [currentId, setCurrentId] = React.useState<string | null>(null)
  const [playing, setPlaying] = React.useState(false)
  const [progress, setProgress] = React.useState(0)
  const [duration, setDuration] = React.useState(0)
  const [volume, setVolumeState] = React.useState(0.7)
  const [muted, setMutedState] = React.useState(false)
  const [repeat, setRepeat] = React.useState(false)
  const [shuffle, setShuffle] = React.useState(false)

  const current = playlist.find((p) => p.id === currentId) ?? null

  const getAudio = () => {
    if (!audioRef.current) {
      const a = new Audio()
      a.preload = 'none'
      audioRef.current = a
    }
    return audioRef.current
  }

  const play = (id: string) => {
    const item = playlist.find((p) => p.id === id)
    if (!item) return
    const a = getAudio()
    // Only one source at a time: always stop what's playing first.
    a.pause()
    setProgress(0)
    setDuration(0)
    setCurrentId(id)
    if (item.source === 'audio') {
      a.src = item.url
      a.volume = volume
      a.muted = muted
      a.play()
        .then(() => setPlaying(true))
        .catch(() => {
          setPlaying(false)
          toast.error(`Tidak bisa memutar "${item.title}". Pastikan link audio langsung (MP3/WAV/OGG) dan bisa diakses.`)
        })
    } else {
      a.removeAttribute('src')
      a.load()
      setPlaying(true)
    }
  }

  const stop = () => {
    audioRef.current?.pause()
    setPlaying(false)
    setCurrentId(null)
  }

  const step = (dir: 1 | -1) => {
    if (!playlist.length) return
    if (shuffle && playlist.length > 1) {
      const others = playlist.filter((p) => p.id !== currentId)
      play(others[Math.floor(Math.random() * others.length)].id)
      return
    }
    const idx = playlist.findIndex((p) => p.id === currentId)
    const nextIdx = (idx + dir + playlist.length) % playlist.length
    play(playlist[nextIdx].id)
  }

  const nextRef = React.useRef(() => {})
  nextRef.current = () => (repeat && current ? play(current.id) : step(1))

  React.useEffect(() => {
    const a = getAudio()
    const onTime = () => setProgress(a.currentTime)
    const onMeta = () => setDuration(Number.isFinite(a.duration) ? a.duration : 0)
    const onEnded = () => nextRef.current()
    const onError = () => {
      if (!a.getAttribute('src')) return
      setPlaying(false)
      toast.error('Audio gagal dimuat. Periksa kembali link-nya ya.')
    }
    a.addEventListener('timeupdate', onTime)
    a.addEventListener('loadedmetadata', onMeta)
    a.addEventListener('ended', onEnded)
    a.addEventListener('error', onError)
    return () => {
      a.removeEventListener('timeupdate', onTime)
      a.removeEventListener('loadedmetadata', onMeta)
      a.removeEventListener('ended', onEnded)
      a.removeEventListener('error', onError)
      a.pause()
    }
  }, [])

  // Stop if the playing item is deleted.
  React.useEffect(() => {
    if (currentId && !playlist.some((p) => p.id === currentId)) stop()
  }, [playlist, currentId])

  const toggle = () => {
    if (!current) {
      if (playlist[0]) play(playlist[0].id)
      return
    }
    if (current.source !== 'audio') {
      setPlaying((p) => !p)
      return
    }
    const a = getAudio()
    if (a.paused) a.play().then(() => setPlaying(true)).catch(() => setPlaying(false))
    else {
      a.pause()
      setPlaying(false)
    }
  }

  const value: Music = {
    current, playing, progress, duration, volume, muted, repeat, shuffle,
    play, toggle, stop,
    next: () => step(1),
    prev: () => step(-1),
    seek: (t) => {
      const a = getAudio()
      a.currentTime = t
      setProgress(t)
    },
    setVolume: (v) => {
      setVolumeState(v)
      getAudio().volume = v
    },
    setMuted: (m) => {
      setMutedState(m)
      getAudio().muted = m
    },
    setRepeat,
    setShuffle,
  }

  return <MusicContext.Provider value={value}>{children}</MusicContext.Provider>
}

export function useMusic(): Music {
  const ctx = React.useContext(MusicContext)
  if (!ctx) throw new Error('useMusic must be used inside <MusicProvider>')
  return ctx
}

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

function IconBtn({ label, onClick, active, children }: { label: string; onClick: () => void; active?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'grid size-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
        active && 'bg-accent text-[#b0436f] dark:text-primary',
      )}
    >
      {children}
    </button>
  )
}

export function PlayerControls({ full = false }: { full?: boolean }) {
  const m = useMusic()
  const isAudio = m.current?.source === 'audio'
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-center gap-1">
        {full && (
          <IconBtn label="Shuffle" active={m.shuffle} onClick={() => m.setShuffle(!m.shuffle)}>
            <Shuffle className="size-4" />
          </IconBtn>
        )}
        <IconBtn label="Previous" onClick={m.prev}>
          <SkipBack className="size-4" />
        </IconBtn>
        <button
          type="button"
          aria-label={m.playing ? 'Pause' : 'Play'}
          onClick={m.toggle}
          className="grid size-11 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm transition hover:brightness-105"
        >
          {m.playing ? <Pause className="size-5" /> : <Play className="size-5 translate-x-px" />}
        </button>
        <IconBtn label="Next" onClick={m.next}>
          <SkipForward className="size-4" />
        </IconBtn>
        {full && (
          <IconBtn label="Repeat" active={m.repeat} onClick={() => m.setRepeat(!m.repeat)}>
            <Repeat className="size-4" />
          </IconBtn>
        )}
      </div>
      {isAudio && (
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground tabular-nums">
          <span>{fmt(m.progress)}</span>
          <input
            type="range"
            aria-label="Progress"
            min={0}
            max={m.duration || 0}
            step={1}
            value={Math.min(m.progress, m.duration || 0)}
            onChange={(e) => m.seek(Number(e.target.value))}
            className="h-1 flex-1 accent-[var(--pw-sweet)]"
          />
          <span>{fmt(m.duration)}</span>
        </div>
      )}
      {full && (
        <div className="flex items-center gap-2">
          <IconBtn label={m.muted ? 'Unmute' : 'Mute'} onClick={() => m.setMuted(!m.muted)}>
            {m.muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
          </IconBtn>
          <input
            type="range"
            aria-label="Volume"
            min={0}
            max={1}
            step={0.05}
            value={m.muted ? 0 : m.volume}
            onChange={(e) => {
              m.setMuted(false)
              m.setVolume(Number(e.target.value))
            }}
            className="h-1 flex-1 accent-[var(--pw-sweet)]"
          />
        </div>
      )}
    </div>
  )
}

/** Embedded Spotify / YouTube player for the active item (mounted only after an explicit Play). */
export function EmbedFrame({ compact = false }: { compact?: boolean }) {
  const { current, playing } = useMusic()
  if (!current || current.source === 'audio' || !playing) return null
  const src = current.source === 'spotify' ? spotifyEmbed(current.url) : youtubeEmbed(current.url)
  if (!src) return <p className="text-xs text-destructive">Link embed tidak valid.</p>
  return (
    <iframe
      key={current.id}
      title={`${current.title} — ${current.source}`}
      src={src}
      className={cn('w-full rounded-xl border-0', compact ? 'h-20' : current.source === 'spotify' ? 'h-40' : 'aspect-video')}
      allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
      loading="lazy"
    />
  )
}

export function MusicMiniPlayer() {
  const m = useMusic()
  return (
    <div className="pw-card p-3">
      <p className="mb-1 text-xs font-bold text-muted-foreground">♫ My Little Playlist</p>
      <p className="truncate text-sm font-semibold">{m.current ? m.current.title : 'Nothing playing'}</p>
      <p className="mb-2 truncate text-xs text-muted-foreground">
        {m.current ? `${m.current.artist} · ${m.current.source}` : 'Pick a song in Setting'}
      </p>
      <div className="mb-2">
        <EmbedFrame compact />
      </div>
      <PlayerControls />
    </div>
  )
}
