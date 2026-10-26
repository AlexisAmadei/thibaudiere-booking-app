import Database from 'better-sqlite3'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { gunzipSync, gzipSync } from 'node:zlib'

// Nightly backups of the SQLite file to R2 (`bun run db:backup`) and fetching the newest one
// for local dev (`bun run db:pull`). See docs/adr/0001-sqlite-node-server-on-dokploy.md.

// Where backups are kept, in R2 in production (s3.ts) and in memory in the tests.
export interface BackupStore {
  list(prefix: string): Promise<string[]>
  put(key: string, body: Uint8Array): Promise<void>
  get(key: string): Promise<Uint8Array>
  delete(key: string): Promise<void>
}

const PREFIX = 'backups/'
// The newest 30 are kept (ADR 0001). Counted rather than aged, so if backups stop being taken
// the last ones are never deleted. An R2 lifecycle rule would expire them by age instead.
const KEEP = 30

// `backups/2026-10-26T031507Z.sqlite.gz`: UTC, to the second, so keys sort by age.
function backupKey(now: Date) {
  return `${PREFIX}${now.toISOString().replace(/\.\d+Z$/, 'Z').replaceAll(':', '')}.sqlite.gz`
}

// Only keys this module wrote count as backups, so nothing else in the bucket is ever deleted.
const BACKUP_KEY = /^backups\/\d{4}-\d{2}-\d{2}T\d{6}Z\.sqlite\.gz$/

// Oldest first.
async function listBackups(store: BackupStore) {
  return (await store.list(PREFIX)).filter((key) => BACKUP_KEY.test(key)).sort()
}

// Throws unless the file at `path` is a sound SQLite database.
function checkIntegrity(path: string) {
  const sqlite = new Database(path, { readonly: true, fileMustExist: true })
  try {
    const result = sqlite.pragma('integrity_check', { simple: true })
    if (result !== 'ok') throw new Error(`integrity check failed: ${result}`)
  } finally {
    sqlite.close()
  }
}

export async function backupDatabase(databasePath: string, store: BackupStore, { now = new Date() } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'thibaudiere-backup-'))
  try {
    const snapshotPath = join(dir, 'snapshot.sqlite')
    // Read-only: the backup never writes to the live database.
    const sqlite = new Database(databasePath, { readonly: true, fileMustExist: true })
    try {
      sqlite.prepare('vacuum into ?').run(snapshotPath)
    } finally {
      sqlite.close()
    }
    // Never replace a sound backup with a damaged one in the newest 30.
    checkIntegrity(snapshotPath)
    const key = backupKey(now)
    await store.put(key, gzipSync(readFileSync(snapshotPath)))

    // Only once the new backup is safely uploaded.
    const deleted = (await listBackups(store)).slice(0, -KEEP)
    for (const old of deleted) await store.delete(old)
    return { key, deleted }
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

// Downloads the newest backup to `databasePath`, which it replaces only when `force` is set.
// Returns the backup's key.
export async function pullLatestBackup(store: BackupStore, databasePath: string, { force = false } = {}) {
  if (existsSync(databasePath) && !force) {
    throw new Error(`${databasePath} already exists. Pass --force to replace it with the backup.`)
  }
  const key = (await listBackups(store)).at(-1)
  if (!key) throw new Error(`No backup found under ${PREFIX}.`)
  const gzipped = await store.get(key)

  mkdirSync(dirname(databasePath), { recursive: true })
  const pulled = `${databasePath}.pulled`
  try {
    writeFileSync(pulled, gunzipSync(gzipped))
    checkIntegrity(pulled)
  } catch (error) {
    rmSync(pulled, { force: true })
    throw new Error(`${key} is damaged: ${error instanceof Error ? error.message : error}`)
  }
  // SQLite would replay a WAL left by the replaced database (a dev server that was killed)
  // onto the pulled one, so it goes, and its index with it.
  for (const leftover of [`${databasePath}-wal`, `${databasePath}-shm`]) rmSync(leftover, { force: true })
  renameSync(pulled, databasePath)
  return key
}
