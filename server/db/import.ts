import { parseArgs } from 'node:util'
import { databasePath, migrateDatabase, openDatabase } from './index.ts'
import { importSupabase, readSupabase } from './supabase-import.ts'

// `bun run db:import [path]`: copies the members and bookings from Supabase into the SQLite
// file at `path` (default DATABASE_PATH), which it migrates first and which must hold no member
// or booking. Reads from SUPABASE_DB_URL, which can come from a local `.env`. All or nothing:
// on any problem nothing is written, so fix it, then run it again. To rehearse, import into a
// new file each time and run the app on it (README).
try {
  const { positionals } = parseArgs({ allowPositionals: true })
  if (positionals.length > 1) throw new Error('Usage: bun run db:import [path]')
  const url = process.env.SUPABASE_DB_URL
  if (!url) throw new Error("SUPABASE_DB_URL is not set: Supabase's Postgres connection string, as the postgres user.")
  const path = positionals[0] ?? databasePath()

  // Read first, so a connection problem leaves no new file behind.
  const source = await readSupabase(url)
  const db = openDatabase(path)
  try {
    migrateDatabase(db)
    const summary = importSupabase(db, source)
    console.log(`Imported into ${path}, and counted back the same as in Supabase:`)
    console.log(`  members:  ${summary.members} (${summary.passwords} with a password, ${summary.members - summary.passwords} invited who never chose one)`)
    console.log(`  bookings: ${summary.bookings}, from ${summary.firstDay ?? '-'} to ${summary.lastDay ?? '-'}`)
    if (summary.undated.length) {
      console.warn(
        `Warning: booking(s) ${summary.undated.join(', ')} have no start or end date, as in Supabase. ` +
          'The app cannot show such a booking correctly: check them before going live.',
      )
    }
  } finally {
    db.$client.close()
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
}
