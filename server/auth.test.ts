import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { createApp } from './app.ts'
import { createAuth, hashPassword, inviteMember } from './auth.ts'
import { migrateDatabase, openDatabase, type Db } from './db/index.ts'
import type { Email } from './email.ts'

const APP_URL = 'https://thibaudiere.example.test'

// A hash as Supabase Auth stores it (golang.org/x/crypto/bcrypt: `$2a$`, cost 10) for the
// password below, checked with Apache's `htpasswd -vb`: an implementation other than bcryptjs,
// so this proves imported hashes verify rather than that bcryptjs agrees with itself.
const SUPABASE_PASSWORD = 'motdepasse-supabase'
const SUPABASE_HASH = '$2a$10$E.P7oEgovjo2v1dI/rpbQeYoqgyuvzeUIjtZT0YGohNpOskt0vNXe'

// Better Auth's in-memory rate limiter is shared by the whole process and keyed by client IP,
// so each request helper gets its own address to keep the tests independent.
let lastIp = 0
function nextIp() {
  lastIp += 1
  return `192.0.2.${lastIp}`
}

// The app over a freshly migrated database, with every email captured instead of sent.
function setup() {
  const db = openDatabase(join(mkdtempSync(join(tmpdir(), 'thibaudiere-auth-')), 'test.sqlite'))
  migrateDatabase(db)
  const emails: Email[] = []
  const authOptions = {
    appUrl: APP_URL,
    secret: 'test-secret-that-is-at-least-32-characters-long',
    sendEmail: async (email: Email) => {
      emails.push(email)
    },
  }
  const app = createApp({ auth: createAuth(db, authOptions) })
  return { db, authOptions, app, emails, client: client(app) }
}

