# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Package manager is **Bun** (`bun install`, `bun run <script>`). Bun is only the package manager: the
server and Vite still run on Node 24.

There is no test framework and no type-check script in this project.

`vite dev` does not run the `api/` serverless functions — calls to `/api/send-booking-email`
404 locally. Use `vercel dev` if you need to exercise the email path end to end.

## Environment

Client (must be `VITE_`-prefixed, read in [client.ts](src/supabase/client.ts), throws at import
time if missing):
`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

Server (Vercel function only): `RESEND_API_KEY`, `ADMIN_EMAIL`, `APP_URL`

## Architecture

**Provider chain** ([main.jsx](src/main.jsx)) — order matters:
`BrowserRouter` → `Provider` (Chakra + next-themes) → `AuthProvider` → `BookingProvider` →
`SecurityLayout` → `Routes`. `AuthProvider` calls `useNavigate`, so it must stay inside the router.

**Auth gate** — [SecurityLayout.jsx](src/Layout/SecurityLayout.jsx) wraps *all* routes. If there is
no user it renders `AuthForm` instead of the route tree; `/reset-password` is the only exception
(it must be reachable while signed out, and for the Supabase `invite` flow). Route-level auth
checks are therefore unnecessary — add exempt paths here instead.

`AuthContext` also watches for `PASSWORD_RECOVERY` events and for `SIGNED_IN` with a
`type=invite` URL hash fragment, redirecting both to `/reset-password`. It toasts users with no
`display_name` in `profiles`, prompting them to complete their profile.

**Data flow** — [BookingContext.jsx](src/contexts/BookingContext.jsx) holds the read state
(`bookings`, `unavailableDates`) and is populated by `fetchBookings()`, called once from
[App.jsx](src/views/App.jsx). Writes are *not* in the context: components import
`createBooking` / `updateBooking` / `deleteBooking` directly from
[booking.ts](src/supabase/booking.ts) and then call `refetch()` from the context. Keep that
pattern — mutate via `src/supabase/*`, then `refetch()`.

Note `getAllBookings()` filters `end_date >= today`, so the app holds bookings that are
**unfinished** — including stays already in progress. Anything needing finished bookings must
query separately.

**Responsive layout** — `useIsMobile()` (< 768px) switches [App.jsx](src/views/App.jsx) between
`MainTabs` (tabbed, mobile) and a side-by-side flex row. `AddBooking` and `BookingList` are
rendered by both branches and take an `isMobile` prop; changes to either must work in both.

Beware: the mobile `MainTabs` path does not pass `onBookingAdded` / `onBookingDeleted`, so those
components rely on the context's `refetch()` in their `finally` blocks rather than the callbacks.

**Occupancy** — which booking sits on which calendar day — lives in
[occupancy.ts](src/booking/occupancy.ts) and nowhere else. `BookingContext` derives it from the
bookings it already holds (`useMemo`, no extra query) and `AddBooking` passes it straight to
`DateRangePicker`, which asks it `on(date)` and `rangeIsFree(start, end)` rather than computing
anything itself. Day expansion, the CONFIRMED-over-PENDING precedence and the range conflict scan
all belong to that module. See `CONTEXT.md` for the vocabulary.

**Email notification** — [AddBooking.jsx](src/views/AddBooking.jsx) fires a deliberately
un-awaited `fetch('/api/send-booking-email')` after a successful insert; failures are logged only
and must never block booking creation. The handler in
[send-booking-email.js](api/send-booking-email.js) renders the French HTML email via Resend.

## Conventions

- **All user-facing copy is French**, and dates are formatted with `fr-FR` locale.
- **Dates are stored as UTC midnight.** `AddBooking` converts the picker's local `Date` through
  `Date.UTC(y, m, d)` before inserting, and the email handler formats with `timeZone: 'UTC'`.
  Preserve this when touching date handling or off-by-one-day bugs appear. Occupancy sidesteps the
  problem by keying on civil dates (`YYYY-MM-DD`) rather than instants; anything reading a stored
  column back for display must format it with `timeZone: 'UTC'` or it slips a day.
- `status` is the string `'CONFIRMED'` or `'PENDING'` (displayed as "Confirmée" / "Provisoire").
- `createBooking` does not send `booker`; that column is populated server-side by Supabase and
  read back in [BookingCard.jsx](src/components/BookingCard.jsx) via `getProfileWithId`.
- **Chakra UI v3** is the primary styling layer, using compound components (`Card.Root`,
  `Menu.Root`, `Tabs.Root`, `Select.Root`). Tailwind 4 is installed and imported in
  [index.css](src/index.css) but barely used — prefer Chakra props. A Chakra UI MCP server is
  configured in [.vscode/mcp.json](.vscode/mcp.json) for v3 API questions.
- The `brand` color palette and its semantic tokens live in [theme.js](src/theme.js). Dark mode is
  next-themes with `attribute="class"`; use `_dark={{...}}` or `useColorModeValue`.
- Toasts: `toaster.create({...})` from [toaster.jsx](src/components/ui/toaster.jsx). The
  `<Toaster />` component must be rendered somewhere in the view for toasts to appear.
- `src/components/ui/` holds generated Chakra snippet wrappers — treat as vendored, prefer adding
  new custom components under `src/components/Custom/`.

## TypeScript caveat

The project is mixed JS/TS but has **no `tsconfig.json`**, so `.ts`/`.tsx` files are only
transpiled by Vite's esbuild — types are never checked. `client.ts` casts `import.meta as any` for
this reason. ESLint is also scoped to `**/*.{js,jsx}` only, meaning
[DateRangePicker.tsx](src/components/Custom/DateRangePicker.tsx) and `src/supabase/*.ts` are
unlinted and untyped-checked. Do not assume a type error would have been caught.

## Deployment

Vercel. [vercel.json](vercel.json) rewrites everything to `/index.html` for SPA routing; `api/`
files become serverless functions.

## Agent skills

### Issue tracker

Issues live in GitHub Issues on `AlexisAmadei/thibaudiere-booking-app`, via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical labels, unchanged: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
