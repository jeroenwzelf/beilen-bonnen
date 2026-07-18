import { notFound } from 'next/navigation'
import {
  getHoliday,
  getShoppingDay,
  getReceiptsForDay,
  getItemsForDay,
  getPeople,
  getAtonementsForDay,
} from '@/lib/actions'
import { TopBar } from '@/components/top-bar'
import { PageShell } from '@/components/page-shell'
import { AtonementBoard } from '@/components/atonement-board'
import { ShoppingBag } from 'lucide-react'
import Link from 'next/link'

interface Props {
  params: Promise<{ hid: string; did: string }>
}

export default async function AtonePage({ params }: Props) {
  const { hid, did } = await params
  const [holiday, day, receipts, people, items, atonements] = await Promise.all([
    getHoliday(hid),
    getShoppingDay(did),
    getReceiptsForDay(did),
    getPeople(hid),
    getItemsForDay(did),
    getAtonementsForDay(did),
  ])

  if (!holiday || !day) notFound()

  return (
    <div className="min-h-screen bg-background">
      <TopBar
        backHref={`/holidays/${hid}/days/${did}`}
        backLabel="Dag"
        title="ATONE"
      />

      <PageShell>
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">
            {new Date(day.dayDate).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <h1 className="text-5xl font-black uppercase tracking-tighter leading-none text-primary">
            ATONE
          </h1>
          <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
            Selecteer wie je bent en vink de items aan die jij hebt gebruikt. De kosten worden eerlijk verdeeld.
          </p>
        </div>

        <div className="receipt-border" />

        {receipts.length === 0 ? (
          <div className="border border-dashed border-border rounded-xl p-10 text-center space-y-3">
            <ShoppingBag className="w-10 h-10 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">Geen bonnen voor deze dag.</p>
            <Link
              href={`/holidays/${hid}/days/${did}/new-receipt`}
              className="btn-lime inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm"
            >
              Bon toevoegen
            </Link>
          </div>
        ) : people.length === 0 ? (
          <div className="border border-dashed border-border rounded-xl p-10 text-center">
            <p className="text-muted-foreground">Voeg eerst mensen toe aan de vakantie.</p>
            <Link href={`/holidays/${hid}`} className="text-primary text-sm font-bold hover:underline mt-2 inline-block">
              Mensen toevoegen
            </Link>
          </div>
        ) : (
          <AtonementBoard
            holidayId={hid}
            dayId={did}
            people={people}
            receipts={receipts}
            items={items}
            initialAtonements={atonements}
          />
        )}
      </PageShell>
    </div>
  )
}