// A browser on one IP: same-origin JSON requests that keep the session cookie between calls.
function client(app: ReturnType<typeof createApp>) {
  const ip = nextIp()
  let cookie = ''
  return async function request(path: string, body?: unknown) {
    const headers: Record<string, string> = { origin: APP_URL, 'x-forwarded-for': ip }
    if (cookie) headers.cookie = cookie
    if (body !== undefined) headers['content-type'] = 'application/json'
    const res = await app.request(`/api/auth${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    const setCookie = res.headers.getSetCookie()
    if (setCookie.length) cookie = setCookie.map((c) => c.split(';')[0]).join('; ')
    return res
  }
}

// The signed-in member as Better Auth reports them, or null when signed out.
async function sessionOf(request: ReturnType<typeof client>) {
  return (await (await request('/get-session')).json()) as { user: { id: string; email: string; name: string } } | null
}

// A member as the import (#18) writes them: a user row and a credential account holding the hash.
function addMember(db: Db, email: string, passwordHash: string) {
  const id = randomUUID()
  db.$client.prepare('insert into user (id, name, email) values (?, ?, ?)').run(id, 'Camille', email)
  db.$client
    .prepare("insert into account (id, account_id, provider_id, user_id, password, updated_at) values (?, ?, 'credential', ?, ?, ?)")
    .run(randomUUID(), id, id, passwordHash, Date.now())
}

test('a member signs in with a bcrypt hash generated the way Supabase does', async () => {
  const { db, client } = setup()
  addMember(db, 'camille@example.test', SUPABASE_HASH)

  const res = await client('/sign-in/email', { email: 'camille@example.test', password: SUPABASE_PASSWORD })
  assert.equal(res.status, 200)
  assert.match(res.headers.get('set-cookie') ?? '', /HttpOnly/i)

  assert.equal((await sessionOf(client))?.user.email, 'camille@example.test')
})

test('signing out ends the session on the server, not just in the browser', async () => {
  const { db, app, client } = setup()
  addMember(db, 'camille@example.test', SUPABASE_HASH)
  const signIn = await client('/sign-in/email', { email: 'camille@example.test', password: SUPABASE_PASSWORD })
  const cookie = signIn.headers.getSetCookie().map((c) => c.split(';')[0]).join('; ')

  const res = await client('/sign-out', {})
  assert.equal(res.status, 200)
  assert.equal(await sessionOf(client), null)

  // The cookie from before signing out, replayed: the session behind it is gone.
  const replay = await app.request('/api/auth/get-session', { headers: { cookie, 'x-forwarded-for': nextIp() } })
  assert.equal(await replay.json(), null)
})

test('a wrong password is refused and opens no session', async () => {
  const { db, client } = setup()
  addMember(db, 'camille@example.test', SUPABASE_HASH)

  const res = await client('/sign-in/email', { email: 'camille@example.test', password: 'pas-le-bon' })
  assert.equal(res.status, 401)
  assert.equal(await sessionOf(client), null)
})

test('nobody can sign up: members join only by invitation', async () => {
  const { client } = setup()

  const res = await client('/sign-up/email', { email: 'intrus@example.test', password: 'motdepasse', name: 'Intrus' })
  assert.equal(res.status, 400)
  const signIn = await client('/sign-in/email', { email: 'intrus@example.test', password: 'motdepasse' })
  assert.equal(signIn.status, 401)
})

test('repeated sign-in attempts from one address are rate limited', async () => {
  const { db, client } = setup()
  addMember(db, 'camille@example.test', SUPABASE_HASH)

  // Better Auth allows 3 sign-in attempts per 10 seconds per address.
  for (let i = 0; i < 3; i++) {
    const res = await client('/sign-in/email', { email: 'camille@example.test', password: 'pas-le-bon' })
    assert.equal(res.status, 401)
  }
  const res = await client('/sign-in/email', { email: 'camille@example.test', password: SUPABASE_PASSWORD })
  assert.equal(res.status, 429)
})

// The link in a captured email, after checking that it lands on the SPA's page and that the
// HTML and plain-text versions carry the same one.
function linkIn(email: Email) {
  const link = email.text.match(/https:\/\/\S+/)?.[0] ?? ''
  assert.ok(email.html.includes(`href="${link}"`), 'the HTML has the same link')
  const url = new URL(link)
  assert.equal(url.origin + url.pathname, `${APP_URL}/reset-password`)
  return url
}

test('a member resets a forgotten password from the emailed link', async () => {
  const { db, client, emails } = setup()
  addMember(db, 'camille@example.test', SUPABASE_HASH)

  const res = await client('/request-password-reset', { email: 'camille@example.test' })
  assert.equal(res.status, 200)
  assert.equal(emails.length, 1)
  assert.equal(emails[0].to, 'camille@example.test')
  assert.equal(emails[0].subject, 'Réinitialisation de votre mot de passe')
  const link = linkIn(emails[0])
  assert.equal(link.searchParams.get('type'), null)
  const token = link.searchParams.get('token')

  const reset = await client('/reset-password', { token, newPassword: 'nouveau-mot-de-passe' })
  assert.equal(reset.status, 200)
  const old = await client('/sign-in/email', { email: 'camille@example.test', password: SUPABASE_PASSWORD })
  assert.equal(old.status, 401)
  const signIn = await client('/sign-in/email', { email: 'camille@example.test', password: 'nouveau-mot-de-passe' })
  assert.equal(signIn.status, 200)

  // The link works once.
  const again = await client('/reset-password', { token, newPassword: 'encore-un-autre' })
  assert.equal(again.status, 400)
})

test('asking to reset an unknown address answers the same and sends nothing', async () => {
  const { client, emails } = setup()

  const res = await client('/request-password-reset', { email: 'inconnu@example.test' })
  assert.equal(res.status, 200)
  assert.deepEqual(emails, [])
})

test('new passwords are hashed in the format imported from Supabase', async () => {
  const hash = await hashPassword('nouveau-mot-de-passe')
  assert.match(hash, /^\$2a\$10\$/)
})

test('an invited member chooses a password from the French invitation, then signs in', async () => {
  const { db, authOptions, client, emails } = setup()

  await inviteMember(db, ' Nouveau@Example.test ', authOptions)

  assert.equal(emails.length, 1)
  assert.equal(emails[0].to, 'nouveau@example.test')
  assert.equal(emails[0].subject, 'Invitation à La Thibaudière')
  const link = linkIn(emails[0])
  // Lets the page greet a new member rather than ask for a "new" password.
  assert.equal(link.searchParams.get('type'), 'invite')

  const accept = await client('/reset-password', { token: link.searchParams.get('token'), newPassword: 'mon-mot-de-passe' })
  assert.equal(accept.status, 200)
  const signIn = await client('/sign-in/email', { email: 'nouveau@example.test', password: 'mon-mot-de-passe' })
  assert.equal(signIn.status, 200)
  // No display name yet, so the SPA prompts them to choose one.
  assert.equal((await sessionOf(client))?.user.name, '')
})

test('inviting someone again before they accept sends a fresh invitation', async () => {
  const { db, authOptions, emails } = setup()

  await inviteMember(db, 'nouveau@example.test', authOptions)
  await inviteMember(db, 'nouveau@example.test', authOptions)

  assert.deepEqual(
    emails.map((e) => linkIn(e).searchParams.get('type')),
    ['invite', 'invite'],
  )
})

test('inviting an existing member is refused and sends nothing', async () => {
  const { db, authOptions, emails } = setup()
  addMember(db, 'camille@example.test', SUPABASE_HASH)

  await assert.rejects(inviteMember(db, 'camille@example.test', authOptions), /already a member/)
  assert.deepEqual(emails, [])
})

test('a sign-in posted from another site is refused', async () => {
  const { db, app } = setup()
  addMember(db, 'camille@example.test', SUPABASE_HASH)

  const res = await app.request('/api/auth/sign-in/email', {
    method: 'POST',
    headers: { origin: 'https://evil.example', 'content-type': 'application/json', 'x-forwarded-for': nextIp() },
    body: JSON.stringify({ email: 'camille@example.test', password: SUPABASE_PASSWORD }),
  })
  assert.equal(res.status, 403)
})

test('an invitation that could not be sent is reported, and inviting again retries', async () => {
  const { db, authOptions, emails } = setup()
  const refused = { ...authOptions, sendEmail: async () => Promise.reject(new Error('Resend is down')) }

  await assert.rejects(inviteMember(db, 'nouveau@example.test', refused), /Resend is down/)
  await inviteMember(db, 'nouveau@example.test', authOptions)
  assert.equal(linkIn(emails[0]).searchParams.get('type'), 'invite')
})
