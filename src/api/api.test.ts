import assert from 'node:assert/strict'
import { test, type TestContext } from 'node:test'
import { createApi } from '../../server/api.ts'
import { createApp } from '../../server/app.ts'
import { createAuth } from '../../server/auth.ts'
import type { Db } from '../../server/db/index.ts'
import { addMember, APP_URL, browserFetch, freshDatabase, SECRET, SUPABASE_HASH, SUPABASE_PASSWORD } from '../../server/test-support.ts'
import { localDayKey } from '../booking/occupancy.ts'
import { createBooking, deleteBooking, getAllBookings, setBookingStatus, updateBooking } from './booking.ts'
import { checkIfDisplayNameExists, editDisplayName, getCurrentUserProfile } from './user.ts'

// The SPA's client against the real server: each member has a browser, and `as(t, member)`
// makes it the global `fetch` the client calls, as if the SPA ran in that member's tab.

async function setup() {
  const db = freshDatabase()
  const auth = createAuth(db, { appUrl: APP_URL, secret: SECRET })
  const app = createApp({ auth, api: createApi(db, auth, { appUrl: APP_URL, adminEmail: 'admin@example.test', sendEmail: async () => {} }) })
  return {
    camille: await signedIn(app, db, 'camille@example.test', 'Camille'),
    louis: await signedIn(app, db, 'louis@example.test', 'Louis'),
  }
}

async function signedIn(app: ReturnType<typeof createApp>, db: Db, email: string, name: string) {
  const id = addMember(db, email, SUPABASE_HASH, name)
  const fetch = browserFetch(app)
  const res = await fetch('/api/auth/sign-in/email', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password: SUPABASE_PASSWORD }),
  })
  assert.equal(res.status, 200)
  return { id, fetch }
}

function as(t: TestContext, member: { fetch: ReturnType<typeof browserFetch> }) {
  t.mock.method(globalThis, 'fetch', member.fetch)
}

// The civil day `offset` days from today, as the browser reckons it.
function day(offset: number) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return localDayKey(d)
}

test('the list holds every member’s unfinished bookings, from today, with the booker’s name', async (t) => {
  const { camille, louis } = await setup()
  as(t, camille)
  await createBooking({ title: 'Finie hier', start_date: day(-5), end_date: day(-1), status: 'CONFIRMED' })
  await createBooking({ title: 'Départ ce jour', start_date: day(-3), end_date: day(0), status: 'CONFIRMED' })
  as(t, louis)
  await createBooking({ title: 'Plus tard', start_date: day(10), end_date: day(12), status: 'PENDING' })

  const list = await getAllBookings()
  assert.deepEqual(
    list.map((b) => [b.title, b.booker_name]),
    [
      ['Départ ce jour', 'Camille'],
      ['Plus tard', 'Louis'],
    ],
  )
})

test('a booking is created with civil days, in either status, for the signed-in member', async (t) => {
  const { camille } = await setup()
  as(t, camille)

  const firm = await createBooking({ title: 'Noël', start_date: '2026-12-24', end_date: '2026-12-27', status: 'CONFIRMED' })
  assert.equal(firm.start_date, '2026-12-24')
  assert.equal(firm.end_date, '2026-12-27')
  assert.equal(firm.status, 'CONFIRMED')
  assert.equal(firm.booker, camille.id)

  const provisional = await createBooking({ title: 'Peut-être', start_date: '2027-01-02', end_date: '2027-01-03', status: 'PENDING' })
  assert.equal(provisional.status, 'PENDING')
})

test('the booker edits their booking; another member is refused with the server’s French reason', async (t) => {
  const { camille, louis } = await setup()
  as(t, camille)
  const noel = await createBooking({ title: 'Noël', start_date: '2026-12-24', end_date: '2026-12-27', status: 'CONFIRMED' })

  const edited = await updateBooking(noel.id, { title: 'Noël en famille', end_date: '2026-12-28' })
  assert.equal(edited.title, 'Noël en famille')
  assert.equal(edited.end_date, '2026-12-28')

  as(t, louis)
  await assert.rejects(updateBooking(noel.id, { title: 'Chez Louis' }), {
    message: 'Seul le membre qui a fait la réservation peut la modifier.',
  })
})

test('any member changes the status of a booking, and deletes it', async (t) => {
  const { camille, louis } = await setup()
  as(t, camille)
  const noel = await createBooking({ title: 'Noël', start_date: day(30), end_date: day(33), status: 'CONFIRMED' })

  as(t, louis)
  assert.equal((await setBookingStatus(noel.id, 'PENDING')).status, 'PENDING')
  await deleteBooking(noel.id)
  assert.deepEqual(await getAllBookings(), [])
})

test('a member reads and changes their own display name', async (t) => {
  const { camille } = await setup()
  as(t, camille)

  assert.equal(await checkIfDisplayNameExists(), true)
  assert.deepEqual(await getCurrentUserProfile(), { id: camille.id, email: 'camille@example.test', name: 'Camille' })

  await editDisplayName('Cam')
  assert.equal((await getCurrentUserProfile())?.name, 'Cam')

  await editDisplayName('')
  assert.equal(await checkIfDisplayNameExists(), false)
})

// What a proxy in front of the server answers while it is down or restarting.
test('a failure that is not the server’s own is still explained in French', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => new Response('<html>Bad Gateway</html>', { status: 502 }))
  await assert.rejects(getAllBookings(), { message: 'La requête a échoué (502). Veuillez réessayer.' })
})
