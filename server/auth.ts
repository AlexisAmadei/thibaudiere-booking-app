import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import type { Db } from './db/index.ts'

// Only the database binding so far. #14 adds bcrypt, invite-only membership, rate
// limiting and the French emails. Regenerate the schema after changing anything here
// that adds tables or fields: `bun run db:auth-schema && bun run db:generate`.
export function createAuth(db: Db) {
  return betterAuth({
    database: drizzleAdapter(db, { provider: 'sqlite' }),
    emailAndPassword: { enabled: true },
  })
}
