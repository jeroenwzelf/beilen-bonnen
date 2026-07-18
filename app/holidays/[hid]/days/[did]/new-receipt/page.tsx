import { notFound } from 'next/navigation'
import { getHoliday, getShoppingDay, getPeople } from '@/lib/actions'
import { TopBar } from '@/components/top-bar'
import { PageShell } from '@/components/page-shell'
import { ReceiptUploadForm } from '@/components/receipt-upload-form'

interface Props {
  params: Promise<{ hid: string; did: string }>
}

export default async function NewReceiptPage({ params }: Props) {
  const { hid, did } = await params
  const [holiday, day, people] = await Promise.all([getHoliday(hid), getShoppingDay(did), getPeople(hid)])

  if (!holiday || !day) notFound()

  return (
    <div className="min-h-screen bg-background">
      <TopBar
        backHref={`/holidays/${hid}/days/${did}`}
        backLabel="Dag"
        title="Bon toevoegen"
      />

      <PageShell>
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight">Bon toevoegen</h1>
          <p className="text-muted-foreground text-sm mt-1 font-mono">
            {day.label
              ? `${day.label} · `
              : ''}
            {new Date(day.dayDate).toLocaleDateString('nl-NL', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </p>
        </div>

        <div className="receipt-border" />

        <ReceiptUploadForm holidayId={hid} dayId={did} people={people} />
      </PageShell>
    </div>
  )
}
