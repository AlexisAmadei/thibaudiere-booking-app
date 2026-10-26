import assert from 'node:assert/strict'
import { test, type TestContext } from 'node:test'
import { createApi } from './api.ts'
import { createApp } from './app.ts'
import { createAuth } from './auth.ts'
import type { Db } from './db/index.ts'
import type { Email, SendEmail } from './email.ts'
import { addMember, APP_URL, browser, freshDatabase, nextIp, SECRET, SUPABASE_HASH, SUPABASE_PASSWORD } from './test-support.ts'

const ADMIN_EMAIL = 'admin@example.test'

// The app over a freshly migrated database with two signed-in members, Camille and Louis,
// and every booking notification captured instead of sent.
async function setup({ sendEmail, adminEmail = ADMIN_EMAIL }: { sendEmail?: SendEmail; adminEmail?: string } = {}) {
  const db = freshDatabase()
  const emails: Email[] = []
  const capture: SendEmail = async (email) => {
    emails.push(email)
  }
  const auth = createAuth(db, { appUrl: APP_URL, secret: SECRET })
  const app = createApp({
    auth,
    api: createApi(db, auth, { appUrl: APP_URL, adminEmail, sendEmail: sendEmail ?? capture }),
  })
  const camille = await signedIn(app, db, 'camille@example.test', 'Camille')
  const louis = await signedIn(app, db, 'louis@example.test', 'Louis')
  return { db, app, emails, camille, louis, anonymous: browser(app) }
}

// A member's own browser, signed in. `request` is `browser`'s.
async function signedIn(app: ReturnType<typeof createApp>, db: Db, email: string, name: string) {
  const id = addMember(db, email, SUPABASE_HASH, name)
  const request = browser(app)
  const res = await request('POST', '/api/auth/sign-in/email', { email, password: SUPABASE_PASSWORD })
  assert.equal(res.status, 200)
  return { id, request }
}

test('every route refuses a signed-out request', async () => {
  const { anonymous } = await setup()
  const calls: [string, string, unknown?][] = [
    ['GET', '/api/bookings?from=2026-01-01'],
    ['POST', '/api/bookings', { title: 'Noël', start_date: '2026-12-24', end_date: '2026-12-26', status: 'CONFIRMED' }],
    ['PATCH', '/api/bookings/1', { title: 'Noël' }],
    ['POST', '/api/bookings/1/status', { status: 'PENDING' }],
    ['DELETE', '/api/bookings/1'],
    ['GET', '/api/me'],
    ['PATCH', '/api/me', { name: 'Intrus' }],
  ]
  for (const [method, path, body] of calls) {
    const res = await anonymous(method, path, body)
    assert.equal(res.status, 401, `${method} ${path}`)
  }
})

const NOEL = { title: 'Noël', start_date: '2026-12-24', end_date: '2026-12-27', status: 'CONFIRMED' }

test('a booking is created for the signed-in member, and every member sees it with their name', async () => {
  const { camille, louis } = await setup()

  const res = await camille.request('POST', '/api/bookings', NOEL)
  assert.equal(res.status, 201)
  const created = (await res.json()) as Record<string, unknown>
  assert.deepEqual({ ...created, id: undefined, created_at: undefined }, {
    ...NOEL,
    id: undefined,
    created_at: undefined,
    booker: camille.id,
    booker_name: 'Camille',
  })

  const list = await (await louis.request('GET', '/api/bookings?from=2026-12-01')).json()
  assert.deepEqual(list, [created])
})

test('the booker is never taken from the request', async () => {
  const { camille, louis } = await setup()

  const res = await louis.request('POST', '/api/bookings', { ...NOEL, booker: camille.id })
  assert.equal(res.status, 400)
  const list = await (await louis.request('GET', '/api/bookings?from=2026-01-01')).json()
  assert.deepEqual(list, [])
})

test('the list holds the bookings not finished by `from`, in order of arrival', async () => {
  const { camille, louis } = await setup()
  const book = (who: typeof camille, title: string, start_date: string, end_date: string) =>
    who.request('POST', '/api/bookings', { title, start_date, end_date, status: 'PENDING' })
  await book(camille, 'Été', '2026-07-01', '2026-07-14')
  await book(louis, 'Finie', '2026-05-01', '2026-05-09')
  await book(louis, 'En cours', '2026-05-08', '2026-05-12')
  await book(camille, 'Arrivée ce jour', '2026-05-10', '2026-05-11')

  const list = (await (await louis.request('GET', '/api/bookings?from=2026-05-10')).json()) as { title: string }[]
  assert.deepEqual(
    list.map((b) => b.title),
    ['En cours', 'Arrivée ce jour', 'Été'],
  )
})

