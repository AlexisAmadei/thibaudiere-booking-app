import Database from 'better-sqlite3'
import assert from 'node:assert/strict'
import { existsSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { gunzipSync, gzipSync } from 'node:zlib'
import { createApi } from '../api.ts'
import { createApp } from '../app.ts'
import { createAuth } from '../auth.ts'
import { addMember, APP_URL, browser, freshDatabase, SECRET, SUPABASE_HASH, SUPABASE_PASSWORD } from '../test-support.ts'
import { backupDatabase, pullLatestBackup, type BackupStore } from './backups.ts'
import { migrateDatabase, openDatabase } from './index.ts'

// A bucket in memory, standing in for R2.
function memoryStore(keys: string[] = []) {
  const objects = new Map<string, Uint8Array>(keys.map((key) => [key, new Uint8Array()]))
  const store: BackupStore = {
    async list(prefix) {
      return [...objects.keys()].filter((key) => key.startsWith(prefix))
    },
    async put(key, body) {
      objects.set(key, body)
    },
    async get(key) {
      const body = objects.get(key)
      if (!body) throw new Error(`No such key: ${key}`)
      return body
    },
    async delete(key) {
      objects.delete(key)
    },
  }
  return { store, objects }
}

// A path in a new, empty directory.
function scratchPath(name = 'dev.sqlite') {
  return join(mkdtempSync(join(tmpdir(), 'thibaudiere-pull-')), name)
}

// Opens a gzipped snapshot as a database, from a scratch file.
function openSnapshot(gzipped: Uint8Array) {
  const path = join(mkdtempSync(join(tmpdir(), 'thibaudiere-snapshot-')), 'snapshot.sqlite')
  writeFileSync(path, gunzipSync(gzipped))
  return new Database(path, { readonly: true })
}

test('a backup uploads a gzipped copy of the database, named after when it was taken', async () => {
  const db = freshDatabase()
  db.$client.prepare("insert into bookings (title) values ('Noël')").run()
  const { store, objects } = memoryStore()

  const { key } = await backupDatabase(db.$client.name, store, { now: new Date('2026-10-26T03:15:07.123Z') })

  assert.equal(key, 'backups/2026-10-26T031507Z.sqlite.gz')
  const snapshot = openSnapshot(objects.get(key)!)
  assert.deepEqual(snapshot.prepare('select title from bookings').pluck().all(), ['Noël'])
})

test('a backup taken while the server is writing holds what was committed, and nothing half-written', async () => {
  const db = freshDatabase()
  const server = db.$client
  // Committed, but still in the WAL file rather than the database file: the server's
  // connection is open, so nothing has checkpointed it. Copying the file would miss it.
  server.prepare("insert into bookings (title) values ('Noël')").run()
  server.prepare('begin immediate').run()
  server.prepare("insert into bookings (title) values ('Pas encore')").run()
  const { store, objects } = memoryStore()

  const { key } = await backupDatabase(server.name, store)
  server.prepare('commit').run()

  const snapshot = openSnapshot(objects.get(key)!)
  assert.deepEqual(snapshot.prepare('select title from bookings').pluck().all(), ['Noël'])
})

// 03:00 UTC on 1 October 2026 plus `day` days, and the key of the backup taken then.
function night(day: number) {
  return new Date(Date.UTC(2026, 9, 1 + day, 3))
}
function nightlyKey(day: number) {
  return `backups/${night(day).toISOString().slice(0, 10)}T030000Z.sqlite.gz`
}

test('a backup keeps the newest 30 backups and deletes the older ones, leaving other objects alone', async () => {
  const db = freshDatabase()
  const earlier = Array.from({ length: 32 }, (_, day) => nightlyKey(day))
  const others = ['backups/README.txt', 'exports/2026-01-01T000000Z.sqlite.gz']
  const { store, objects } = memoryStore([...earlier, ...others])

  const { key, deleted } = await backupDatabase(db.$client.name, store, { now: night(32) })

  assert.equal(key, nightlyKey(32))
  assert.deepEqual(deleted, [nightlyKey(0), nightlyKey(1), nightlyKey(2)])
  assert.deepEqual([...objects.keys()].sort(), [...others, ...Array.from({ length: 30 }, (_, i) => nightlyKey(i + 3))].sort())
})

test('a backup of a database that does not exist fails, rather than uploading an empty one', async () => {
  const path = join(mkdtempSync(join(tmpdir(), 'thibaudiere-missing-')), 'thibaudiere.sqlite')
  const { store, objects } = memoryStore([nightlyKey(0)])

  await assert.rejects(backupDatabase(path, store), /unable to open database file/)

  assert.equal(existsSync(path), false)
  assert.deepEqual([...objects.keys()], [nightlyKey(0)])
})

test('the newest backup, pulled, is a database the app runs against', async () => {
  const production = freshDatabase()
  addMember(production, 'camille@example.test', SUPABASE_HASH, 'Camille')
  production.$client.prepare("insert into bookings (title, start_date, end_date) values ('Noël', '2026-12-24', '2026-12-27')").run()
  const { store } = memoryStore()
  await backupDatabase(production.$client.name, store, { now: night(0) })
  production.$client.prepare("insert into bookings (title, start_date, end_date) values ('Pâques', '2027-03-27', '2027-03-29')").run()
  const { key: newest } = await backupDatabase(production.$client.name, store, { now: night(1) })
  const path = scratchPath()

  assert.equal(await pullLatestBackup(store, path), newest)

  const db = openDatabase(path)
  migrateDatabase(db)
  const auth = createAuth(db, { appUrl: APP_URL, secret: SECRET })
  const request = browser(createApp({ auth, api: createApi(db, auth, { appUrl: APP_URL, sendEmail: async () => {} }) }))
  const signIn = await request('POST', '/api/auth/sign-in/email', { email: 'camille@example.test', password: SUPABASE_PASSWORD })
  assert.equal(signIn.status, 200)
  const bookings = (await (await request('GET', '/api/bookings?from=2026-01-01')).json()) as { title: string }[]
  assert.deepEqual(bookings.map((b) => b.title), ['Noël', 'Pâques'])
})

test('pulling refuses to replace an existing database unless forced', async () => {
  const production = freshDatabase()
  production.$client.prepare("insert into bookings (title) values ('Noël')").run()
  const { store } = memoryStore()
  await backupDatabase(production.$client.name, store)
  const path = scratchPath()
  const local = openDatabase(path)
  migrateDatabase(local)
  local.$client.prepare("insert into bookings (title) values ('Locale')").run()
  local.$client.close()

  await assert.rejects(pullLatestBackup(store, path), /already exists.*--force/)
  assert.deepEqual(new Database(path).prepare('select title from bookings').pluck().all(), ['Locale'])

  await pullLatestBackup(store, path, { force: true })
  assert.deepEqual(new Database(path).prepare('select title from bookings').pluck().all(), ['Noël'])
})

test('a forced pull discards the replaced database’s leftover WAL, which would otherwise be replayed onto it', async () => {
  const production = freshDatabase()
  production.$client.prepare("insert into bookings (title) values ('Noël')").run()
  const { store } = memoryStore()
  await backupDatabase(production.$client.name, store)
  // A dev server killed mid-session leaves its WAL file behind.
  const path = scratchPath()
  const local = openDatabase(path)
  migrateDatabase(local)
  local.$client.pragma('wal_checkpoint(TRUNCATE)')
  local.$client.prepare("insert into bookings (title) values ('Locale')").run()
  const wal = readFileSync(`${path}-wal`)
  local.$client.close()
  writeFileSync(`${path}-wal`, wal)

  await pullLatestBackup(store, path, { force: true })

  assert.deepEqual(new Database(path).prepare('select title from bookings').pluck().all(), ['Noël'])
})

test('a damaged backup is not pulled, and the local database is left as it was', async () => {
  const production = freshDatabase()
  const { store, objects } = memoryStore()
  const { key } = await backupDatabase(production.$client.name, store, { now: night(0) })
  const whole = gunzipSync(objects.get(key)!)
  objects.set(nightlyKey(1), gzipSync(whole.subarray(0, whole.length / 2)))
  const path = scratchPath()
  writeFileSync(path, whole)

  await assert.rejects(pullLatestBackup(store, path, { force: true }), new RegExp(`${nightlyKey(1)} is damaged`))

  assert.deepEqual(readFileSync(path), whole)
  assert.deepEqual(readdirSync(dirname(path)), ['dev.sqlite'])
})
