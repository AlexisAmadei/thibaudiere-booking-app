import { count, isNotNull, isNull, max, min, or, type SQL } from 'drizzle-orm'
import type { SQLiteTable } from 'drizzle-orm/sqlite-core'
import { isDeepStrictEqual } from 'node:util'
import { randomUUID } from 'node:crypto'
import postgres from 'postgres'
import type { Db } from './index.ts'
import { account, BOOKING_STATUSES, bookings, session, user, verification } from './schema.ts'

// A member as read from Supabase: `auth.users` joined with `public.profiles.display_name`.
export type SupabaseMember = {
  id: string
  email: string | null
  encryptedPassword: string | null
  // ISO 8601 in UTC, like every instant below.
  createdAt: string
  emailConfirmedAt: string | null
  displayName: string | null
  // Why Supabase Auth would refuse this user a session, if it would.
  disabled: 'deleted' | 'banned' | 'anonymous' | null
}

// A row of `public.bookings`, its dates as `YYYY-MM-DD`.
export type SupabaseBooking = {
  id: number
  title: string | null
  startDate: string | null
  endDate: string | null
  status: string
  createdAt: string
  booker: string | null
}

export type SupabaseSnapshot = { members: SupabaseMember[]; bookings: SupabaseBooking[] }

const CIVIL_DATE = /^\d{4}-\d{2}-\d{2}$/
// What `created_at` holds in SQLite: `strftime('%Y-%m-%dT%H:%M:%fZ')`, the column default.
const ISO_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
// Supabase Auth's hashes: bcrypt, `$2a$10$…` (ADR 0001), which Better Auth verifies as-is.
const BCRYPT = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/

type Status = (typeof BOOKING_STATUSES)[number]

// Checks every row against what the app can read back and converts it to SQLite rows, or
// throws listing every problem at once so a rehearsal shows them all.
function checkAndConvert(source: SupabaseSnapshot, now: Date) {
  const problems: string[] = []
  const users: (typeof user.$inferInsert)[] = []
  const accounts: (typeof account.$inferInsert)[] = []
  const bookingRows: (typeof bookings.$inferInsert)[] = []

  const emails = new Set<string>()
  for (const m of source.members) {
    const problem = (what: string) => problems.push(`member ${m.id}${m.email ? ` (${m.email})` : ''}: ${what}`)
    const email = m.email?.toLowerCase()
    if (!email) problem('no email')
    else if (emails.has(email)) problem('same email as another member, ignoring case')
    else emails.add(email)
    // Empty until an invitation is accepted. Such a member gets no credential account, exactly
    // like someone `bun run invite` has invited, and running it again sends them a new link.
    const invited = !m.encryptedPassword
    if (!invited && !BCRYPT.test(m.encryptedPassword!)) problem('password hash is not bcrypt')
    if (!ISO_INSTANT.test(m.createdAt)) problem(`created_at is not an ISO instant: ${m.createdAt}`)
    // Better Auth has no such state: imported, they could sign in. Remove them from Supabase for
    // good, or lift the ban there, and run the import again.
    if (m.disabled) problem(`${m.disabled} in Supabase, so not a member who can sign in`)
    users.push({
      id: m.id,
      name: m.displayName ?? '',
      // Better Auth lowercases the address it is given before looking a member up.
      email: email ?? '',
      emailVerified: m.emailConfirmedAt !== null,
      createdAt: new Date(m.createdAt),
    })
    if (!invited) {
      accounts.push({ id: randomUUID(), accountId: m.id, providerId: 'credential', userId: m.id, password: m.encryptedPassword, createdAt: now, updatedAt: now })
    }
  }

  const memberIds = new Set(source.members.map((m) => m.id))
  for (const b of source.bookings) {
    const problem = (what: string) => problems.push(`booking ${b.id}: ${what}`)
    if (!Number.isSafeInteger(b.id) || b.id < 1) problem('id is not a positive integer')
    if (b.startDate !== null && !CIVIL_DATE.test(b.startDate)) problem(`start_date is not YYYY-MM-DD: ${b.startDate}`)
    if (b.endDate !== null && !CIVIL_DATE.test(b.endDate)) problem(`end_date is not YYYY-MM-DD: ${b.endDate}`)
    if (!BOOKING_STATUSES.includes(b.status as Status)) problem(`status is not ${BOOKING_STATUSES.join(' or ')}: ${b.status}`)
    if (!ISO_INSTANT.test(b.createdAt)) problem(`created_at is not an ISO instant: ${b.createdAt}`)
    if (b.booker !== null && !memberIds.has(b.booker)) problem(`booker ${b.booker} is not a member`)
    bookingRows.push({ ...b, status: b.status as Status })
  }

  if (problems.length) throw new Error(`Nothing imported:\n- ${problems.join('\n- ')}`)
  return { users, accounts, bookings: bookingRows }
}

// What an import holds, to compare with Supabase. `undated` lists the bookings missing a start
// or an end date. The columns allow it, as in Supabase, so they are imported as they are, but
// the SPA cannot show such a booking correctly (it reads a missing start as 1970) and SQLite
// sorts a missing start first where Postgres sorted it last: each one deserves a look.
export type ImportSummary = {
  members: number
  passwords: number
  bookings: number
  firstDay: string | null
  lastDay: string | null
  undated: number[]
}

