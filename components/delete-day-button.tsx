'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { deleteShoppingDay } from '@/lib/actions'

interface Props {
  dayId: string
  holidayId: string
}

export function DeleteDayButton({ dayId, holidayId }: Props) {
  const [confirm, setConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    setLoading(true)
    await deleteShoppingDay(dayId, holidayId)
    router.refresh()
  }

  if (confirm) {
    return (
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={handleDelete}
          disabled={loading}
          className="text-xs font-bold uppercase tracking-wider text-accent px-2 py-1 rounded-lg bg-accent/10 hover:bg-accent/20 transition-colors disabled:opacity-50"
        >
          {loading ? '...' : 'Ja'}
        </button>
        <button
          onClick={() => setConfirm(false)}
          className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-2 py-1 rounded-lg hover:bg-secondary transition-colors"
        >
          Nee
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={(e) => { e.preventDefault(); setConfirm(true) }}
      className="shrink-0 p-2 rounded-lg text-muted-foreground hover:text-accent hover:bg-accent/10 transition-colors"
      aria-label="Dag verwijderen"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  )
}
