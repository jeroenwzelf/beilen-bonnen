import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  getHoliday,
  getShoppingDays,
  getReceiptsForDay,
  getItemsForReceipt,
  getAtonementsForDay,
} from '@/lib/actions'
import { TopBar } from '@/components/top-bar'
import { PageShell } from '@/components/page-shell'
import { AddDayForm } from '@/components/add-day-form'
import { ArrowRight, ShoppingCart, XCircle } from 'lucide-react'
import { DeleteDayButton } from '@/components/delete-day-button'

interface Props {
  params: Promise<{ hid: string }>
}

export default async function DaysPage({ params }: Props) {
  const { hid } = await params

  const [holiday, days] = await Promise.all([
    getHoliday(hid),
    getShoppingDays(hid),
  ])

  if (!holiday) notFound()

  const daySummaries = await Promise.all(
    days.map(async (day) => {
      const [receipts, atonements] = await Promise.all([
        getReceiptsForDay(day.id),
        getAtonementsForDay(day.id),
      ])

      const atonementMap = new Map<string, string[]>()

      for (const a of atonements) {
        if (!atonementMap.has(a.itemId)) atonementMap.set(a.itemId, [])
        atonementMap.get(a.itemId)!.push(a.personId)
      }

      const receiptItems = await Promise.all(
        receipts.map((receipt) => getItemsForReceipt(receipt.id))
      )

      const items = receiptItems.flat()

      let unassigned = 0

      for (const item of items) {
        if (!(atonementMap.get(item.id)?.length ?? 0)) {
          unassigned++
        }
      }

      return {
        dayId: day.id,
        totalItems: items.length,
        unassigned,
      }
    })
  )

  const summaryMap = new Map(daySummaries.map((d) => [d.dayId, d]))

  return (
    <div className="min-h-screen bg-background">
      <TopBar
        backHref={`/holidays/${hid}`}
        backLabel={holiday.name}
        title="Boodschapsdagen"
      />

      <PageShell>
        <div className="flex items-baseline justify-between">
          <h1 className="text-2xl font-black uppercase tracking-tight">
            Boodschapsdagen
          </h1>

          <span className="text-xs font-mono text-muted-foreground">
            {days.length} dag{days.length !== 1 ? 'en' : ''}
          </span>
        </div>

        {days.length === 0 ? (
          <div className="border border-dashed border-border rounded-xl p-10 text-center">
            <ShoppingCart className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              Nog geen boodschapsdagen. Voeg er een toe hieronder.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {days.map((day) => {
              const summary = summaryMap.get(day.id)
              const totalItems = summary?.totalItems ?? 0
              const unassigned = summary?.unassigned ?? 0

              return (
                <div
                  key={day.id}
                  className="group flex items-center gap-2"
                >
                  <Link
                    href={`/holidays/${hid}/days/${day.id}`}
                    className={`flex-1 flex items-center gap-4 rounded-xl border-2 px-4 py-4 transition-all min-w-0 ${
                      unassigned > 0
                        ? 'bg-card border-orange-400 hover:border-orange-500'
                        : 'bg-card border-green-500 hover:border-green-600'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-primary font-black text-sm">
                        {new Date(day.dayDate).toLocaleDateString('nl-NL', {
                          day: 'numeric',
                        })}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-base uppercase tracking-wide group-hover:text-primary transition-colors truncate">
                        {new Date(day.dayDate).toLocaleDateString('nl-NL', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                        })}
                      </p>

                      <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                        {unassigned > 0 ? (
                          <>
                            <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                            {unassigned}/{totalItems} items nog niet ingevuld
                          </>
                        ) : (
                          <>
                            Alle {totalItems} item
                            {totalItems === 1 ? '' : 's'} ingevuld
                          </>
                        )}
                      </p>
                    </div>

                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                  </Link>

                  <DeleteDayButton
                    dayId={day.id}
                    holidayId={hid}
                  />
                </div>
              )
            })}
          </div>
        )}

        <div className="receipt-border" />

        <div className="space-y-3">
          <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">
            Dag toevoegen
          </h2>

          <AddDayForm holidayId={hid} />
        </div>
      </PageShell>
    </div>
  )
}