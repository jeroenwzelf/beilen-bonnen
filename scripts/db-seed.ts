import { createReadStream } from 'node:fs'
import { join } from 'node:path'
import { pipeline } from 'node:stream/promises'
import { from as copyFrom } from 'pg-copy-streams'
import { pool } from '../lib/db'

const SEED_FILES = [
  ['holidays', 'holidays.csv'],
  ['people', 'people.csv'],
  ['shopping_days', 'shopping_days.csv'],
  ['receipts', 'receipts.csv'],
  ['items', 'items.csv'],
  ['atonements', 'atonements.csv'],
] as const

async function copyCsv(table: string, filePath: string) {
  const client = await pool.connect()

  try {
    const stream = client.query(
      copyFrom(`COPY ${table} FROM STDIN WITH (FORMAT csv, HEADER true)`),
    )
    await pipeline(createReadStream(filePath), stream)
  } finally {
    client.release()
  }
}

async function seed() {
  const client = await pool.connect()

  try {
    const { rows } = await client.query<{ count: number }>(
      'SELECT COUNT(*)::int AS count FROM holidays',
    )

    if (rows[0].count > 0) {
      console.log('Database already has data, skipping seed.')
      return
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (!message.includes('does not exist')) {
      throw error
    }
  } finally {
    client.release()
  }

  const dbDir = join(process.cwd(), 'db')

  for (const [table, file] of SEED_FILES) {
    console.log(`Seeding ${table}...`)
    await copyCsv(table, join(dbDir, file))
  }

  console.log('Database seed complete.')
}

seed()
  .catch((error) => {
    console.error('Database seed failed:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await pool.end()
  })