test('the list needs a `from` day', async () => {
  const { camille } = await setup()
  for (const query of ['', '?from=', '?from=2026-02-30', '?from=2026-05-10T00:00:00Z']) {
    const res = await camille.request('GET', `/api/bookings${query}`)
    assert.equal(res.status, 400, query)
  }
})

// Creates a booking as `who` and returns it as the API did.
async function booked(who: Awaited<ReturnType<typeof signedIn>>, booking: object = NOEL) {
  const res = await who.request('POST', '/api/bookings', booking)
  assert.equal(res.status, 201)
  return (await res.json()) as Record<string, unknown> & { id: number }
}

// The booking as every member sees it in the list.
async function listed(who: Awaited<ReturnType<typeof signedIn>>, id: number) {
  const list = (await (await who.request('GET', '/api/bookings?from=2000-01-01')).json()) as (Record<string, unknown> & { id: number })[]
  return list.find((b) => b.id === id)
}

test('the booker edits their booking', async () => {
  const { camille, louis } = await setup()
  const noel = await booked(camille)

  const changes = { title: 'Noël en famille', start_date: '2026-12-23', end_date: '2026-12-28', status: 'PENDING' }
  const res = await camille.request('PATCH', `/api/bookings/${noel.id}`, changes)
  assert.equal(res.status, 200)
  const edited = { ...noel, ...changes }
  assert.deepEqual(await res.json(), edited)
  assert.deepEqual(await listed(louis, noel.id), edited)
})

test('another member cannot edit the booking', async () => {
  const { camille, louis } = await setup()
  const noel = await booked(camille)

  const res = await louis.request('PATCH', `/api/bookings/${noel.id}`, { title: 'Chez Louis' })
  assert.equal(res.status, 403)
  assert.deepEqual(await listed(louis, noel.id), noel)
})

test('the booker cannot hand their booking to someone else', async () => {
  const { camille, louis } = await setup()
  const noel = await booked(camille)

  const res = await camille.request('PATCH', `/api/bookings/${noel.id}`, { booker: louis.id })
  assert.equal(res.status, 400)
  assert.deepEqual(await listed(louis, noel.id), noel)
})

test('editing a booking that does not exist is a 404', async () => {
  const { camille } = await setup()
  const res = await camille.request('PATCH', '/api/bookings/999', { title: 'Fantôme' })
  assert.equal(res.status, 404)
})

test('an empty edit changes nothing', async () => {
  const { camille } = await setup()
  const noel = await booked(camille)

  const res = await camille.request('PATCH', `/api/bookings/${noel.id}`, {})
  assert.equal(res.status, 200)
  assert.deepEqual(await res.json(), noel)
})

test("any member changes a booking's status, and nothing else", async () => {
  const { camille, louis } = await setup()
  const noel = await booked(camille)

  const res = await louis.request('POST', `/api/bookings/${noel.id}/status`, { status: 'PENDING' })
  assert.equal(res.status, 200)
  assert.deepEqual(await res.json(), { ...noel, status: 'PENDING' })

  const more = await louis.request('POST', `/api/bookings/${noel.id}/status`, { status: 'CONFIRMED', title: 'Chez Louis' })
  assert.equal(more.status, 400)
  const invalid = await louis.request('POST', `/api/bookings/${noel.id}/status`, { status: 'CANCELLED' })
  assert.equal(invalid.status, 400)
  assert.deepEqual(await listed(louis, noel.id), { ...noel, status: 'PENDING' })
})

test('changing the status of a booking that does not exist is a 404', async () => {
  const { camille } = await setup()
  const res = await camille.request('POST', '/api/bookings/999/status', { status: 'PENDING' })
  assert.equal(res.status, 404)
})

// Parity with the `USING (true)` delete policy; restricting it is #20.
test("any member deletes any booking, not only the booker's", async () => {
  const { camille, louis } = await setup()
  const noel = await booked(camille)

  const res = await louis.request('DELETE', `/api/bookings/${noel.id}`)
  assert.equal(res.status, 204)
  assert.equal(await listed(camille, noel.id), undefined)

  // As with Supabase, deleting what is already gone is not an error.
  const again = await louis.request('DELETE', `/api/bookings/${noel.id}`)
  assert.equal(again.status, 204)
})

test('a member reads their own email and display name', async () => {
  const { camille } = await setup()
  const res = await camille.request('GET', '/api/me')
  assert.equal(res.status, 200)
  assert.deepEqual(await res.json(), { id: camille.id, email: 'camille@example.test', name: 'Camille' })
})

test('a member changes their own display name, which the others then see', async () => {
  const { camille, louis } = await setup()
  const noel = await booked(camille)

  const res = await camille.request('PATCH', '/api/me', { name: 'Cam' })
  assert.equal(res.status, 200)
  assert.deepEqual(await res.json(), { id: camille.id, email: 'camille@example.test', name: 'Cam' })
  assert.equal((await listed(louis, noel.id))?.booker_name, 'Cam')
  assert.equal(((await (await louis.request('GET', '/api/me')).json()) as { name: string }).name, 'Louis')
})

