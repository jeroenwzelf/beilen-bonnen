'use client'

import { useState, useTransition } from 'react'
import { updateAtonementCount } from '@/lib/actions'
import type { Person, Item, Atonement, Receipt } from '@/lib/db/schema'
import { formatEuro, cn } from '@/lib/utils'
import { Plus, Minus, User, ChevronDown, ChevronUp } from 'lucide-react'

interface AtonementBoardProps {
  holidayId: string
  dayId: string
  people: Person[]
  receipts: Receipt[]
  items: Item[]
  initialAtonements: Atonement[]
}

export function AtonementBoard({
  holidayId,
  dayId,
  people,
  receipts,
  items,
  initialAtonements,
}: AtonementBoardProps) {
  const [atonements, setAtonements] = useState<Map<string, number>>(
    new Map(initialAtonements.map((a) => [`${a.itemId}:${a.personId}`, a.count])),
  )

  const [selectedPeople, setSelectedPeople] = useState<Set<string>>(
    new Set(people[0]?.id ? [people[0].id] : []),
  )

  const [expandedReceipts, setExpandedReceipts] = useState<Set<string>>(
    new Set(receipts.map((r) => r.id)),
  )

  const [isPending, startTransition] = useTransition()

  function getAtonementCount(itemId: string, personId: string) {
    return atonements.get(`${itemId}:${personId}`) ?? 0
  }

  function togglePerson(personId: string) {
    setSelectedPeople((prev) => {
      const next = new Set(prev)
      if (next.has(personId)) next.delete(personId)
      else next.add(personId)
      return next
    })
  }

  function updateCounts(itemId: string, increase: boolean) {
    if (selectedPeople.size === 0) return

    const changes = [...selectedPeople].map((personId) => {
      const key = `${itemId}:${personId}`
      const currentCount = atonements.get(key) ?? 0

      return {
        key,
        personId,
        count: increase ? currentCount + 1 : Math.max(0, currentCount - 1),
      }
    })

    setAtonements((prev) => {
      const next = new Map(prev)

      for (const { key, count } of changes) {
        if (count === 0) next.delete(key)
        else next.set(key, count)
      }

      return next
    })

    startTransition(async () => {
      for (const { personId, count } of changes) {
        await updateAtonementCount(itemId, personId, count, holidayId)
      }
    })
  }

  function toggleSelectAllPeople() {
    setSelectedPeople((prev) => {
      if (prev.size === people.length) return new Set()
      return new Set(people.map((p) => p.id))
    })
  }

  function toggleReceipt(receiptId: string) {
    setExpandedReceipts((prev) => {
      const next = new Set(prev)
      if (next.has(receiptId)) next.delete(receiptId)
      else next.add(receiptId)
      return next
    })
  }

  const itemsByReceipt = new Map<string, Item[]>()

  for (const item of items) {
    if (!itemsByReceipt.has(item.receiptId)) {
      itemsByReceipt.set(item.receiptId, [])
    }
    itemsByReceipt.get(item.receiptId)!.push(item)
  }

  const peopleMap = new Map(people.map((p) => [p.id, p.name]))

  let myShare = 0

  for (const item of items) {
    const atonees = [...atonements.entries()]
      .filter(([key]) => key.startsWith(`${item.id}:`))
      .map(([key, count]) => ({
        personId: key.split(':')[1],
        count,
      }))

    const totalCount = atonees.reduce((sum, a) => sum + a.count, 0)

    const myCount = atonees
      .filter((a) => selectedPeople.has(a.personId))
      .reduce((sum, a) => sum + a.count, 0)

    if (totalCount > 0 && myCount > 0) {
      myShare +=
        ((parseFloat(item.price) * item.quantity) / totalCount) * myCount
    }
  }

  return (
    <div className="space-y-5">
      <div className="sticky top-16 z-40 mx-4 rounded-2xl border border-border/50 bg-background/90 p-4 shadow-lg backdrop-blur-xl">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Ik ben...
            </p>
            <button
              type="button"
              onClick={toggleSelectAllPeople}
              className="text-xs font-bold text-primary hover:underline"
            >
              {selectedPeople.size === people.length
                ? '(de)select all'
                : 'select all'}
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {people.map((person) => (
              <button
                key={person.id}
                onClick={() => togglePerson(person.id)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-full text-sm font-bold border transition-all',
                  selectedPeople.has(person.id)
                    ? 'bg-primary border-primary text-primary-foreground'
                    : 'bg-secondary border-border text-foreground hover:border-primary',
                )}
              >
                <User className="w-3.5 h-3.5" />
                {person.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {selectedPeople.size > 0 && myShare > 0 && (
        <div className="bg-primary/10 border border-primary/30 rounded-xl px-4 py-3 flex items-center justify-between">
          <p className="text-sm font-bold text-foreground">
            Jouw aandeel vandaag
          </p>
          <p className="text-xl font-black text-primary font-mono">
            {formatEuro(myShare)}
          </p>
        </div>
      )}

      <div className="space-y-3">
        {receipts.map((receipt) => {
          const rItems = itemsByReceipt.get(receipt.id) ?? []
          const isExpanded = expandedReceipts.has(receipt.id)
          const receiptTotal = rItems.reduce(
            (sum, item) => sum + parseFloat(item.price) * item.quantity,
            0,
          )

          const payerName =
            peopleMap.get(receipt.paidByPersonId) ?? 'Onbekend'

          return (
            <div
              key={receipt.id}
              className="bg-card border border-border rounded-xl overflow-hidden"
            >
              <button
                type="button"
                onClick={() => toggleReceipt(receipt.id)}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-secondary/50 transition-colors text-left"
              >
                <div className="flex-1">
                  <p className="font-bold text-sm uppercase tracking-wide">
                    {receipt.storeName || 'Boodschappen'}
                  </p>
                  <p className="text-xs font-mono text-muted-foreground">
                    {payerName} · {formatEuro(receiptTotal)} · {rItems.length}{' '}
                    items
                  </p>
                </div>

                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </button>

              {isExpanded && (
                <div className="divide-y divide-border/50">
                  {rItems.map((item) => {
                    const atonees = [...atonements.entries()]
                      .filter(([key]) => key.startsWith(`${item.id}:`))
                      .map(([key, count]) => ({
                        personId: key.split(':')[1],
                        count,
                      }))

                    const totalCount = atonees.reduce(
                      (sum, a) => sum + a.count,
                      0,
                    )

                    const selectedCount = [...selectedPeople].reduce(
                      (sum, pid) =>
                        sum + (getAtonementCount(item.id, pid) > 0 ? 1 : 0),
                      0,
                    )

                    const allSelected =
                      selectedPeople.size > 0 &&
                      selectedCount === selectedPeople.size

                    const partiallySelected =
                      selectedCount > 0 && !allSelected

                    const itemTotal = parseFloat(item.price) * item.quantity

                    const sharePerCount =
                      totalCount > 0 ? itemTotal / totalCount : null

                    return (
                      <div
                        key={item.id}
                        className={cn(
                          'px-4 py-3 flex items-center gap-3 transition-all',
                          allSelected
                            ? 'bg-green-500/10'
                            : partiallySelected
                              ? 'bg-blue-500/10'
                              : '',
                        )}
                      >
                        <div className="flex flex-col gap-1 shrink-0">
                          <button
                            type="button"
                            disabled={selectedPeople.size === 0 || isPending}
                            onClick={() => updateCounts(item.id, true)}
                            className="w-7 h-7 rounded-md bg-secondary hover:bg-primary/10 flex items-center justify-center"
                          >
                            <Plus className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            disabled={selectedPeople.size === 0 || isPending}
                            onClick={() => updateCounts(item.id, false)}
                            className="w-7 h-7 rounded-md bg-secondary hover:bg-destructive/10 flex items-center justify-center"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex-1 min-w-0">
                          <p
                            className={cn(
                              'text-sm font-mono font-bold truncate',
                              allSelected && 'text-green-600',
                              partiallySelected && 'text-blue-600',
                            )}
                          >
                            {item.name}
                          </p>

                          {atonees.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {atonees.map(({ personId, count }) => (
                                <span
                                  key={personId}
                                  className={cn(
                                    'text-xs px-1.5 py-0.5 rounded font-mono',
                                    selectedPeople.has(personId)
                                      ? 'bg-primary text-primary-foreground font-bold'
                                      : 'bg-secondary text-muted-foreground',
                                  )}
                                >
                                  {peopleMap.get(personId) ?? personId} (x{count})
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="text-right shrink-0">
                          <p className="text-sm font-mono">
                            {formatEuro(itemTotal)}
                          </p>

                          {sharePerCount && (
                            <p className="text-xs font-mono text-muted-foreground">
                              / {totalCount} = {formatEuro(sharePerCount)}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}