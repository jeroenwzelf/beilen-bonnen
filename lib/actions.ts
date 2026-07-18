'use server'

import { db } from '@/lib/db'
import { holidays, people, shoppingDays, receipts, items, atonements } from '@/lib/db/schema'
import { eq, and, inArray } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { nanoid } from '@/lib/utils'

// ─── Holidays ────────────────────────────────────────────────────────────────

export async function getHolidays() {
  return db.query.holidays.findMany({ orderBy: (h, { desc }) => [desc(h.year), desc(h.createdAt)] })
}

export async function getHoliday(id: string) {
  return db.query.holidays.findFirst({ where: (h, { eq }) => eq(h.id, id) })
}

export async function createHoliday(data: {
  name: string
  year: number
  location?: string
  startDate?: string
  endDate?: string
}) {
  const id = nanoid()
  await db.insert(holidays).values({ id, ...data })
  revalidatePath('/')
  return id
}

// ─── People ──────────────────────────────────────────────────────────────────

export async function getPeople(holidayId: string) {
  return db.query.people.findMany({
    where: (p, { eq }) => eq(p.holidayId, holidayId),
    orderBy: (p, { asc }) => [asc(p.createdAt)],
  })
}

export async function addPerson(holidayId: string, name: string) {
  const id = nanoid()
  await db.insert(people).values({ id, holidayId, name })
  revalidatePath(`/holidays/${holidayId}`)
  return id
}

export async function removePerson(holidayId: string, personId: string) {
  await db.delete(people).where(and(eq(people.id, personId), eq(people.holidayId, holidayId)))
  revalidatePath(`/holidays/${holidayId}`)
}

// ─── Shopping Days ────────────────────────────────────────────────────────────

export async function getShoppingDays(holidayId: string) {
  return db.query.shoppingDays.findMany({
    where: (d, { eq }) => eq(d.holidayId, holidayId),
    orderBy: (d, { asc }) => [asc(d.dayDate)],
  })
}

export async function getShoppingDay(dayId: string) {
  return db.query.shoppingDays.findFirst({ where: (d, { eq }) => eq(d.id, dayId) })
}

export async function createShoppingDay(holidayId: string, data: { dayDate: string; label?: string }) {
  const id = nanoid()
  await db.insert(shoppingDays).values({ id, holidayId, ...data })
  revalidatePath(`/holidays/${holidayId}`)
  return id
}

export async function deleteShoppingDay(dayId: string, holidayId: string) {
  // Delete atonements, items, receipts cascading, then the day
  const dayReceipts = await db.query.receipts.findMany({ where: (r, { eq }) => eq(r.dayId, dayId) })
  if (dayReceipts.length > 0) {
    const receiptIds = dayReceipts.map((r) => r.id)
    const dayItems = await db.query.items.findMany({ where: (i, { inArray }) => inArray(i.receiptId, receiptIds) })
    if (dayItems.length > 0) {
      const itemIds = dayItems.map((i) => i.id)
      await db.delete(atonements).where(inArray(atonements.itemId, itemIds))
      await db.delete(items).where(inArray(items.id, itemIds))
    }
    await db.delete(receipts).where(inArray(receipts.id, receiptIds))
  }
  await db.delete(shoppingDays).where(eq(shoppingDays.id, dayId))
  revalidatePath(`/holidays/${holidayId}/days`)
  revalidatePath(`/holidays/${holidayId}`)
}

// ─── Receipts ────────────────────────────────────────────────────────────────

export async function getReceiptsForDay(dayId: string) {
  return db.query.receipts.findMany({
    where: (r, { eq }) => eq(r.dayId, dayId),
    orderBy: (r, { asc }) => [asc(r.createdAt)],
  })
}

export async function getReceipt(receiptId: string) {
  return db.query.receipts.findFirst({ where: (r, { eq }) => eq(r.id, receiptId) })
}

// actions.ts

