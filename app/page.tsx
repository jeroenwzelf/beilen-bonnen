import Link from 'next/link'
import { getHolidays } from '@/lib/actions'
import { CreateHolidayForm } from '@/components/create-holiday-form'
import { PageShell } from '@/components/page-shell'
import { MapPin, Calendar, ArrowRight } from 'lucide-react'

export default async function HomePage() {
  const holidays = await getHolidays()

  return (
    <div className="min-h-screen bg-background">
      {/* Hero header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-2xl mx-auto px-4 py-10">
          <p className="text-xs font-mono uppercase tracking-[0.3em] text-accent mb-2">Groepsvakantie</p>
          <h1 className="text-5xl font-black uppercase tracking-tight leading-none text-foreground">
            BEILEN
            <br />
            <span className="text-primary">BONNEN</span>
          </h1>
          <p className="mt-3 text-muted-foreground text-sm leading-relaxed">
            Sneeg de bonnen, sneeg de boodschappen, sneeg en atone. Bob's your uncle.
          </p>
        </div>
      </header>

      <PageShell>
        {/* Holidays list */}
        <section className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">
              Vakanties — {holidays.length}
            </h2>
          </div>

          {holidays.length === 0 ? (
            <div className="border border-dashed border-border rounded-xl p-8 text-center">
              <p className="text-muted-foreground text-sm">Nog geen vakanties. Maak er een aan hieronder.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {holidays.map((holiday) => (
                <Link
                  key={holiday.id}
                  href={`/holidays/${holiday.id}`}
                  className="group flex items-center gap-4 bg-card border border-border hover:border-primary rounded-xl p-4 transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                        {holiday.year}
                      </span>
                    </div>
                    <p className="font-black text-lg uppercase tracking-tight truncate text-foreground group-hover:text-primary transition-colors">
                      {holiday.name}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      {holiday.location && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
                          <MapPin className="w-3 h-3" />
                          {holiday.location}
                        </span>
                      )}
                      {holiday.startDate && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
                          <Calendar className="w-3 h-3" />
                          {new Date(holiday.startDate).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                          {holiday.endDate &&
                            ` – ${new Date(holiday.endDate).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}`}
                        </span>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Divider */}
        <div className="receipt-border" />

        {/* Create holiday form */}
        <CreateHolidayForm />
      </PageShell>
    </div>
  )
}
