import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as schema from './schema.ts'

const MIGRATIONS_FOLDER = fileURLToPath(new URL('./migrations', import.meta.url))

// The production volume's file (Dockerfile), or a local one for development.
export function databasePath() {
  return process.env.DATABASE_PATH ?? './data/dev.sqlite'
}

export function openDatabase(path = databasePath()) {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true })
  const sqlite = new Database(path)
  sqlite.pragma('journal_mode = WAL')
  // better-sqlite3 is built with foreign keys on, but plain SQLite defaults to off. Say it
  // explicitly: `booker` going NULL when a member is deleted depends on it.
  sqlite.pragma('foreign_keys = ON')
  return drizzle(sqlite, { schema })
}

export type Db = ReturnType<typeof openDatabase>

// Applies the committed `drizzle-kit generate` migrations; already-applied ones are skipped.
export function migrateDatabase(db: Db) {
  migrate(db, { migrationsFolder: MIGRATIONS_FOLDER })
}
