'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createReceipt } from '@/lib/actions'
import type { Person } from '@/lib/db/schema'
import { cn } from '@/lib/utils'
import { Upload, ScanLine, Plus, Trash2, Loader2, ImageIcon, AlertCircle } from 'lucide-react'

interface LineItem {
  name: string
  price: string
  quantity: number
}

interface ReceiptUploadFormProps {
  holidayId: string
  dayId: string
  people: Person[]
}

export function ReceiptUploadForm({ holidayId, dayId, people }: ReceiptUploadFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isScanning, setIsScanning] = useState(false)
  const [scanError, setScanError] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageBase64, setImageBase64] = useState<string | null>(null)
  const [imageMime, setImageMime] = useState<string>('image/jpeg')
  const fileRef = useRef<HTMLInputElement>(null)

  const [storeName, setStoreName] = useState('')
  const [paidBy, setPaidBy] = useState(people[0]?.id ?? '')
  const [items, setItems] = useState<LineItem[]>([{ name: '', price: '', quantity: 1 }])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const mime = file.type || 'image/jpeg'
    setImageMime(mime)

    const reader = new FileReader()
    reader.onload = (ev) => {
      const result = ev.target?.result as string
      setImagePreview(result)
      // Strip data URL prefix for API call
      const base64 = result.split(',')[1]
      setImageBase64(base64)
    }
    reader.readAsDataURL(file)
  }

  async function handleScan() {
    if (!imageBase64) return
    setIsScanning(true)
    setScanError('')
    try {
      const res = await fetch('/api/parse-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, mimeType: imageMime }),
      })
      if (!res.ok) throw new Error('API error')
      const data = await res.json()
      if (data.storeName) setStoreName(data.storeName)
      if (data.items && data.items.length > 0) {
        setItems(
          data.items.map((it: { name: string; price: number; quantity: number }) => ({
            name: it.name,
            price: it.price.toFixed(2),
            quantity: it.quantity ?? 1,
          })),
        )
      }
    } catch {
      setScanError('Kon de bon niet scannen. Voer de items handmatig in.')
    } finally {
      setIsScanning(false)
    }
  }

  function addItem() {
    setItems((prev) => [...prev, { name: '', price: '', quantity: 1 }])
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx))
  }

  function updateItem(idx: number, field: keyof LineItem, value: string | number) {
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validItems = items.filter((i) => i.name.trim() && parseFloat(i.price) > 0)
    if (validItems.length === 0 || !paidBy) return

    startTransition(async () => {
      const total = validItems.reduce((s, i) => s + parseFloat(i.price) * i.quantity, 0)
      const receiptId = await createReceipt({
        holidayId,
        dayId,
        paidByPersonId: paidBy,
        storeName: storeName.trim() || undefined,
        imageUrl: imagePreview ?? undefined,
        totalAmount: total.toFixed(2),
        itemsList: validItems.map((i) => ({
          name: i.name.trim(),
          price: parseFloat(i.price).toFixed(2),
          quantity: i.quantity,
        })),
      })
      router.push(`/holidays/${holidayId}/days/${dayId}`)
    })
  }

  const totalAmount = items.reduce((s, i) => {
    const p = parseFloat(i.price)
    return s + (isNaN(p) ? 0 : p * i.quantity)
  }, 0)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Image upload */}
      <div className="space-y-3">
        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Foto van de bon
        </label>

        <div
          onClick={() => fileRef.current?.click()}
          className={cn(
            'relative border-2 border-dashed border-border rounded-xl overflow-hidden cursor-pointer transition-all hover:border-primary',
            imagePreview ? 'h-48' : 'h-32 flex items-center justify-center',
          )}
        >
          {imagePreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imagePreview} alt="Bonnetje" className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <ImageIcon className="w-8 h-8" />
              <p className="text-sm">Tik om foto te uploaden</p>
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {imagePreview && (
          <button
            type="button"
            onClick={handleScan}
            disabled={isScanning}
            className="btn-lime w-full rounded-lg px-4 py-3 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isScanning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Scannen...
              </>
            ) : (
              <>
                <ScanLine className="w-4 h-4" />
                Scan bon met AI
              </>
            )}
          </button>
        )}

        {scanError && (
          <div className="flex items-center gap-2 text-accent text-sm bg-accent/10 rounded-lg px-3 py-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {scanError}
          </div>
        )}
      </div>

      {/* Store + payer */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Winkel</label>
          <input
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            placeholder="bijv. Albert Heijn"
            className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Betaald door *</label>
          {people.length === 0 ? (
            <p className="text-accent text-xs pt-2">Voeg eerst mensen toe aan de vakantie.</p>
          ) : (
            <select
              value={paidBy}
              onChange={(e) => setPaidBy(e.target.value)}
              required
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Items list */}
      <div className="space-y-3">
        <div className="flex items-baseline justify-between">
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Items — {items.length}
          </label>
          {totalAmount > 0 && (
            <span className="text-xs font-mono text-primary font-bold">
              Totaal: {new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(totalAmount)}
            </span>
          )}
        </div>

        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={idx} className="flex gap-2 items-start">
              <div className="flex-1 bg-secondary border border-border rounded-lg overflow-hidden">
                <input
                  value={item.name}
                  onChange={(e) => updateItem(idx, 'name', e.target.value)}
                  placeholder={`Item ${idx + 1}`}
                  className="w-full bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none border-b border-border"
                />
                <div className="flex">
                  <input
                    type="number"
                    value={item.price}
                    onChange={(e) => updateItem(idx, 'price', e.target.value)}
                    placeholder="€ 0.00"
                    step="0.01"
                    min="0"
                    className="flex-1 bg-transparent px-3 py-2 text-sm font-mono text-primary placeholder:text-muted-foreground focus:outline-none"
                  />
                  <div className="flex items-center gap-1 px-2 border-l border-border">
                    <button
                      type="button"
                      onClick={() => updateItem(idx, 'quantity', Math.max(1, item.quantity - 1))}
                      className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground font-bold"
                    >
                      −
                    </button>
                    <span className="text-xs font-mono w-4 text-center">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateItem(idx, 'quantity', item.quantity + 1)}
                      className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeItem(idx)}
                disabled={items.length === 1}
                className="mt-1 text-muted-foreground hover:text-accent disabled:opacity-30"
                aria-label="Item verwijderen"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addItem}
          className="flex items-center gap-2 text-sm text-primary font-bold hover:underline"
        >
          <Plus className="w-4 h-4" />
          Item toevoegen
        </button>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending || people.length === 0}
        className="btn-lime w-full rounded-lg px-4 py-4 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-black uppercase tracking-widest"
      >
        {isPending ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Opslaan...</>
        ) : (
          <><Upload className="w-4 h-4" /> Bon opslaan</>
        )}
      </button>
    </form>
  )
}
