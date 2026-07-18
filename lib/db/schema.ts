import { pgTable, text, timestamp, numeric, integer, date, unique } from 'drizzle-orm/pg-core'

export const holidays = pgTable('holidays', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  year: integer('year').notNull(),
  location: text('location'),
  startDate: date('start_date'),
  endDate: date('end_date'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const people = pgTable('people', {
  id: text('id').primaryKey(),
  holidayId: text('holiday_id').notNull(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const shoppingDays = pgTable('shopping_days', {
  id: text('id').primaryKey(),
  holidayId: text('holiday_id').notNull(),
  dayDate: date('day_date').notNull(),
  label: text('label'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const receipts = pgTable('receipts', {
  id: text('id').primaryKey(),
  holidayId: text('holiday_id').notNull(),
  dayId: text('day_id').notNull(),
  paidByPersonId: text('paid_by_person_id').notNull(),
  storeName: text('store_name'),
  imageUrl: text('image_url'),
  totalAmount: numeric('total_amount', { precision: 10, scale: 2 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const items = pgTable('items', {
  id: text('id').primaryKey(),
  receiptId: text('receipt_id').notNull(),
  holidayId: text('holiday_id').notNull(),
  name: text('name').notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  quantity: integer('quantity').notNull().default(1),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const atonements = pgTable(
  'atonements',
  {
    id: text('id').primaryKey(),
    itemId: text('item_id').notNull(),
    personId: text('person_id').notNull(),
    holidayId: text('holiday_id').notNull(),
    count: integer('count').notNull().default(1),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [unique().on(t.itemId, t.personId)],
)

export type Holiday = typeof holidays.$inferSelect
export type Person = typeof people.$inferSelect
export type ShoppingDay = typeof shoppingDays.$inferSelect
export type Receipt = typeof receipts.$inferSelect
export type Item = typeof items.$inferSelect
export type Atonement = typeof atonements.$inferSelect
