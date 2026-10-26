import { inviteMember } from './auth.ts'
import { migrateDatabase, openDatabase } from './db/index.ts'

// `bun run invite <email>`, also inside the container: `docker exec <container> bun run invite <email>`.
// Uses the same APP_URL, BETTER_AUTH_SECRET and RESEND_API_KEY as the server; without
// RESEND_API_KEY outside production the invitation is printed instead of sent.
const email = process.argv[2]
if (!email) {
  console.error('Usage: bun run invite <email>')
  process.exit(1)
}

const db = openDatabase()
migrateDatabase(db)
try {
  console.log(`Invitation sent to ${await inviteMember(db, email)}.`)
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
} finally {
  db.$client.close()
}
