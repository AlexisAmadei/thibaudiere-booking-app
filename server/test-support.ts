import { randomUUID } from 'node:crypto'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { createApp } from './app.ts'
import { migrateDatabase, openDatabase, type Db } from './db/index.ts'

// Shared by the test files that go through the HTTP endpoints.

export const APP_URL = 'https://thibaudiere.example.test'
export const SECRET = 'test-secret-that-is-at-least-32-characters-long'

// A hash as Supabase Auth stores it (golang.org/x/crypto/bcrypt: `$2a$`, cost 10) for the
// password below, checked with Apache's `htpasswd -vb`: an implementation other than bcryptjs,
// so this proves imported hashes verify rather than that bcryptjs agrees with itself.
export const SUPABASE_PASSWORD = 'motdepasse-supabase'
export const SUPABASE_HASH = '$2a$10$E.P7oEgovjo2v1dI/rpbQeYoqgyuvzeUIjtZT0YGohNpOskt0vNXe'

export function freshDatabase() {
  const db = openDatabase(join(mkdtempSync(join(tmpdir(), 'thibaudiere-test-')), 'test.sqlite'))
  migrateDatabase(db)
  return db
}

// Better Auth's in-memory rate limiter is shared by the whole process and keyed by client IP,
// so each browser gets its own address to keep the tests independent.
let lastIp = 0
export function nextIp() {
  lastIp += 1
  return `192.0.2.${lastIp}`
}

// A browser on one IP, as a `fetch`: same-origin requests that keep the session cookie
// between calls. Stands in for the global `fetch` when testing the SPA's `src/api` client.
export function browserFetch(app: ReturnType<typeof createApp>) {
  const ip = nextIp()
  let cookie = ''
  return async function fetch(input: string, init: RequestInit = {}) {
    const headers = new Headers(init.headers)
    headers.set('origin', APP_URL)
    headers.set('x-forwarded-for', ip)
    if (cookie) headers.set('cookie', cookie)
    const res = await app.request(input, { ...init, headers })
    const setCookie = res.headers.getSetCookie()
    if (setCookie.length) cookie = setCookie.map((c) => c.split(';')[0]).join('; ')
    return res
  }
}

// A browser on one IP: same-origin JSON requests that keep the session cookie between calls.
export function browser(app: ReturnType<typeof createApp>) {
  const fetch = browserFetch(app)
  return function request(method: string, path: string, body?: unknown) {
    if (body === undefined) return fetch(path, { method })
    return fetch(path, { method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
  }
}

// A member as the import (#18) writes them: a user row and a credential account holding the
// hash. Returns their id.
export function addMember(db: Db, email: string, passwordHash: string, name = 'Camille') {
  const id = randomUUID()
  db.$client.prepare('insert into user (id, name, email) values (?, ?, ?)').run(id, name, email)
  db.$client
    .prepare("insert into account (id, account_id, provider_id, user_id, password, updated_at) values (?, ?, 'credential', ?, ?, ?)")
    .run(randomUUID(), id, id, passwordHash, Date.now())
  return id
}
