# La Thibaudiere - Shared Booking Calendar

A modern web application for managing shared bookings and reservations, built with React, Vite, a Hono server and SQLite, self-hosted on Dokploy.

## Features

- **User Authentication**: Secure sign-in/sign-out with Better Auth (members join by invitation only)
- **Password Reset & Invites**: Email-based password reset, with a tailored onboarding flow for invited users
- **Booking Management**: Create, view, update, and delete reservations
- **Date Range Picker**: Interactive calendar with unavailable date detection and conflict prevention
- **Weather Forecast**: 7-day forecast displayed directly on the calendar (Open-Meteo API)
- **Conflict Tooltips**: Tap an unavailable day to see which booking blocks it
- **Email Notifications**: The admin is notified by email (via Resend) whenever a new booking is created
- **Responsive Design**: Optimized for both desktop and mobile devices
- **Dark Mode Support**: Theme switching with next-themes
- **User Profiles**: Display names and profile management
- **Status Tracking**: Mark bookings as confirmed or pending

## Tech Stack

- **Frontend**: React 19 + Vite 7
- **UI Framework**: Chakra UI 3
- **Routing**: React Router 7
- **Icons**: lucide-react + react-icons
- **Server**: Hono on Node 24, serving the built SPA and `/api` from one process
- **Authentication**: Better Auth (cookie sessions, bcrypt passwords)
- **Database**: SQLite via Drizzle ORM (nightly backups to Cloudflare R2)
- **Styling**: Chakra UI + Tailwind CSS 4
- **Email**: Resend (transactional emails)
- **Tooling**: Bun as package manager only; `node --test` for tests, `tsc` for type checking
- **Deployment**: one Docker image on Dokploy, with the SQLite file on a mounted volume
  ([ADR 0001](docs/adr/0001-sqlite-node-server-on-dokploy.md))

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd thibaudiere-booking-app
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Configure environment variables**

   Copy [.env.example](.env.example) to `.env` and fill it in. `APP_URL` and `BETTER_AUTH_SECRET`
   are required; the `S3_*` and `SUPABASE_DB_URL` variables are only needed for backups and the import.

4. **Seed a local database** (no Docker needed; the file is `./data/dev.sqlite`)
   ```bash
   bun run db:seed
   ```

5. **Start development server** (Vite client and Hono server together)
   ```bash
   bun run dev
   ```

## Project Structure

```
server/                      # Hono server (Node 24)
├── index.ts                  # Entry point: serves the SPA and /api
├── app.ts                    # App assembly
├── api.ts                    # Bookings and member routes (authorization lives here)
├── auth.ts                   # Better Auth setup, invitations, password reset
├── email.ts                  # Resend emails (French HTML)
├── invite.ts                 # `bun run invite <email>`
└── db/                       # Drizzle schema, migrations, seed, backup, pull, import

src/
├── components/               # Reusable UI components
│   ├── AppBar.jsx
│   ├── BookingCard.jsx
│   ├── BookingFilters.jsx
│   ├── Footer.jsx
│   ├── NavMenu.jsx
│   ├── OpenMeteo.jsx
│   ├── WeeklyForecast.jsx
│   ├── Custom/               # Custom components
│   │   ├── DateRangePicker.tsx
│   │   ├── Loading.jsx
│   │   └── MainTabs.jsx
│   └── ui/                   # Chakra UI wrappers
│       ├── color-mode.jsx
│       ├── password-input.jsx
│       ├── provider.jsx
│       ├── toaster.jsx
│       └── tooltip.jsx
├── contexts/                 # React contexts
│   ├── AuthContext.jsx
│   └── BookingContext.jsx
├── hooks/                    # Custom React hooks
│   ├── useIsMobile.js
│   └── useWindowSize.js
├── api/                      # Client for the /api routes
│   ├── auth.ts
│   ├── booking.ts
│   ├── http.ts
│   └── user.ts
├── booking/
│   └── occupancy.ts          # Which booking sits on which calendar day
├── views/                    # Page components
│   ├── App.jsx
│   ├── AddBooking.jsx
│   ├── BookingList.jsx
│   ├── Profile.jsx
│   ├── AuthForm.jsx
│   ├── ResetPassword.jsx
│   └── NotFound.jsx
├── Layout/                   # Layout wrappers
│   └── SecurityLayout.jsx
├── assets/                   # Fonts and static assets
├── theme.js                  # Chakra UI theme
└── main.jsx                  # App entry point
```

