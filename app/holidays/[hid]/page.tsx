import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  getHoliday,
  getPeople,
  getShoppingDays,
  getReceiptsForDay,
  getItemsForReceipt,
  getAtonementsForDay,
  getParticipationMap,
} from '@/lib/actions'
import { TopBar } from '@/components/top-bar'
import { PageShell } from '@/components/page-shell'
import { PeopleManager } from '@/components/people-manager'
import { AddDayForm } from '@/components/add-day-form'
import { WeekCalendar } from '@/components/week-calendar'
import {
  MapPin,
  Calendar,
  Receipt,
  TrendingDown,
  ArrowRight,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

interface Props {
  params: Promise<{ hid: string }>
}

function startOfWeek(date: Date) {
  const result = new Date(date)
  const day = result.getDay()
  const diff = day === 0 ? -6 : 1 - day
  result.setDate(result.getDate() + diff)
  return result
}

function addDays(date: Date, amount: number) {
  const result = new Date(date)
  result.setDate(result.getDate() + amount)
  return result
}

export default async function HolidayPage({ params }: Props) {
  const { hid } = await params

  const [holiday, people, days, participationMap] = await Promise.all([
    getHoliday(hid),
    getPeople(hid),
    getShoppingDays(hid),
    getParticipationMap(hid),
  ])

  if (!holiday) notFound()

  const dayDetails = await Promise.all(
    days.map(async (day) => {
      const [receipts, atonements] = await Promise.all([
        getReceiptsForDay(day.id),
        getAtonementsForDay(day.id),
      ])

      const atonementMap = new Map<string, string[]>()

      for (const a of atonements) {
        if (!atonementMap.has(a.itemId)) {
          atonementMap.set(a.itemId, [])
        }
        atonementMap.get(a.itemId)!.push(a.personId)
      }

      const receiptItems = await Promise.all(
        receipts.map((receipt) => getItemsForReceipt(receipt.id))
      )

      const items = receiptItems.flat()

      let unassigned = 0
      const selectedPeople = new Set<string>()

      for (const item of items) {
        const assigned = atonementMap.get(item.id) ?? []

        if (assigned.length === 0) {
          unassigned++
        }

        assigned.forEach((personId) => selectedPeople.add(personId))
      }

      const totalAmount = items.reduce(
        (sum, item) =>
          sum + parseFloat(item.price) * item.quantity,
        0
      )

      return {
        id: day.id,
        date: new Date(day.dayDate),
        receipts: receipts.length,
        totalItems: items.length,
        unassigned,
        selectedPeople: [...selectedPeople],
        totalAmount,
      }
    })
  )

  const firstDay =
    dayDetails.length > 0
      ? startOfWeek(
          dayDetails
            .sort((a, b) => a.date.getTime() - b.date.getTime())[0].date
        )
      : new Date()

  const weeks = [0, 1, 2, 3, 4].map((weekOffset) =>
    Array.from({ length: 7 }).map((_, index) => {
      const date = addDays(firstDay, weekOffset * 7 + index)

      const detail = dayDetails.find(
        (day) =>
          day.date.toDateString() === date.toDateString()
      )

      return {
        date,
        detail,
      }
    })
  )

  return (
    <div className="min-h-screen bg-background">
      <TopBar backHref="/" backLabel="Vakanties" title={holiday.name} />

      <div className="bg-card border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <p className="text-xs font-mono uppercase tracking-[0.25em] text-accent mb-1">
            {holiday.year}
          </p>

          <h1 className="text-4xl font-black uppercase tracking-tight text-foreground">
            {holiday.name}
          </h1>

          <div className="flex flex-wrap gap-3 mt-3">
            {holiday.location && (
              <span className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
                <MapPin className="w-3 h-3" />
                {holiday.location}
              </span>
            )}

            {holiday.startDate && (
              <span className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
                <Calendar className="w-3 h-3" />
                {new Date(holiday.startDate).toLocaleDateString('nl-NL')}
              </span>
            )}

            <span className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-primary" />
              {people.length} personen
            </span>
          </div>
        </div>
      </div>

      <PageShell>
        <div className="grid grid-cols-2 gap-3">
          <Link
            href={`/holidays/${hid}/days`}
            className="group bg-card border border-border hover:border-primary rounded-xl p-4 flex items-center gap-3"
          >
            <Receipt className="w-5 h-5 text-primary" />
            <div>
              <p className="font-bold text-sm uppercase">Bonnen</p>
              <p className="text-xs text-muted-foreground">
                {days.length} dagen
              </p>
            </div>
          </Link>

          <Link
            href={`/holidays/${hid}/settlement`}
            className="group bg-card border border-border hover:border-accent rounded-xl p-4 flex items-center gap-3"
          >
            <TrendingDown className="w-5 h-5 text-accent" />
            <div>
              <p className="font-bold text-sm uppercase">Afrekenen</p>
              <p className="text-xs text-muted-foreground">
                Wie betaalt wie?
              </p>
            </div>
          </Link>
        </div>

        <div className="receipt-border" />

        <section className="space-y-4">
          <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">
            Kalender
          </h2>

          <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
            <div className="flex justify-between items-center">
              <button className="p-2 rounded-lg border border-border">
                <ChevronLeft className="w-4 h-4" />
              </button>

              <p className="font-bold uppercase">
                Weekoverzicht
              </p>

              <button className="p-2 rounded-lg border border-border">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <WeekCalendar
              hid={hid}
              days={weeks[0].map(({ date, detail }) => ({
                date: date.toISOString(),
                detail,
              }))}
            />
          </div>
        </section>

        <div className="receipt-border" />

        <section className="space-y-4">
          <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">
            Mensen — {people.length}
          </h2>

          <PeopleManager holidayId={hid} people={people} participationMap={participationMap}/>
        </section>

        <div className="receipt-border" />
      </PageShell>
    </div>
  )
}