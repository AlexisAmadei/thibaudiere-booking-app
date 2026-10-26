import { defineConfig } from 'drizzle-kit'

// `bun run db:generate` writes SQL migrations to server/db/migrations; commit them.
// The server applies them on start (server/index.ts).
export default defineConfig({
  dialect: 'sqlite',
  schema: './server/db/schema.ts',
  out: './server/db/migrations',
})
