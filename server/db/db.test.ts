import assert from 'node:assert/strict'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { migrateDatabase, openDatabase } from './index.ts'

function tempDatabasePath() {
  return join(mkdtempSync(join(tmpdir(), 'thibaudiere-db-')), 'test.sqlite')
}

// The raw better-sqlite3 handle of a freshly migrated database.
function freshSqlite() {
  const db = openDatabase(tempDatabasePath())
  migrateDatabase(db)
  return db.$client
}

test('migrating an empty file creates the schema', () => {
  const sqlite = freshSqlite()
  const tables = sqlite
    .prepare("select name from sqlite_master where type = 'table' and name not like 'sqlite_%' and name not like '__drizzle%' order by name")
    .pluck()
    .all()
  assert.deepEqual(tables, ['account', 'bookings', 'session', 'user', 'verification'])
})

test('a booking status is CONFIRMED or PENDING, and CONFIRMED by default', () => {
  const sqlite = freshSqlite()
  const insert = sqlite.prepare('insert into bookings (title, status) values (?, ?)')
  insert.run('Pâques', 'PENDING')
  assert.throws(() => insert.run('Été', 'CANCELLED'), /CHECK constraint failed/)

  const { id } = sqlite.prepare("insert into bookings (title) values ('Toussaint') returning id").get() as { id: number }
  assert.equal(sqlite.prepare('select status from bookings where id = ?').pluck().get(id), 'CONFIRMED')
})

test('deleting a member keeps their bookings, with no booker', () => {
  const sqlite = freshSqlite()
  sqlite.prepare("insert into user (id, name, email) values ('m1', 'Camille', 'camille@example.test')").run()
  sqlite.prepare("insert into bookings (title, booker) values ('Noël', 'm1')").run()

  sqlite.prepare("delete from user where id = 'm1'").run()

  assert.deepEqual(sqlite.prepare('select title, booker from bookings').all(), [{ title: 'Noël', booker: null }])
})

test('new bookings are numbered after imported ids, which are never reused', () => {
  const sqlite = freshSqlite()
  sqlite.prepare("insert into bookings (id, title) values (41, 'Importée')").run()
  sqlite.prepare("insert into bookings (id, title) values (42, 'Importée aussi')").run()
  sqlite.prepare('delete from bookings where id = 42').run()

  const { id } = sqlite.prepare("insert into bookings (title) values ('Nouvelle') returning id").get() as { id: number }
  assert.equal(id, 43)
})

test('restarting on an existing file keeps its data, in WAL mode', () => {
  const path = tempDatabasePath()
  const first = openDatabase(path)
  migrateDatabase(first)
  first.$client.prepare("insert into bookings (title) values ('Pentecôte')").run()
  first.$client.close()

  const again = openDatabase(path)
  migrateDatabase(again)
  assert.equal(again.$client.pragma('journal_mode', { simple: true }), 'wal')
  assert.deepEqual(again.$client.prepare('select title from bookings').pluck().all(), ['Pentecôte'])
})
