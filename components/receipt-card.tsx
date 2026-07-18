'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Trash2, Pencil, Check, X, User, ChevronDown, ChevronUp } from 'lucide-react'
import { deleteReceipt, deleteItem, updateItem, updateReceiptStore, updateReceiptPayer } from '@/lib/actions'
import { formatEuro } from '@/lib/utils'

interface Item {
  id: string
  name: string
  price: string
  quantity: number
}

interface Props {
  receipt: {
    id: string
    storeName: string | null
    paidByPersonId: string
  }
  items: Item[]
  payer: string
  atonementMap: Record<string, string[]>
  peopleMap: Record<string, string>
  hid: string
  did: string
}

export function ReceiptCard({
  receipt,
  items: initialItems,
  payer,
  atonementMap,
  peopleMap,
  hid,
  did,
}: Props) {
  const [items, setItems] = useState(initialItems)
  const [storeName, setStoreName] = useState(receipt.storeName ?? '')
  const [editingStore, setEditingStore] = useState(false)
  const [editingPayer, setEditingPayer] = useState(false)
  const [selectedPayerId, setSelectedPayerId] = useState(receipt.paidByPersonId)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editPrice, setEditPrice] = useState('')
  const [editQty, setEditQty] = useState(1)
  const [confirmDeleteReceipt, setConfirmDeleteReceipt] = useState(false)
  const [confirmDeleteItem, setConfirmDeleteItem] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const receiptTotal = items.reduce((s, i) => s + parseFloat(i.price) * i.quantity, 0)

  function startEditItem(item: Item) {
    setEditingItemId(item.id)
    setEditName(item.name)
    setEditPrice(item.price)
    setEditQty(item.quantity)
  }

  function cancelEditItem() {
    setEditingItemId(null)
  }

  function saveItem(itemId: string) {
    const price = parseFloat(editPrice.replace(',', '.'))
    if (!editName.trim() || isNaN(price)) return

    const data = {
      name: editName.trim(),
      price: price.toFixed(2),
      quantity: editQty,
    }

    setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, ...data } : i)))
    setEditingItemId(null)
    startTransition(() => updateItem(itemId, data, hid, did))
  }

  function handleDeleteItem(itemId: string) {
    setItems((prev) => prev.filter((i) => i.id !== itemId))
    setConfirmDeleteItem(null)
    startTransition(() => deleteItem(itemId, hid, did))
  }

  function handleDeleteReceipt() {
    startTransition(() => deleteReceipt(receipt.id, hid, did))
  }

  function saveStore() {
    setEditingStore(false)
    startTransition(() => updateReceiptStore(receipt.id, storeName, hid, did))
  }

  function savePayer() {
    setEditingPayer(false)
    startTransition(() =>
      updateReceiptPayer(receipt.id, selectedPayerId, hid, did),
    )
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 flex items-center justify-between border-b border-border gap-3">
        <div className="flex-1 min-w-0">
          {editingStore ? (
            <div className="flex items-center gap-2">
              <input
                className="bg-secondary border border-primary rounded px-2 py-1 text-sm font-bold uppercase tracking-wide w-full focus:outline-none"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                autoFocus
              />
              <button onClick={saveStore} className="text-primary">
                <Check className="w-4 h-4" />
              </button>
              <button onClick={() => setEditingStore(false)} className="text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button onClick={() => setEditingStore(true)} className="group flex items-center gap-1.5 text-left">
              <p className="font-bold text-sm uppercase tracking-wide group-hover:text-primary transition-colors truncate">
                {storeName || 'Boodschappen'}
              </p>
              <Pencil className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          )}

          {editingPayer ? (
            <div className="flex items-center gap-2 mt-2">
              <select
                value={selectedPayerId}
                onChange={(e) => setSelectedPayerId(e.target.value)}
                className="bg-secondary border border-primary rounded px-2 py-1 text-xs font-mono"
              >
                {Object.entries(peopleMap).map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>

              <button onClick={savePayer} className="text-primary">
                <Check className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  setSelectedPayerId(receipt.paidByPersonId)
                  setEditingPayer(false)
                }}
                className="text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditingPayer(true)}
              className="text-xs font-mono text-muted-foreground flex items-center gap-1 mt-0.5 hover:text-primary transition-colors"
            >
              <User className="w-3 h-3" />
              Betaald door {peopleMap[selectedPayerId] ?? payer}
              <Pencil className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p className="font-bold font-mono text-primary">{formatEuro(receiptTotal)}</p>
            <p className="text-xs font-mono text-muted-foreground">{items.length} items</p>
          </div>

          {confirmDeleteReceipt ? (
            <div className="flex items-center gap-1">
              <button onClick={handleDeleteReceipt} disabled={isPending} className="text-xs font-bold bg-red-500 text-white px-2 py-1 rounded">
                Ja
              </button>
              <button onClick={() => setConfirmDeleteReceipt(false)} className="text-xs font-bold bg-secondary px-2 py-1 rounded">
                Nee
              </button>
            </div>
          ) : (
            <button onClick={() => setConfirmDeleteReceipt(true)} className="text-muted-foreground hover:text-red-400">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="divide-y divide-border/50">
        {items.map((item) => {
          const itemAtonees = atonementMap[item.id] ?? []
          const itemTotal = parseFloat(item.price) * item.quantity
          const sharePerPerson = itemAtonees.length > 0 ? itemTotal / itemAtonees.length : null
          const isEditing = editingItemId === item.id

          return (
            <div key={item.id} className="px-4 py-3">
              {isEditing ? (
                <div />
              ) : (
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-mono font-bold truncate">{item.name}</p>

                    {itemAtonees.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {itemAtonees.map((pid) => (
                          <span key={pid} className="text-xs bg-primary/15 text-primary font-bold px-2 py-0.5 rounded-full font-mono">
                            {peopleMap[pid] ?? pid}
                            {sharePerPerson && (
                              <span className="text-primary/70 ml-1">
                                ({formatEuro(sharePerPerson)})
                              </span>
                            )}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="px-4 py-3 border-t border-border bg-secondary/50">
        <Link href={`/holidays/${hid}/days/${did}/atone`} className="group inline-flex items-center gap-2">
          <span className="text-sm font-black uppercase tracking-tighter text-primary">
            ATONE
          </span>
          <span className="text-primary text-sm font-bold">→</span>
        </Link>
      </div>
    </div>
  )
}