test('/api/me changes the display name and nothing else', async () => {
  const { camille } = await setup()
  for (const body of [{ name: 'Cam', email: 'cam@example.test' }, { id: 'autre' }, { name: 42 }, {}]) {
    const res = await camille.request('PATCH', '/api/me', body)
    assert.equal(res.status, 400, JSON.stringify(body))
  }
  assert.deepEqual(await (await camille.request('GET', '/api/me')).json(), {
    id: camille.id,
    email: 'camille@example.test',
    name: 'Camille',
  })
})

test('creating a booking notifies the admin in French', async () => {
  const { camille, emails } = await setup()
  await booked(camille)

  assert.equal(emails.length, 1)
  assert.equal(emails[0].to, ADMIN_EMAIL)
  assert.equal(emails[0].subject, 'Nouvelle réservation : Noël')
  assert.equal(
    emails[0].text,
    `Nouvelle réservation\n\nTitre : Noël\nArrivée : jeudi 24 décembre 2026\nDépart : dimanche 27 décembre 2026\nStatut : Confirmée\n\nVoir les réservations : ${APP_URL}`,
  )
  assert.ok(emails[0].html.includes(`href="${APP_URL}"`))
  assert.match(emails[0].html, /Confirmée/)
})

test('a title is shown as text in the notification, never as HTML', async () => {
  const { camille, emails } = await setup()
  await booked(camille, { ...NOEL, title: '<a href="https://evil.example">Noël</a>' })

  assert.ok(!emails[0].html.includes('<a href="https://evil.example">'))
  assert.ok(emails[0].html.includes('&lt;a href=&quot;https://evil.example&quot;&gt;Noël&lt;/a&gt;'))
})

test('creating a booking does not wait for the notification', { timeout: 5000 }, async () => {
  let release = () => {}
  const sending = new Promise<void>((resolve) => (release = resolve))
  let sent = 0
  const { camille } = await setup({
    sendEmail: () => {
      sent += 1
      return sending
    },
  })

  // Would never answer if the handler awaited the send.
  const noel = await booked(camille)
  assert.equal(sent, 1)
  assert.equal(noel.title, 'Noël')
  release()
})

// The failure is logged once the response has gone, so give it a turn of the event loop.
async function loggedErrors(t: TestContext, action: () => Promise<unknown>) {
  const error = t.mock.method(console, 'error', () => {})
  await action()
  await new Promise((resolve) => setImmediate(resolve))
  return error.mock.calls.map((call) => call.arguments.map(String).join(' '))
}

test('a notification that fails is logged, and the booking is still created', async (t) => {
  for (const sendEmail of [
    () => Promise.reject(new Error('Resend is down')),
    () => {
      throw new Error('Resend is down')
    },
  ]) {
    const { camille, louis } = await setup({ sendEmail })
    let noel: { id: number } | undefined
    const errors = await loggedErrors(t, async () => (noel = await booked(camille)))
    assert.ok(noel && (await listed(louis, noel.id)))
    assert.ok(errors.some((e) => e.includes('Resend is down')), errors.join('\n'))
  }
})

test('without ADMIN_EMAIL the notification is logged as not sent, and the booking is still created', async (t) => {
  const { camille, emails } = await setup({ adminEmail: '' })
  const errors = await loggedErrors(t, () => booked(camille))
  assert.deepEqual(emails, [])
  assert.ok(errors.some((e) => e.includes('ADMIN_EMAIL')), errors.join('\n'))
})

test('a change posted from another site is refused, even with the session cookie', async () => {
  const { app, camille } = await setup()
  const noel = await booked(camille)
  // The cookie a signed-in browser would attach to a cross-site form post.
  const signIn = await app.request('/api/auth/sign-in/email', {
    method: 'POST',
    headers: { origin: APP_URL, 'content-type': 'application/json', 'x-forwarded-for': nextIp() },
    body: JSON.stringify({ email: 'camille@example.test', password: SUPABASE_PASSWORD }),
  })
  const cookie = signIn.headers.getSetCookie().map((c) => c.split(';')[0]).join('; ')

  for (const [method, path] of [
    ['POST', '/api/bookings'],
    ['POST', `/api/bookings/${noel.id}/status`],
    ['DELETE', `/api/bookings/${noel.id}`],
  ]) {
    const res = await app.request(path, {
      method,
      headers: { origin: 'https://evil.example', cookie, 'content-type': 'application/x-www-form-urlencoded' },
      body: 'status=PENDING',
    })
    assert.equal(res.status, 403, `${method} ${path}`)
  }
  assert.deepEqual(await listed(camille, noel.id), noel)
})
