'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createHoliday } from '@/lib/actions'
import { cn } from '@/lib/utils'
import { Plus, X } from 'lucide-react'

interface CreateHolidayFormProps {
  onClose?: () => void
}

export function CreateHolidayForm({ onClose }: CreateHolidayFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState({
    name: '',
    year: new Date().getFullYear().toString(),
    location: '',
    startDate: '',
    endDate: '',
  })
  const [error, setError] = useState('')

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) {
      setError('Geef de vakantie een naam.')
      return
    }
    setError('')
    startTransition(async () => {
      const id = await createHoliday({
        name: form.name.trim(),
        year: parseInt(form.year),
        location: form.location.trim() || undefined,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
      })
      router.push(`/holidays/${id}`)
    })
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold uppercase tracking-widest">Nieuwe vakantie</h2>
        {onClose && (
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Naam *</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="bijv. Beilen 2025"
            className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Jaar *</label>
            <input
              name="year"
              type="number"
              value={form.year}
              onChange={handleChange}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Locatie</label>
            <input
              name="location"
              value={form.location}
              onChange={handleChange}
              placeholder="bijv. Beilen"
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Startdatum</label>
            <input
              name="startDate"
              type="date"
              value={form.startDate}
              onChange={handleChange}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Einddatum</label>
            <input
              name="endDate"
              type="date"
              value={form.endDate}
              onChange={handleChange}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
          </div>
        </div>

        {error && <p className="text-accent text-sm">{error}</p>}

        <button
          type="submit"
          disabled={isPending}
          className="btn-lime w-full rounded-lg px-4 py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
          {isPending ? 'Aanmaken...' : 'Vakantie aanmaken'}
        </button>
      </form>
    </div>
  )
}