## Routes

- `/` — Main view (booking calendar and list)
- `/profile` — User profile management
- `/reset-password` — Password reset / invited-user onboarding
- `*` — Not found

## Key Components

### DateRangePicker
Interactive calendar for selecting date ranges. Highlights unavailable dates,
prevents selecting a range that overlaps an existing booking, shows a 7-day
weather forecast on each day, and displays a tooltip with booking details when
an unavailable day is tapped.

### BookingCard
Individual booking display with status toggle and deletion options.

### AddBooking
Form to create new bookings with date range selection. Triggers an admin email
notification on submission.

### BookingList
Displays all bookings with sorting and filtering capabilities.

## Email Notifications

When a booking is created, the server uses [Resend](https://resend.com) to send a
formatted notification email to `ADMIN_EMAIL`. Weather is decorative and fails
silently; email failures are logged but do not block booking creation.

## Authentication

Uses [Better Auth](https://www.better-auth.com) with email/password and cookie sessions.
Members are stored in the `user` table (`id`, `email`, `name` as display name); nobody can
sign up on their own. An admin invites a member with `bun run invite <email>`
(`docker exec <container> bun run invite <email>` in production).

Password resets and invitations are handled on the `/reset-password` route, which
detects an `invite` type to show tailored messaging. Links are valid for one hour.

## Database Schema

SQLite, managed with Drizzle (`bun run db:generate` for migrations; they are applied on server start).

### bookings table
- `id` (int, primary key)
- `title` (text)
- `start_date` (text, civil date `YYYY-MM-DD`)
- `end_date` (text, civil date `YYYY-MM-DD`)
- `status` ('CONFIRMED' | 'PENDING')
- `created_at` (ISO timestamp)
- `booker` (text, `user.id`; set to null if the member is deleted)

Better Auth's own tables (`user`, `session`, ...) are in `server/db/auth-schema.ts`.


## Available Scripts

```bash
# Development (client + server)
bun run dev

# Build the SPA, then run the server in production mode
bun run build
bun run start

# Tests and type checking
bun run test
bun run typecheck

# Run ESLint
bun run lint

# Database
bun run db:seed      # local sample data
bun run db:backup    # snapshot to R2
bun run db:pull      # fetch newest backup locally

# Invite a member
bun run invite <email>
```

## Backups

The database is one SQLite file on the Dokploy volume. A nightly job snapshots it to a
Cloudflare R2 bucket, which lives off the Dokploy host so that losing the server does not lose
the backups (`docs/adr/0001-sqlite-node-server-on-dokploy.md`).

Both commands read the bucket from the environment (`db:pull` also from a local `.env`):

```env
S3_ENDPOINT=https://<account id>.r2.cloudflarestorage.com
S3_BUCKET=thibaudiere-backups
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
```

### `bun run db:backup`

Takes a consistent copy of the live database with `VACUUM INTO` (safe while the server is
writing: it holds every committed change, including those still in the WAL file, and nothing
half-written), checks its integrity, gzips it and uploads it as
`backups/YYYY-MM-DDTHHMMSSZ.sqlite.gz` (UTC). It then deletes all but the newest 30 backups.
Only keys of exactly that shape are counted or deleted; anything else in the bucket is left
alone. Exits non-zero on any failure.

Retention is by count, done by the job itself, so if backups stop being taken the last 30 are
kept for as long as it takes to notice. Do not add an R2 lifecycle rule that expires
`backups/` by age: it would delete those too.

### Nightly schedule in Dokploy

In the application's **Schedules** tab, add a job that runs inside the app container:

- Schedule: `0 3 * * *` (every night at 03:00, in the server's timezone)
- Command: `bun run db:backup`

The job inherits the application's environment, so the `S3_*` variables go in the
application's **Environment** next to `APP_URL` and the others. Run it once by hand after
setting it up and check that the backup appears in the bucket. Its log shows the uploaded key,
or why it failed.

### `bun run db:pull [--force]`

Downloads the newest backup to the local database (`DATABASE_PATH`, by default
`./data/dev.sqlite`), checks its integrity, and replaces the file only with `--force`. Stop the
dev server first. The `S3_*` variables can go in a local `.env`; a read-only R2 token is enough.
It refuses to run with `NODE_ENV=production`: restore the live database with the procedure
below instead.

**The pulled file contains the real members' email addresses and password hashes.** Keep it
on your machine (`data/` is git-ignored) and delete it when you are done. Members sign in with
their real passwords.

### Restoring production

1. **Pick the backup.** In the R2 dashboard, open the bucket's `backups/` folder and download
   the one to restore. To check it first, `bun run db:pull --force` fetches the newest one
   locally, and `bun run dev` runs the app on it.
2. **Unpack and check it:** `gunzip 2026-10-26T030000Z.sqlite.gz`, then
   `sqlite3 2026-10-26T030000Z.sqlite 'pragma integrity_check'` must print `ok` (`db:pull`
   has already checked the newest one). Copy the file to the Dokploy host, for example with
   `scp`, into the directory you run step 5 from.
3. **Keep the current state**, if the server still runs:
   `docker exec <container> bun run db:backup`. (It counts toward the 30.)
4. **Stop the application** in Dokploy, so nothing writes while the file is replaced.
5. **Replace the file in the volume**, on the Dokploy host. Find the volume mounted at
   `/app/data` in the application's settings, then:

   ```bash
   docker run --rm -v <volume>:/data -v "$PWD":/restore node:24-slim sh -c '
     rm -f /data/thibaudiere.sqlite-wal /data/thibaudiere.sqlite-shm &&
     cp /restore/2026-10-26T030000Z.sqlite /data/thibaudiere.sqlite &&
     chown node:node /data/thibaudiere.sqlite'
   ```

   The `-wal` and `-shm` files must go: SQLite would replay a WAL left by the old database onto
   the restored one.
6. **Start the application.** It applies any migration newer than the backup on start. Sign in
   and check the bookings.

## Importing from Supabase

`bun run db:import [path]` copies the members and bookings from the Supabase project into the
SQLite file at `path` (by default `DATABASE_PATH`, or `./data/dev.sqlite`). It is for the move
off Supabase (#19) and can be rehearsed as often as needed.

- Members keep their Supabase id, email (in lower case), display name and **password**: the
  bcrypt hash is copied unchanged. A member invited on Supabase who never chose a password comes
  across as a pending invitation; `bun run invite <email>` sends them a new link.
- Bookings keep their ids, calendar days, status, `created_at` and booker. New bookings continue
  after the largest id.
- It migrates the file first and refuses one that already has members or bookings. It is all or
  nothing: on a problem (a booker who is not a member, a row the app cannot read, a user Supabase
  has banned or deleted, a count that differs once written) it lists every problem and imports
  nothing, so fix them in Supabase and run it again.
- It prints the members (with and without a password) and bookings (count, first and last day)
  it counted back. It warns about bookings with no start or end date, which Supabase allowed
  but the app cannot show correctly.

It reads `SUPABASE_DB_URL`, which can go in a local `.env`: in the Supabase dashboard, **Connect**,
the **Direct connection** or **Session pooler** string (not the transaction pooler), with the
database password filled in and URL-encoded. The direct one is IPv6-only on the free plan, so use
the session pooler if it cannot connect. The connection uses TLS unless the URL sets `sslmode`.
Resume the project first if Supabase has paused it.

**Rehearse** locally, into a new file each time:

```bash
bun run db:import data/rehearsal.sqlite
DATABASE_PATH=data/rehearsal.sqlite bun run dev
```

Sign in with your real password and compare with Supabase's SQL editor:
`select count(*), min(start_date), max(end_date) from bookings;` and
`select count(*), count(nullif(encrypted_password, '')) from auth.users;`. The file holds the
real members' emails and password hashes: delete it afterwards.

**At cutover**, once members have stopped booking on the old app, start the application in
Dokploy (it creates the empty schema), then import into its volume:

```bash
docker exec -e SUPABASE_DB_URL='postgresql://…' <container> bun run db:import
```

Nobody can sign in until it has run, since there are no members before. To start over after a
successful import, stop the application, delete `thibaudiere.sqlite` and its `-wal` and `-shm`
files from the volume (as in step 5 of the restore above), start it and import again.

## 👨‍💻 Author

Created by [Alexis Amadei](https://github.com/AlexisAmadei)