export async function getParticipationMap(holidayId: string) {
  const days = await getShoppingDays(holidayId)

  const people = await getPeople(holidayId)

  const participation = new Map<string, number>()

  // initialize everyone at 0%
  for (const person of people) {
    participation.set(person.id, 0)
  }

  let totalItems = 0
  const itemCounts = new Map<string, number>()

  for (const day of days) {
    const receipts = await getReceiptsForDay(day.id)
    const atonements = await getAtonementsForDay(day.id)

    const atonementMap = new Map<string, string[]>()

    for (const a of atonements) {
      if (!atonementMap.has(a.itemId)) {
        atonementMap.set(a.itemId, [])
      }

      atonementMap.get(a.itemId)!.push(a.personId)
    }

    const receiptItems = await Promise.all(
      receipts.map((receipt) =>
        getItemsForReceipt(receipt.id)
      )
    )

    const items = receiptItems.flat()

    totalItems += items.length

    for (const item of items) {
      const selectedPeople =
        atonementMap.get(item.id) ?? []

      for (const personId of selectedPeople) {
        itemCounts.set(
          personId,
          (itemCounts.get(personId) ?? 0) + 1
        )
      }
    }
  }

  if (totalItems === 0) {
    return Object.fromEntries(
      participation
    )
  }

  for (const person of people) {
    const count = itemCounts.get(person.id) ?? 0

    participation.set(
      person.id,
      (count / totalItems) * 100
    )
  }

  return Object.fromEntries(participation)
}

