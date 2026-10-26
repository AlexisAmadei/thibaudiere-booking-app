import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import type { createApi } from './api.ts'
import type { Auth } from './auth.ts'

// Carried over unchanged from `vercel.json`. The CSP still allows Supabase and Vercel
// Analytics because the SPA talks to them until the switch-over (#16).
const SECURITY_HEADERS = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy-Report-Only':
    "default-src 'self'; script-src 'self' https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.open-meteo.com https://vitals.vercel-insights.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
}

type AppOptions = {
  // Built SPA (`dist/`). Omitted in dev, where Vite serves the SPA and proxies `/api` here.
  staticRoot?: string
  // Answers `/api/auth/*` (sign-in, sign-out, session, password reset). Omitted only by
  // tests that don't touch auth.
  auth?: Auth
  // The bookings and member API, from `createApi`. Omitted only by tests that don't touch it.
  api?: ReturnType<typeof createApi>
}

export function createApp({ staticRoot, auth, api: dataApi }: AppOptions = {}) {
  const app = new Hono()

  app.use(async (c, next) => {
    await next()
    for (const [name, value] of Object.entries(SECURITY_HEADERS)) c.header(name, value)
  })

  const api = new Hono()
  api.get('/health', (c) => c.json({ ok: true }))
  if (auth) api.on(['GET', 'POST'], '/auth/*', (c) => auth.handler(c.req.raw))
  if (dataApi) api.route('/', dataApi)
  // Must stay last: an unmatched `/api` call is a 404, never the SPA fallback below.
  api.all('*', (c) => c.json({ error: 'Not found' }, 404))
  app.route('/api', api)

  if (staticRoot) {
    app.get('*', serveStatic({ root: staticRoot }))
    app.get('*', serveStatic({ root: staticRoot, path: 'index.html' }))
  }

  return app
}
