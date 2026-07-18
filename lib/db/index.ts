import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

const connectionString =
  process.env.POSTGRES_URL ?? 'postgres://postgres:postgres@localhost:5432/app'

export const pool = new Pool({ connectionString })

export const db = drizzle(pool, { schema })
