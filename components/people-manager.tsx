'use client'

import { useState, useTransition } from 'react'
import { addPerson, removePerson } from '@/lib/actions'
import type { Person } from '@/lib/db/schema'
import { UserPlus, X } from 'lucide-react'

interface PeopleManagerProps {
  holidayId: string
  people: Person[]
  participationMap?: Record<string, number>
}

export function PeopleManager({
  holidayId,
  people,
  participationMap = {},
}: PeopleManagerProps) {
  const [name, setName] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()

    const trimmed = name.trim()

    if (!trimmed) return

    if (people.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())) {
      setError('Deze persoon staat al in de lijst.')
      return
    }

    setError('')

    startTransition(async () => {
      await addPerson(holidayId, trimmed)
      setName('')
    })
  }

  function handleRemove(personId: string) {
    startTransition(async () => {
      await removePerson(holidayId, personId)
    })
  }

  return (
    <div className="space-y-4">
      {/* People chips */}
      <div className="flex flex-wrap gap-2">
        {people.map((person) => {
          const percentage = participationMap[person.id] ?? 0
          const hasItems = percentage >= 5

          return (
            <div
              key={person.id}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold border ${
                hasItems
                  ? 'bg-primary/10 text-primary border-primary/20'
                  : 'bg-orange-500/10 text-orange-700 border-orange-400'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  hasItems ? 'bg-primary' : 'bg-orange-500'
                }`}
              />

              {person.name}

              {hasItems && (
                <span className="text-xs opacity-70">
                  ({Math.round(percentage)}%)
                </span>
              )}

              {!hasItems && (
                <span className="text-xs opacity-70">
                  (0%)
                </span>
              )}

              <button
                onClick={() => handleRemove(person.id)}
                disabled={isPending}
                className="ml-1 text-muted-foreground hover:text-accent transition-colors"
                aria-label={`${person.name} verwijderen`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}

        {people.length === 0 && (
          <p className="text-muted-foreground text-sm italic">
            Nog niemand toegevoegd.
          </p>
        )}
      </div>

      {/* Add person form */}
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setError('')
          }}
          placeholder="Naam toevoegen..."
          className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />

        <button
          type="submit"
          disabled={isPending || !name.trim()}
          className="btn-lime rounded-lg px-4 py-2.5 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed text-sm shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          Voeg toe
        </button>
      </form>

      {error && (
        <p className="text-accent text-xs">
          {error}
        </p>
      )}
    </div>
  )
}