---
status: accepted
---

# SQLite and a single Node server on Dokploy, replacing Vercel + Supabase

La Thibaudière serves a small, closed set of members, but it runs on two hosted platforms:
Vercel for the SPA and one function, Supabase for Postgres, auth and RLS. Supabase's free tier
pauses the project after a week without activity (#4), and local development means running the
Supabase CLI stack in Docker. We are moving to one Docker image on our own Dokploy server. It
runs a Hono app on Node 24 that serves the built SPA and `/api`, with Better Auth for sessions
and Drizzle over a SQLite file on a mounted volume. A nightly `VACUUM INTO` snapshot is uploaded
to Cloudflare R2.

The migration changes the stack only. Every current authorization rule, including the
any-member delete (#20), is ported as-is, and app-logic changes are tracked separately.

## Consequences

- **One replica, stop-then-start deploys.** SQLite has a single writer and Better Auth's rate
  limiter keeps its state in memory, so the app cannot be scaled horizontally or rolled without a
  short gap. That is acceptable at this scale.
- **Authorization moves from RLS into route handlers.** The database no longer enforces anything,
  so every `/api` route has to check the session and the booker rule itself.
- **Passwords stay bcrypt.** Supabase's hashes are bcrypt (`$2a$10$…`). Better Auth is configured
  with custom bcrypt `hash`/`verify` so imported members keep their passwords and there is only one
  hashing path, instead of Better Auth's default scrypt.
- **Ids are preserved.** `user.id` is text so Supabase UUIDs survive import, and bookings keep
  their integer ids.
- **Backups are ours to run.** R2 is off the Dokploy host on purpose, so a lost server does not
  take the backups with it. The backup job keeps the newest 30 snapshots; restoring is a
  documented manual procedure.
- **Local dev needs no Docker.** `pnpm db:seed && pnpm dev` runs against a local file, and
  `pnpm db:pull` can fetch a real backup (which contains real emails and password hashes).

## Considered options

- **Keep Supabase, add a keep-alive ping (#4).** Fixes the pausing but not local development, and
  keeps two vendors for a tiny app.
- **Self-host Supabase or Postgres on Dokploy.** Removes the free-tier limit but adds a second
  service to run and back up, for a dataset that fits in one file.
