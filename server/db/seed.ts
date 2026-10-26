import { sql } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import { hashPassword } from '../auth.ts'
import { migrateDatabase, openDatabase } from './index.ts'
import { account, bookings, session, user, verification } from './schema.ts'

// `bun run db:seed`: replaces everything in the local database with fake members and
// bookings around today. Every member signs in with DEV_PASSWORD.
const DEV_PASSWORD = 'thibaudiere'

if (process.env.NODE_ENV === 'production') {
  console.error('Refusing to seed with NODE_ENV=production: the seed deletes every member and booking.')
  process.exit(1)
}

// The hash Better Auth would store, in the same `$2a$10$` format as Supabase's (ADR 0001).
const passwordHash = await hashPassword(DEV_PASSWORD)

const members = [
  { name: 'Camille', email: 'camille@example.test' },
  { name: 'Louis', email: 'louis@example.test' },
  { name: 'Margot', email: 'margot@example.test' },
  // No display name yet, so the app prompts them to choose one.
  { name: '', email: 'nouveau@example.test' },
].map((m) => ({ ...m, id: randomUUID() }))

// Civil date `offset` days from today, as stored in `bookings` (YYYY-MM-DD).
function day(offset: number) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return [d.getFullYear(), d.getMonth() + 1, d.getDate()].map((n) => String(n).padStart(2, '0')).join('-')
}

const [camille, louis, margot] = members
const seededBookings = [
  { title: 'Week-end en famille', startDate: day(-20), endDate: day(-17), status: 'CONFIRMED', booker: camille.id },
  { title: 'Vacances de Louis', startDate: day(-2), endDate: day(3), status: 'CONFIRMED', booker: louis.id },
  { title: 'Peut-être un week-end', startDate: day(10), endDate: day(12), status: 'PENDING', booker: margot.id },
  { title: 'Anniversaire de Camille', startDate: day(25), endDate: day(28), status: 'CONFIRMED', booker: camille.id },
  { title: 'Séjour à confirmer', startDate: day(45), endDate: day(52), status: 'PENDING', booker: louis.id },
] as const

const db = openDatabase()
migrateDatabase(db)

db.transaction((tx) => {
  for (const table of [bookings, verification, session, account, user]) tx.delete(table).run()
  tx.run(sql`delete from sqlite_sequence where name = 'bookings'`)

  const now = new Date()
  tx.insert(user).values(members.map((m) => ({ ...m, emailVerified: true }))).run()
  tx.insert(account)
    .values(
      members.map((m) => ({
        id: randomUUID(),
        accountId: m.id,
        providerId: 'credential',
        userId: m.id,
        password: passwordHash,
        updatedAt: now,
      })),
    )
    .run()
  tx.insert(bookings).values([...seededBookings]).run()
})

db.$client.close()
console.log(`Seeded ${members.length} members and ${seededBookings.length} bookings.`)
console.log(`Sign in as any of ${members.map((m) => m.email).join(', ')} with the password "${DEV_PASSWORD}".`)
