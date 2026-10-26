import { backupDatabase } from './backups.ts'
import { databasePath } from './index.ts'
import { s3StoreFromEnv } from './s3.ts'

// `bun run db:backup`: uploads a snapshot of the database to the R2 bucket named by the S3_*
// variables and keeps the newest 30. Run nightly in the app container by a Dokploy schedule
// (README). Safe while the server is running. Exits non-zero on failure, so the job shows it.
try {
  const { key, deleted } = await backupDatabase(databasePath(), s3StoreFromEnv())
  console.log(`Backed up to ${key}.`)
  if (deleted.length) console.log(`Deleted ${deleted.length} older backup(s): ${deleted.join(', ')}.`)
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
}
