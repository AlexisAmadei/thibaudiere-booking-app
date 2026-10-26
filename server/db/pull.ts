import { parseArgs } from 'node:util'
import { pullLatestBackup } from './backups.ts'
import { databasePath } from './index.ts'
import { s3StoreFromEnv } from './s3.ts'

// `bun run db:pull [--force]`: downloads the newest backup to the local database, to run the
// app against real data. Stop the dev server first. The S3_* variables can come from a local
// `.env`. The file holds the real members' emails and password hashes, so it stays on your
// machine (`data/` is not committed).
if (process.env.NODE_ENV === 'production') {
  console.error('Refusing to pull with NODE_ENV=production: restoring the live database is the manual procedure in the README.')
  process.exit(1)
}

try {
  const { values } = parseArgs({ options: { force: { type: 'boolean', default: false } } })
  const path = databasePath()
  const key = await pullLatestBackup(s3StoreFromEnv(), path, { force: values.force })
  console.log(`Pulled ${key} into ${path}. Members sign in with their real passwords.`)
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
}
