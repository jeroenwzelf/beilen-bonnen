'use client'

import Link from 'next/link'
import { useState } from 'react'

interface DayDetail {
  id: string
  receipts: number
  totalItems: number
  unassigned: number
  selectedPeople: string[]
  totalAmount: number
}

interface CalendarDay {
  date: string
  detail?: DayDetail
}

interface Props {
  days: CalendarDay[]
  hid: string
}

export function WeekCalendar({ days, hid }: Props) {
  const [active, setActive] = useState<string | null>(null)

  return (
    <div className="grid grid-cols-7 gap-2">
      {days.map(({ date, detail }) => {
        const day = new Date(date)
        const isOpen = active === date

        return (
          <div
            key={date}
            className="relative"
            onMouseEnter={() => {
              if (detail) setActive(date)
            }}
            onMouseLeave={() => {
              setActive(null)
            }}
          >
            <button
              onClick={() => {
                if (detail) {
                  setActive(isOpen ? null : date)
                }
              }}
              className={`w-full rounded-xl border-2 p-2 text-center transition-all ${
                !detail
                  ? 'border-black'
                  : detail.unassigned > 0
                  ? 'border-orange-400'
                  : 'border-green-500'
              } ${
                detail
                  ? 'cursor-pointer hover:bg-secondary'
                  : 'cursor-default'
              }`}
            >
              <p className="text-xs text-muted-foreground">
                {day.toLocaleDateString('nl-NL', {
                  weekday: 'short',
                })}
              </p>

              <p className="font-black">
                {day.getDate()}
              </p>
            </button>

            {isOpen && detail && (
              <div
                className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 rounded-xl border border-border bg-card p-3 shadow-lg text-left"
                onMouseEnter={() => setActive(date)}
                onMouseLeave={() => setActive(null)}
              >
                <p className="font-black uppercase text-xs mb-2">
                  {day.toLocaleDateString('nl-NL', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })}
                </p>

                <div className="space-y-1 text-xs">
                  <p>
                    🧾 Bonnen: {detail.receipts}
                  </p>

                  <p>
                    💶 Totaal: €{detail.totalAmount.toFixed(2)}
                  </p>

                  <p>
                    🛒 Items: {detail.totalItems}
                  </p>

                  <p>
                    ❌ Nog niet ingevuld: {detail.unassigned}
                  </p>

                  <p>
                    👥 Personen met items: {detail.selectedPeople.length}
                  </p>

                  <p>
                    ✅ Ingevuld:{' '}
                    {Math.round(
                      ((detail.totalItems - detail.unassigned) /
                        Math.max(detail.totalItems, 1)) *
                        100
                    )}
                    %
                  </p>

                  <Link
                    href={`/holidays/${hid}/days/${detail.id}`}
                    className="block pt-2 text-primary font-bold"
                  >
                    📖 Open dag →
                  </Link>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}