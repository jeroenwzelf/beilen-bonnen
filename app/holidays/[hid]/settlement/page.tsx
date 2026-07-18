import { notFound } from 'next/navigation'
import { getHoliday, getSettlementData } from '@/lib/actions'
import { TopBar } from '@/components/top-bar'
import { PageShell } from '@/components/page-shell'
import { formatEuro } from '@/lib/utils'
import { ArrowRight, TrendingUp, TrendingDown, Minus, CheckCircle2 } from 'lucide-react'

interface Props {
  params: Promise<{ hid: string }>
}

export default async function SettlementPage({ params }: Props) {
  const { hid } = await params
  const [holiday, settlement] = await Promise.all([getHoliday(hid), getSettlementData(hid)])

  if (!holiday) notFound()

  const { people, balances, transactions, totalSpent } = settlement

  return (
    <div className="min-h-screen bg-background">
      <TopBar backHref={`/holidays/${hid}`} backLabel={holiday.name} title="Afrekening" />

      <PageShell>
        {/* Header */}
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-accent mb-1">EINDAFREKENING</p>
          <h1 className="text-3xl font-black uppercase tracking-tight">{holiday.name}</h1>
          <p className="text-muted-foreground text-sm mt-1 font-mono">{holiday.year}</p>
        </div>

        {/* Total */}
        <div className="bg-card border border-border rounded-xl px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Totaal besteed</p>
            <p className="text-3xl font-black text-foreground mt-0.5">{formatEuro(totalSpent)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Gemiddeld</p>
            <p className="text-xl font-bold text-muted-foreground mt-0.5">
              {people.length > 0 ? formatEuro(totalSpent / people.length) : '–'}
            </p>
          </div>
        </div>

        {/* Balances */}
        <section className="space-y-3">
          <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">
            Balans per persoon
          </h2>
          <div className="space-y-2">
            {people.map((person) => {
              const bal = balances[person.id] ?? 0
              const isPositive = bal > 0.005
              const isNegative = bal < -0.005

              return (
                <div
                  key={person.id}
                  className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-4"
                >
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                    <span className="text-xs font-black text-foreground uppercase">
                      {person.name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm">{person.name}</p>
                    <p className="text-xs font-mono text-muted-foreground">
                      {isPositive ? 'Krijgt terug' : isNegative ? 'Moet betalen' : 'Geen schuld'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isPositive && <TrendingUp className="w-4 h-4 text-primary shrink-0" />}
                    {isNegative && <TrendingDown className="w-4 h-4 text-accent shrink-0" />}
                    {!isPositive && !isNegative && <Minus className="w-4 h-4 text-muted-foreground shrink-0" />}
                    <span
                      className={
                        isPositive
                          ? 'font-black font-mono text-primary'
                          : isNegative
                            ? 'font-black font-mono text-accent'
                            : 'font-mono text-muted-foreground'
                      }
                    >
                      {isPositive ? '+' : ''}{formatEuro(bal)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <div className="receipt-border" />

        {/* Transactions */}
        <section className="space-y-3">
          <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">
            Wie sneegt wie?
          </h2>

          {transactions.length === 0 ? (
            <div className="bg-card border border-border rounded-xl px-5 py-6 flex items-center gap-4">
              <CheckCircle2 className="w-8 h-8 text-primary shrink-0" />
              <div>
                <p className="font-bold">Alles gesneegd!</p>
                <p className="text-sm text-muted-foreground">
                  {people.length === 0
                    ? 'Voeg mensen toe en laat ze attonen.'
                    : 'Niemand hoeft iets te betalen.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx, i) => (
                <div
                  key={i}
                  className="bg-card border border-border rounded-xl px-4 py-4 flex items-center gap-3"
                >
                  <div className="flex-1 flex items-center gap-3 min-w-0">
                    <div className="text-center min-w-0">
                      <p className="font-black text-sm truncate">{tx.fromName}</p>
                      <p className="text-xs font-mono text-accent">betaalsneeg</p>
                    </div>
                    <div className="flex flex-col items-center gap-0.5 shrink-0">
                      <p className="text-primary font-black font-mono text-sm">{formatEuro(tx.amount)}</p>
                      <ArrowRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="text-center min-w-0">
                      <p className="font-black text-sm truncate">{tx.toName}</p>
                      <p className="text-xs font-mono text-primary">ontvangsneeg</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground text-center font-mono leading-relaxed receipt-border pt-4">
          Gebaseerd op je eigen sneeg keuzes. Niet-gesneegde boodschappen zijn niet meegenomen in de berekening.
        </p>
      </PageShell>
    </div>
  )
}
