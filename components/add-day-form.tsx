'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createShoppingDay } from '@/lib/actions'
import { CalendarPlus } from 'lucide-react'

interface AddDayFormProps {
  holidayId: string
}

export function AddDayForm({ holidayId }: AddDayFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [dayDate, setDayDate] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!dayDate) return
    startTransition(async () => {
      const dayId = await createShoppingDay(holidayId, { dayDate })
      router.push(`/holidays/${holidayId}/days/${dayId}`)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-3">
      <div className="space-y-1.5 flex-1">
        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Datum *</label>
        <input
          type="date"
          value={dayDate}
          onChange={(e) => setDayDate(e.target.value)}
          required
          className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      <button
        type="submit"
        disabled={isPending || !dayDate}
        className="btn-lime rounded-lg px-4 py-2.5 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed text-sm shrink-0"
      >
        <CalendarPlus className="w-4 h-4" />
        {isPending ? 'Toevoegen...' : 'Dag toevoegen'}
      </button>
    </form>
  )
}
