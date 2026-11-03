import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export function FilterSelect({
  label,
  value,
  onChange,
  options,
  className,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: string[]
  className?: string
}) {
  return (
    <label className={cn('flex flex-col gap-1 text-[11px] font-bold text-muted-foreground', className)}>
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 rounded-xl border border-input bg-background px-3 text-sm font-medium text-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <option value="">Semua</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  )
}

export function FilterDate({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex flex-col gap-1 text-[11px] font-bold text-muted-foreground">
      {label}
      <Input type="date" value={value} onChange={(e) => onChange(e.target.value)} className="h-10 rounded-xl text-sm" />
    </label>
  )
}

export function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <label className="flex flex-col gap-1 text-[11px] font-bold text-muted-foreground sm:col-span-2">
      Search
      <Input type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="h-10 rounded-xl text-sm" />
    </label>
  )
}

export function SortHeader({
  label,
  active,
  dir,
  onClick,
  className,
}: {
  label: string
  active: boolean
  dir: 'asc' | 'desc'
  onClick: () => void
  className?: string
}) {
  return (
    <button type="button" onClick={onClick} className={cn('inline-flex items-center gap-1 font-bold', className)}>
      {label}
      <span className={cn('text-[10px]', !active && 'opacity-30')}>{active && dir === 'asc' ? '▲' : '▼'}</span>
    </button>
  )
}
