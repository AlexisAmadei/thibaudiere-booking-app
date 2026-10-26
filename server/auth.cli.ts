import { createAuth } from './auth.ts'
import { openDatabase } from './db/index.ts'

// Read only by the Better Auth CLI (`bun run db:auth-schema`), which needs an `auth`
// export. The generated schema doesn't depend on any data, so an in-memory database will do.
export const auth = createAuth(openDatabase(':memory:'))