// Writes the snapshot into `db`, which must be migrated and hold no member or booking. All or
// nothing: it throws, leaving `db` as it was, on any row the app could not use, on any
// booker who is not a member, and if what it counts back differs from the snapshot.
export function importSupabase(db: Db, source: SupabaseSnapshot): ImportSummary {
  const rows = checkAndConvert(source, new Date())
  return db.transaction((tx) => {
    const countRows = (table: SQLiteTable, where?: SQL) => tx.select({ n: count() }).from(table).where(where).get()!.n
    for (const [name, table] of Object.entries({ user, account, session, verification, bookings })) {
      const n = countRows(table)
      if (n > 0) throw new Error(`The target database is not empty: ${name} has ${n} row(s).`)
    }
    if (rows.users.length) tx.insert(user).values(rows.users).run()
    if (rows.accounts.length) tx.insert(account).values(rows.accounts).run()
    if (rows.bookings.length) tx.insert(bookings).values(rows.bookings).run()

    const expected = summarize(source)
    const range = tx.select({ first: min(bookings.startDate), last: max(bookings.endDate) }).from(bookings).get()!
    const imported: ImportSummary = {
      members: countRows(user),
      passwords: countRows(account, isNotNull(account.password)),
      bookings: countRows(bookings),
      firstDay: range.first,
      lastDay: range.last,
      undated: tx
        .select({ id: bookings.id })
        .from(bookings)
        .where(or(isNull(bookings.startDate), isNull(bookings.endDate)))
        .orderBy(bookings.id)
        .all()
        .map((b) => b.id),
    }
    if (!isDeepStrictEqual(imported, expected)) {
      throw new Error(`Nothing imported: the database does not match Supabase.\nSupabase: ${JSON.stringify(expected)}\nSQLite:   ${JSON.stringify(imported)}`)
    }
    return imported
  })
}

// The same summary, worked out from the snapshot rather than the database.
function summarize(source: SupabaseSnapshot): ImportSummary {
  const starts = source.bookings.flatMap((b) => b.startDate ?? []).sort()
  const ends = source.bookings.flatMap((b) => b.endDate ?? []).sort()
  return {
    members: source.members.length,
    passwords: source.members.filter((m) => m.encryptedPassword).length,
    bookings: source.bookings.length,
    firstDay: starts[0] ?? null,
    lastDay: ends.at(-1) ?? null,
    undated: source.bookings
      .filter((b) => b.startDate === null || b.endDate === null)
      .map((b) => b.id)
      .sort((a, b) => a - b),
  }
}

// Instants as ISO 8601 in UTC, with milliseconds, the format of SQLite's `created_at`.
const PG_ISO_INSTANT = 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'

// Reads members and bookings from Supabase's Postgres at `url` (the `postgres` user's direct or
// session-pooler connection string, which can read `auth.users`). Every date and instant is
// formatted by Postgres itself, so no JS `Date` and no local timezone ever touch them: a
// `date` column comes out as the calendar day it holds. Over TLS unless `url` sets `sslmode`.
export async function readSupabase(url: string): Promise<SupabaseSnapshot> {
  // Never echoes `url`, which holds the database password.
  const invalid = new Error('SUPABASE_DB_URL is not a valid URL. Is the password URL-encoded?')
  const parsed = URL.parse(url)
  if (!parsed) throw invalid
  const ssl = parsed.searchParams.has('sslmode') ? {} : { ssl: 'require' as const }
  let sql: postgres.Sql
  try {
    // Throws on a stray `%` in the password, which it URL-decodes.
    sql = postgres(url, { ...ssl, max: 1, connect_timeout: 15, onnotice: () => {} })
  } catch {
    throw invalid
  }
  try {
    // One snapshot of the database for both queries, so no booking refers to a member who
    // signed up in between.
    return await sql.begin('isolation level repeatable read read only', async (tx) => {
      const members = await tx<SupabaseMember[]>`
        select
          u.id::text as "id",
          u.email as "email",
          u.encrypted_password as "encryptedPassword",
          to_char(u.created_at at time zone 'UTC', ${PG_ISO_INSTANT}) as "createdAt",
          to_char(u.email_confirmed_at at time zone 'UTC', ${PG_ISO_INSTANT}) as "emailConfirmedAt",
          p.display_name as "displayName",
          case
            when u.deleted_at is not null then 'deleted'
            when u.banned_until > now() then 'banned'
            when u.is_anonymous then 'anonymous'
          end as "disabled"
        from auth.users u
        left join public.profiles p on p.id = u.id
        order by u.created_at, u.id`
      const rows = await tx<(Omit<SupabaseBooking, 'id'> & { id: string })[]>`
        select
          id::text as "id",
          title as "title",
          to_char(start_date, 'YYYY-MM-DD') as "startDate",
          to_char(end_date, 'YYYY-MM-DD') as "endDate",
          status::text as "status",
          to_char(created_at at time zone 'UTC', ${PG_ISO_INSTANT}) as "createdAt",
          booker::text as "booker"
        from public.bookings
        order by id`
      // A `bigint`, read as text so that a value past 2^53 is caught by the checks, not rounded.
      return { members: [...members], bookings: rows.map((b) => ({ ...b, id: Number(b.id) })) }
    })
  } catch (error) {
    // A refused connection has no message, only a code such as ECONNREFUSED.
    const reason = (error instanceof Error && (error.message || (error as { code?: string }).code)) || String(error)
    throw new Error(`Could not read from Supabase at ${parsed.host}: ${reason}`, { cause: error })
  } finally {
    await sql.end()
  }
}