export async function createReceipt(data: {
  holidayId: string
  dayId: string
  paidByPersonId: string
  storeName?: string
  imageUrl?: string
  totalAmount?: string
  itemsList: { name: string; price: string; quantity: number }[]
}) {
  const { itemsList, ...receiptData } = data
  const receiptId = nanoid()
  await db.insert(receipts).values({ id: receiptId, ...receiptData })

  if (itemsList.length > 0) {
    await db.insert(items).values(
      itemsList.map((item) => ({
        id: nanoid(),
        receiptId,
        holidayId: data.holidayId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
    )
  }

  revalidatePath(`/holidays/${data.holidayId}`)
  return receiptId
}

export async function deleteReceipt(receiptId: string, holidayId: string, dayId: string) {
  const receiptItems = await db.query.items.findMany({ where: (i, { eq }) => eq(i.receiptId, receiptId) })
  if (receiptItems.length > 0) {
    const itemIds = receiptItems.map((i) => i.id)
    await db.delete(atonements).where(inArray(atonements.itemId, itemIds))
    await db.delete(items).where(inArray(items.id, itemIds))
  }
  await db.delete(receipts).where(eq(receipts.id, receiptId))
  revalidatePath(`/holidays/${holidayId}/days/${dayId}`)
}

export async function updateReceiptStore(receiptId: string, storeName: string, holidayId: string, dayId: string) {
  await db.update(receipts).set({ storeName }).where(eq(receipts.id, receiptId))
  revalidatePath(`/holidays/${holidayId}/days/${dayId}`)
}

export async function updateReceiptPayer(
  receiptId: string,
  paidByPersonId: string,
  holidayId: string,
  dayId: string,
) {
  await db
    .update(receipts)
    .set({
      paidByPersonId,
    })
    .where(eq(receipts.id, receiptId))

  revalidatePath(`/holidays/${holidayId}/days/${dayId}`)
}

// ─── Items ────────────────────────────────────────────────────────────────────

export async function getItemsForReceipt(receiptId: string) {
  return db.query.items.findMany({
    where: (i, { eq }) => eq(i.receiptId, receiptId),
    orderBy: (i, { asc }) => [asc(i.createdAt)],
  })
}

export async function deleteItem(itemId: string, holidayId: string, dayId: string) {
  await db.delete(atonements).where(eq(atonements.itemId, itemId))
  await db.delete(items).where(eq(items.id, itemId))
  revalidatePath(`/holidays/${holidayId}/days/${dayId}`)
}

export async function updateItem(
  itemId: string,
  data: { name: string; price: string; quantity: number },
  holidayId: string,
  dayId: string,
) {
  await db.update(items).set(data).where(eq(items.id, itemId))
  revalidatePath(`/holidays/${holidayId}/days/${dayId}`)
}

export async function getItemsForDay(dayId: string) {
  const dayReceipts = await db.query.receipts.findMany({
    where: (r, { eq }) => eq(r.dayId, dayId),
  })
  if (dayReceipts.length === 0) return []
  const receiptIds = dayReceipts.map((r) => r.id)
  return db.query.items.findMany({
    where: (i, { inArray }) => inArray(i.receiptId, receiptIds),
    orderBy: (i, { asc }) => [asc(i.createdAt)],
  })
}

// ─── Atonements ───────────────────────────────────────────────────────────────

export async function getAtonementsForDay(dayId: string) {
  const dayItems = await getItemsForDay(dayId)
  if (dayItems.length === 0) return []
  const itemIds = dayItems.map((i) => i.id)
  return db.query.atonements.findMany({
    where: (a, { inArray }) => inArray(a.itemId, itemIds),
  })
}

export async function getAtonementsForHoliday(holidayId: string) {
  return db.query.atonements.findMany({
    where: (a, { eq }) => eq(a.holidayId, holidayId),
  })
}

export async function updateAtonementCount(
  itemId: string,
  personId: string,
  count: number,
  holidayId: string,
) {
  const existing = await db.query.atonements.findFirst({
    where: (a, { and, eq }) =>
      and(eq(a.itemId, itemId), eq(a.personId, personId)),
  })

  if (existing) {
    if (count <= 0) {
      await db
        .delete(atonements)
        .where(
          and(
            eq(atonements.itemId, itemId),
            eq(atonements.personId, personId),
          ),
        )
    } else {
      await db
        .update(atonements)
        .set({ count })
        .where(
          and(
            eq(atonements.itemId, itemId),
            eq(atonements.personId, personId),
          ),
        )
    }
  } else if (count > 0) {
    await db.insert(atonements).values({
      id: nanoid(),
      itemId,
      personId,
      holidayId,
      count,
    })
  }

  revalidatePath(`/holidays/${holidayId}`)
}

// ─── Settlement ───────────────────────────────────────────────────────────────

export async function getSettlementData(holidayId: string) {
  const [holidayPeople, holidayItems, holidayReceipts, holidayAtonements] =
    await Promise.all([
      getPeople(holidayId),
      db.query.items.findMany({ where: (i, { eq }) => eq(i.holidayId, holidayId) }),
      db.query.receipts.findMany({ where: (r, { eq }) => eq(r.holidayId, holidayId) }),
      getAtonementsForHoliday(holidayId),
    ])

  const receiptPayer = new Map(
    holidayReceipts.map((r) => [r.id, r.paidByPersonId]),
  )

  const balances = new Map<string, number>()
  for (const p of holidayPeople) balances.set(p.id, 0)

  for (const item of holidayItems) {
    const itemAtonements = holidayAtonements.filter(
      (a) => a.itemId === item.id,
    )

    if (itemAtonements.length === 0) continue

    const totalCount = itemAtonements.reduce(
      (sum, a) => sum + a.count,
      0,
    )

    if (totalCount === 0) continue

    const itemTotal = parseFloat(item.price) * item.quantity
    const payerId = receiptPayer.get(item.receiptId)

    if (!payerId) continue

    for (const atonement of itemAtonements) {
      const userShare = (itemTotal / totalCount) * atonement.count

      if (atonement.personId === payerId) continue

      balances.set(
        atonement.personId,
        (balances.get(atonement.personId) ?? 0) - userShare,
      )

      balances.set(
        payerId,
        (balances.get(payerId) ?? 0) + userShare,
      )
    }
  }

  const creditors: { id: string; amount: number }[] = []
  const debtors: { id: string; amount: number }[] = []

  for (const [id, bal] of balances.entries()) {
    if (bal > 0.005) {
      creditors.push({ id, amount: bal })
    } else if (bal < -0.005) {
      debtors.push({ id, amount: -bal })
    }
  }

  creditors.sort((a, b) => b.amount - a.amount)
  debtors.sort((a, b) => b.amount - a.amount)

  const transactions: { from: string; to: string; amount: number }[] = []

  let ci = 0
  let di = 0

  while (ci < creditors.length && di < debtors.length) {
    const credit = creditors[ci]
    const debt = debtors[di]

    const amount = Math.min(credit.amount, debt.amount)

    if (amount > 0.005) {
      transactions.push({
        from: debt.id,
        to: credit.id,
        amount,
      })
    }

    credit.amount -= amount
    debt.amount -= amount

    if (credit.amount < 0.005) ci++
    if (debt.amount < 0.005) di++
  }

  const peopleMap = new Map(
    holidayPeople.map((p) => [p.id, p.name]),
  )

  return {
    people: holidayPeople,
    balances: Object.fromEntries(balances),
    transactions: transactions.map((t) => ({
      from: t.from,
      fromName: peopleMap.get(t.from) ?? t.from,
      to: t.to,
      toName: peopleMap.get(t.to) ?? t.to,
      amount: Math.round(t.amount * 100) / 100,
    })),
    totalSpent: holidayItems.reduce(
      (s, i) => s + parseFloat(i.price) * i.quantity,
      0,
    ),
  }
}
