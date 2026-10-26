import { serve } from '@hono/node-server'
import { fileURLToPath } from 'node:url'
import { createApi } from './api.ts'
import { createApp } from './app.ts'
import { createAuth } from './auth.ts'
import { migrateDatabase, openDatabase } from './db/index.ts'

const port = Number(process.env.PORT ?? 3000)

// Creates the schema on an empty volume and applies any new migration before serving.
const db = openDatabase()
migrateDatabase(db)

// In dev the SPA comes from Vite, which proxies `/api` to this server.
const staticRoot =
  process.env.NODE_ENV === 'production'
    ? fileURLToPath(new URL('../dist', import.meta.url))
    : undefined

const auth = createAuth(db)
const app = createApp({ staticRoot, auth, api: createApi(db, auth) })

const server = serve({ fetch: app.fetch, port }, (info) => {
  const mode = staticRoot ? `serving the SPA from ${staticRoot}` : 'API only (NODE_ENV is not production)'
  console.log(`Server listening on port ${info.port}, ${mode}`)
})

// Node as PID 1 in the container ignores SIGTERM by default; close cleanly on `docker stop`.
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () =>
    server.close(() => {
      db.$client.close()
      process.exit(0)
    }),
  )
}
