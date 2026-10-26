import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createApi } from '../api.ts'
import { createApp } from '../app.ts'
import { createAuth, inviteMember } from '../auth.ts'
import type { Email } from '../email.ts'
import { addMember, APP_URL, browser, freshDatabase, SECRET, SUPABASE_HASH, SUPABASE_PASSWORD } from '../test-support.ts'
import type { Db } from './index.ts'
import { importSupabase, type SupabaseBooking, type SupabaseMember, type SupabaseSnapshot } from './supabase-import.ts'

const CAMILLE_ID = '6f1c1d6e-1b7a-4c4e-9a53-0d2f3b1f6a01'
const LOUIS_ID = '0b9e2c55-8d1f-4f0a-b8e4-6a3c2d1e9f02'

// Rows as `readSupabase` returns them from production.
function member(overrides: Partial<SupabaseMember> = {}): SupabaseMember {
  return {
    id: CAMILLE_ID,
    email: 'camille@example.test',
    encryptedPassword: SUPABASE_HASH,
    createdAt: '2025-03-14T09:26:53.589Z',
    emailConfirmedAt: '2025-03-14T09:30:00.000Z',
    displayName: 'Camille',
    disabled: null,
    ...overrides,
  }
}

function booking(overrides: Partial<SupabaseBooking> = {}): SupabaseBooking {
  return {
    id: 1,
    title: 'Vacances',
    startDate: '2026-12-20',
    endDate: '2026-12-27',
    status: 'CONFIRMED',
    createdAt: '2026-10-01T18:04:12.345Z',
    booker: CAMILLE_ID,
    ...overrides,
  }
}

function snapshot(overrides: Partial<SupabaseSnapshot> = {}): SupabaseSnapshot {
  return { members: [member()], bookings: [], ...overrides }
}

// The real app over `db`, as a browser on its own address.
function browse(db: Db) {
  const auth = createAuth(db, { appUrl: APP_URL, secret: SECRET, sendEmail: async () => {} })
  const app = createApp({ auth, api: createApi(db, auth, { appUrl: APP_URL, adminEmail: 'admin@example.test', sendEmail: async () => {} }) })
  return browser(app)
}

async function signIn(db: Db, email: string, password: string) {
  const request = browse(db)
  const res = await request('POST', '/api/auth/sign-in/email', { email, password })
  return { request, res }
}

test('an imported member signs in with their Supabase password and keeps their id and display name', async () => {
  const db = freshDatabase()
  importSupabase(db, snapshot())

  const { request, res } = await signIn(db, 'camille@example.test', SUPABASE_PASSWORD)
  assert.equal(res.status, 200)
  const session = (await (await request('GET', '/api/auth/get-session')).json()) as {
    user: { id: string; name: string; emailVerified: boolean }
  }
  assert.equal(session.user.id, CAMILLE_ID)
  assert.equal(session.user.name, 'Camille')
  assert.equal(session.user.emailVerified, true)
})

test('imported bookings keep their ids, civil dates, status and booker', async () => {
  const db = freshDatabase()
  importSupabase(
    db,
    snapshot({
      members: [member(), member({ id: LOUIS_ID, email: 'louis@example.test', displayName: 'Louis' })],
      bookings: [
        booking({ id: 3, title: 'Noël', startDate: '2026-12-24', endDate: '2027-01-02', booker: CAMILLE_ID }),
        booking({ id: 7, title: 'Pâques', startDate: '2027-03-27', endDate: '2027-03-29', status: 'PENDING', booker: LOUIS_ID }),
      ],
    }),
  )

  const { request } = await signIn(db, 'camille@example.test', SUPABASE_PASSWORD)
  const res = await request('GET', '/api/bookings?from=2026-10-26')
  assert.deepEqual(await res.json(), [
    {
      id: 3,
      title: 'Noël',
      start_date: '2026-12-24',
      end_date: '2027-01-02',
      status: 'CONFIRMED',
      created_at: '2026-10-01T18:04:12.345Z',
      booker: CAMILLE_ID,
      booker_name: 'Camille',
    },
    {
      id: 7,
      title: 'Pâques',
      start_date: '2027-03-27',
      end_date: '2027-03-29',
      status: 'PENDING',
      created_at: '2026-10-01T18:04:12.345Z',
      booker: LOUIS_ID,
      booker_name: 'Louis',
    },
  ])
})

test('a booking made after the import gets the next id after the largest imported one', async () => {
  const db = freshDatabase()
  importSupabase(db, snapshot({ bookings: [booking({ id: 41 }), booking({ id: 12 })] }))

  const { request } = await signIn(db, 'camille@example.test', SUPABASE_PASSWORD)
  const res = await request('POST', '/api/bookings', { title: 'Été', start_date: '2027-07-01', end_date: '2027-07-14', status: 'CONFIRMED' })
  assert.equal(res.status, 201)
  assert.equal(((await res.json()) as { id: number }).id, 42)
})

