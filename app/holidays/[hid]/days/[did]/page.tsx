import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  getHoliday,
  getShoppingDay,
  getReceiptsForDay,
  getItemsForReceipt,
  getPeople,
  getAtonementsForDay,
} from '@/lib/actions'
import { TopBar } from '@/components/top-bar'
import { PageShell } from '@/components/page-shell'
import { formatEuro } from '@/lib/utils'
import {
  Plus,
  ShoppingBag,
  Users,
  XCircle,
  ArrowRight,
} from 'lucide-react'

interface Props {
  params: Promise<{ hid: string; did: string }>
}

export default async function DayDetailPage({ params }: Props) {
  const { hid, did } = await params

  const [holiday, day, receipts, people, atonements] = await Promise.all([
    getHoliday(hid),
    getShoppingDay(did),
    getReceiptsForDay(did),
    getPeople(hid),
    getAtonementsForDay(did),
  ])

  if (!holiday || !day) notFound()

  const peopleMap = new Map(people.map((p) => [p.id, p.name]))
  const atonementMap = new Map<string, string[]>()

  for (const a of atonements) {
    if (!atonementMap.has(a.itemId)) atonementMap.set(a.itemId, [])
    atonementMap.get(a.itemId)!.push(a.personId)
  }

  const receiptItems = await Promise.all(
    receipts.map((r) => getItemsForReceipt(r.id))
  )

  const totalDay = receiptItems
    .flat()
    .reduce((s, i) => s + parseFloat(i.price) * i.quantity, 0)

  return (
    <div className="min-h-screen bg-background">
      <TopBar
        backHref={`/holidays/${hid}/days`}
        backLabel="Dagen"
        title={new Date(day.dayDate).toLocaleDateString('nl-NL', {
          day: 'numeric',
          month: 'long',
        })}
      />

      <PageShell>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-accent mb-1">
              {new Date(day.dayDate).toLocaleDateString('nl-NL', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </p>

            <h1 className="text-3xl font-black uppercase tracking-tight">
              {new Date(day.dayDate).toLocaleDateString('nl-NL', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </h1>

            {totalDay > 0 && (
              <p className="text-primary font-bold font-mono text-lg mt-1">
                {formatEuro(totalDay)}
              </p>
            )}
          </div>

          <Link
            href={`/holidays/${hid}/days/${did}/new-receipt`}
            className="btn-lime shrink-0 rounded-xl px-4 py-3 flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Bon
          </Link>
        </div>

        {receipts.length > 0 && (
          <Link
            href={`/holidays/${hid}/days/${did}/atone`}
            className="btn-lime w-full rounded-2xl py-5 px-6 flex items-center justify-center gap-3 text-lg font-black tracking-wide shadow-md"
          >
            <span>ATONE</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        )}

        {receipts.length === 0 ? (
          <div className="border border-dashed border-border rounded-xl p-10 text-center space-y-3">
            <ShoppingBag className="w-10 h-10 text-muted-foreground mx-auto" />

            <p className="text-muted-foreground">
              Geen bonnen voor deze dag.
            </p>

            <Link
              href={`/holidays/${hid}/days/${did}/new-receipt`}
              className="btn-lime inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm"
            >
              <Plus className="w-4 h-4" />
              Eerste bon toevoegen
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {receipts.map((receipt, ri) => {
              const items = receiptItems[ri]
              const itemCount = items.length
              const totalItems = Math.max(itemCount, 1)

              const personCounts = new Map<string, number>()
              let unassigned = 0

              for (const item of items) {
                const assigned = atonementMap.get(item.id) ?? []

                if (assigned.length === 0) {
                  unassigned++
                }

                for (const personId of assigned) {
                  personCounts.set(
                    personId,
                    (personCounts.get(personId) ?? 0) + 1
                  )
                }
              }

              const receiptTotal = items.reduce(
                (sum, item) =>
                  sum + parseFloat(item.price) * item.quantity,
                0
              )

              return (
                <div
                  key={receipt.id}
                  className={`rounded-2xl border-2 bg-card p-5 space-y-5 transition-colors ${
                    unassigned > 0
                      ? 'border-orange-400'
                      : 'border-green-500'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="font-black uppercase text-lg">
                        {receipt.storeName || 'Bon'}
                      </h2>

                      <p className="text-sm text-muted-foreground">
                        Betaald door{' '}
                        {peopleMap.get(receipt.paidByPersonId) ?? 'Onbekend'}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-bold">
                        {formatEuro(receiptTotal)}
                      </p>

                      <p className="mt-1 text-xs font-mono text-muted-foreground">
                        {itemCount} {itemCount === 1 ? 'item' : 'items'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      <Users className="w-4 h-4" />
                      Personen
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {[...personCounts.entries()].map(([personId, count]) => (
                        <div
                          key={personId}
                          className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary"
                        >
                          {peopleMap.get(personId)} (
                          {Math.round((count / totalItems) * 100)}%)
                        </div>
                      ))}

                      {unassigned > 0 && (
                        <div className="flex items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-sm font-semibold text-red-600">
                          <XCircle className="w-4 h-4" />
                          {unassigned}/{itemCount} items nog niet ingevuld (
                          {Math.round((unassigned / totalItems) * 100)}%)
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </PageShell>
    </div>
  )
}