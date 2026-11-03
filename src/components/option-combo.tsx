import * as React from 'react'
import { Check, ChevronsUpDown, Pencil, Plus, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useStore } from '@/lib/store'
import type { OptionCategory } from '@/lib/types'
import { cn } from '@/lib/utils'

const LABEL: Record<OptionCategory, string> = {
  application: 'Application',
  plan: 'Plan',
  user: 'User',
}

export function OptionCombo({
  id,
  category,
  value,
  onChange,
  invalid,
}: {
  id: string
  category: OptionCategory
  value: string
  onChange: (v: string) => void
  invalid?: boolean
}) {
  const { optionsFor, addOption, renameOption, deleteOption } = useStore()
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const [editing, setEditing] = React.useState<{ id: string; name: string } | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  const all = optionsFor(category)
  const q = query.trim().toLowerCase()
  const filtered = q ? all.filter((o) => o.name.toLowerCase().includes(q)) : all
  const exact = all.some((o) => o.name.toLowerCase() === q)

  const add = () => {
    const err = addOption(category, query)
    if (err) return setError(err)
    toast.success(`Custom ${LABEL[category].toLowerCase()} "${query.trim()}" saved ♡`)
    onChange(query.trim())
    setQuery('')
    setError(null)
    setOpen(false)
  }

  const saveEdit = () => {
    if (!editing) return
    const err = renameOption(editing.id, editing.name)
    if (err) return setError(err)
    toast.success('Pilihan diperbarui. Transaksi lama tetap memakai nama sebelumnya.')
    setEditing(null)
    setError(null)
  }

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) {
          setQuery('')
          setEditing(null)
          setError(null)
        }
      }}
    >
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-invalid={invalid || undefined}
          className={cn(
            'flex h-11 w-full items-center justify-between rounded-xl border border-input bg-background px-3 text-left text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
            invalid && 'border-destructive',
            !value && 'text-muted-foreground',
          )}
        >
          <span className="truncate">{value || `Pilih ${LABEL[category]}`}</span>
          <ChevronsUpDown className="size-4 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) min-w-72 p-2" align="start">
        <Input
          autoFocus
          placeholder={`Search or add ${LABEL[category].toLowerCase()}…`}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setError(null)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              if (filtered[0] && (exact || !q)) {
                onChange(filtered[0].name)
                setOpen(false)
              } else if (q) add()
            }
          }}
          className="mb-2 h-10 rounded-lg"
        />
        {error && <p className="mb-2 px-1 text-xs font-semibold text-destructive">{error}</p>}
        <ul className="max-h-60 overflow-y-auto" role="listbox" aria-label={LABEL[category]}>
          {filtered.map((o) => (
            <li key={o.custom?.id ?? o.name} className="group flex items-center gap-1 rounded-lg hover:bg-accent">
              {editing && o.custom && editing.id === o.custom.id ? (
                <div className="flex w-full items-center gap-1 p-1">
                  <Input
                    autoFocus
                    value={editing.name}
                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        saveEdit()
                      }
                    }}
                    className="h-8"
                    aria-label="Rename option"
                  />
                  <Button size="icon-sm" variant="ghost" type="button" aria-label="Save" onClick={saveEdit}>
                    <Check />
                  </Button>
                  <Button size="icon-sm" variant="ghost" type="button" aria-label="Cancel" onClick={() => setEditing(null)}>
                    <X />
                  </Button>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    role="option"
                    aria-selected={value === o.name}
                    onClick={() => {
                      onChange(o.name)
                      setOpen(false)
                    }}
                    className="flex flex-1 items-center gap-2 px-2 py-2 text-left text-sm"
                  >
                    <Check className={cn('size-4', value === o.name ? 'opacity-100' : 'opacity-0')} />
                    {o.name}
                    {o.custom && <span className="rounded-full bg-secondary px-1.5 text-[10px] font-bold text-secondary-foreground">custom</span>}
                  </button>
                  {o.custom && (
                    <span className="flex pr-1 opacity-70 group-hover:opacity-100">
                      <Button size="icon-xs" variant="ghost" type="button" aria-label={`Edit ${o.name}`} onClick={() => setEditing({ id: o.custom!.id, name: o.name })}>
                        <Pencil />
                      </Button>
                      <Button
                        size="icon-xs"
                        variant="ghost"
                        type="button"
                        aria-label={`Delete ${o.name}`}
                        onClick={() => {
                          if (confirm(`Hapus pilihan "${o.name}"? Transaksi lama tidak berubah.`)) {
                            deleteOption(o.custom!.id)
                            toast('Pilihan dihapus.')
                          }
                        }}
                      >
                        <Trash2 />
                      </Button>
                    </span>
                  )}
                </>
              )}
            </li>
          ))}
          {filtered.length === 0 && <li className="px-2 py-3 text-center text-xs text-muted-foreground">Belum ada yang cocok.</li>}
        </ul>
        {q && !exact && (
          <Button type="button" variant="secondary" className="mt-2 w-full rounded-lg" onClick={add}>
            <Plus /> Add custom “{query.trim()}”
          </Button>
        )}
      </PopoverContent>
    </Popover>
  )
}