test('the import refuses a database that already has members or bookings, and leaves it alone', async () => {
  const withMember = freshDatabase()
  addMember(withMember, 'deja@example.test', SUPABASE_HASH)
  const withBooking = freshDatabase()
  withBooking.$client.prepare("insert into bookings (title) values ('Déjà là')").run()

  for (const db of [withMember, withBooking]) {
    assert.throws(() => importSupabase(db, snapshot()), /not empty/)
    assert.equal((await signIn(db, 'camille@example.test', SUPABASE_PASSWORD)).res.status, 401)
  }
  assert.equal((await signIn(withMember, 'deja@example.test', SUPABASE_PASSWORD)).res.status, 200)
})

test('a booking whose booker is not an imported member fails the whole import, which can then be run again', async () => {
  const db = freshDatabase()
  const orphan = booking({ id: 5, booker: LOUIS_ID })

  assert.throws(() => importSupabase(db, snapshot({ bookings: [booking(), orphan] })), new RegExp(`booking 5.*${LOUIS_ID}`))

  importSupabase(db, snapshot({ bookings: [booking(), { ...orphan, booker: null }] }))
  const { request } = await signIn(db, 'camille@example.test', SUPABASE_PASSWORD)
  const imported = (await (await request('GET', '/api/bookings?from=2026-10-26')).json()) as { id: number; booker: string | null }[]
  assert.deepEqual(
    imported.map((b) => [b.id, b.booker]),
    [
      [1, CAMILLE_ID],
      [5, null],
    ],
  )
})

test('rows the app could not read back fail the import, each one named', () => {
  const cases: [SupabaseSnapshot, RegExp][] = [
    [snapshot({ members: [member({ email: null })] }), new RegExp(`member ${CAMILLE_ID}: no email`)],
    [snapshot({ members: [member({ encryptedPassword: '$argon2id$v=19$m=65536,t=3,p=4$abc' })] }), /member .*: password hash is not bcrypt/],
    [snapshot({ members: [member({ createdAt: 'hier' })] }), /member .*: created_at/],
    // Supabase would not let them sign in, so the import must not decide that they can.
    [snapshot({ members: [member({ disabled: 'banned' })] }), /member .*: banned in Supabase/],
    [snapshot({ members: [member({ disabled: 'deleted' })] }), /member .*: deleted in Supabase/],
    [
      snapshot({ members: [member(), member({ id: LOUIS_ID, email: 'CAMILLE@example.test' })] }),
      new RegExp(`member ${LOUIS_ID} \\(CAMILLE@example.test\\): same email as another member`),
    ],
    [snapshot({ bookings: [booking({ id: 2, startDate: '2026-12-20T00:00:00.000Z' })] }), /booking 2: start_date/],
    [snapshot({ bookings: [booking({ id: 2, endDate: '20/12/2026' })] }), /booking 2: end_date/],
    [snapshot({ bookings: [booking({ id: 2, status: 'CANCELLED' })] }), /booking 2: status/],
    [snapshot({ bookings: [booking({ id: 2, createdAt: '2026-10-01 18:04:12+00' })] }), /booking 2: created_at/],
    [snapshot({ bookings: [booking({ id: 2 ** 53 })] }), /booking 9007199254740992: id/],
  ]
  for (const [source, problem] of cases) {
    const db = freshDatabase()
    assert.throws(() => importSupabase(db, source), problem)
  }
})

test('every problem is reported at once, not just the first', () => {
  const source = snapshot({ bookings: [booking({ id: 2, status: 'CANCELLED' }), booking({ id: 3, booker: LOUIS_ID })] })
  assert.throws(() => importSupabase(freshDatabase(), source), /booking 2: status[\s\S]*booking 3: booker/)
})

test('a member invited on Supabase who never chose a password is imported as an invitation still pending', async () => {
  // Supabase Auth stores an empty `encrypted_password` until the invitation is accepted.
  for (const encryptedPassword of ['', null]) {
    const db = freshDatabase()
    importSupabase(db, snapshot({ members: [member({ encryptedPassword, emailConfirmedAt: null, displayName: '' })] }))

    // `bun run invite` refuses anyone who already has a password.
    const emails: Email[] = []
    await inviteMember(db, 'camille@example.test', { appUrl: APP_URL, secret: SECRET, sendEmail: async (e) => void emails.push(e) })
    assert.equal(emails[0].subject, 'Invitation à La Thibaudière')
  }
})

test('a member whose Supabase email has capitals still signs in, as Better Auth looks emails up in lower case', async () => {
  const db = freshDatabase()
  importSupabase(db, snapshot({ members: [member({ email: 'Camille@Example.test' })] }))

  assert.equal((await signIn(db, 'Camille@Example.test', SUPABASE_PASSWORD)).res.status, 200)
})

test('the import reports what it wrote, counted back from the database, and the bookings missing a date', () => {
  const db = freshDatabase()
  const summary = importSupabase(
    db,
    snapshot({
      members: [member(), member({ id: LOUIS_ID, email: 'louis@example.test', encryptedPassword: '' })],
      bookings: [
        booking({ id: 1, startDate: '2024-07-01', endDate: '2024-07-15' }),
        booking({ id: 2, startDate: '2027-01-02', endDate: '2027-01-09' }),
        booking({ id: 3, startDate: null }),
        booking({ id: 4, endDate: null }),
      ],
    }),
  )

  assert.deepEqual(summary, {
    members: 2,
    passwords: 1,
    bookings: 4,
    firstDay: '2024-07-01',
    lastDay: '2027-01-09',
    undated: [3, 4],
  })
})
