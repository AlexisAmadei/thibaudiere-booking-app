import { asc, eq, gte, sql } from 'drizzle-orm'
import { Hono, type Context } from 'hono'
import { csrf } from 'hono/csrf'
import { defaultAppUrl, type Auth } from './auth.ts'
import type { Db } from './db/index.ts'
import { BOOKING_STATUSES, bookings, user } from './db/schema.ts'
import { bookingNotificationEmail, sendEmail as sendEmailViaResend, type SendEmail } from './email.ts'

type ApiOptions = {
  // Where the booking notification's button points. Defaults as in `createAuth`.
  appUrl?: string
  // Receives the booking notification. Defaults to ADMIN_EMAIL.
  adminEmail?: string
  sendEmail?: SendEmail
}

type Member = { id: string; name: string; email: string }
type Env = { Variables: { member: Member } }

// A booking as the API returns it: the columns under their Supabase names, which the SPA
// already reads, and the booker's display name joined in. A booker who has not chosen a
// display name yet is shown by the part of their email before the `@`, as BookingCard did
// under Supabase; the address itself never leaves the server. Null once the booker is deleted.
const BOOKING_COLUMNS = {
  id: bookings.id,
  title: bookings.title,
  start_date: bookings.startDate,
  end_date: bookings.endDate,
  status: bookings.status,
  created_at: bookings.createdAt,
  booker: bookings.booker,
  booker_name: sql<string | null>`coalesce(nullif(${user.name}, ''), substr(${user.email}, 1, instr(${user.email}, '@') - 1))`,
}

// The bookings and member API. Authorization lived in Supabase's RLS policies; the database
// no longer enforces anything, so each route carries its rule (ADR 0001).
export function createApi(
  db: Db,
  auth: Auth,
  { appUrl = defaultAppUrl(), adminEmail = process.env.ADMIN_EMAIL, sendEmail = sendEmailViaResend }: ApiOptions = {},
) {
  const api = new Hono<Env>()

  // `/bookings/*` matches `/bookings` itself too.
  for (const path of ['/bookings/*', '/me']) {
    // The session is now a cookie, which a browser attaches to a form posted from any site
    // (Supabase's token never left the SPA), so changes must come from the app's own origin.
    api.use(path, csrf({ origin: appUrl }))
    // Every route is for signed-in members only, as every policy was `TO authenticated`.
    api.use(path, async (c, next) => {
      const session = await auth.api.getSession({ headers: c.req.raw.headers })
      if (!session) return c.json({ error: 'Vous devez être connecté.' }, 401)
      c.set('member', session.user)
      await next()
    })
  }

  const selectBookings = () => db.select(BOOKING_COLUMNS).from(bookings).leftJoin(user, eq(bookings.booker, user.id))
  const bookingById = (id: number) => selectBookings().where(eq(bookings.id, id)).get()

  // Bookings that have not finished by `from`, so stays in progress are included. `from` is
  // the browser's today: the server's could be a day off.
  api.get('/bookings', (c) => {
    const from = c.req.query('from')
    if (!isCivilDate(from)) return c.json({ error: 'Paramètre invalide : from (AAAA-MM-JJ attendu).' }, 400)
    return c.json(selectBookings().where(gte(bookings.endDate, from)).orderBy(asc(bookings.startDate)).all())
  })

  // The booker is the signed-in member, never the request's (RLS: `booker = auth.uid()`).
  api.post('/bookings', async (c) => {
    const read = readFields(await jsonObject(c), ALL_FIELDS, { partial: false })
    if ('error' in read) return c.json({ error: read.error }, 400)
    const { id } = db
      .insert(bookings)
      .values({ ...toColumns(read.fields), booker: c.get('member').id })
      .returning({ id: bookings.id })
      .get()
    const booking = bookingById(id)
    // Deliberately not awaited: the booking is made whatever happens to the email.
    void notifyAdmin(read.fields as BookingFields).catch((error) => console.error('Booking notification not sent:', error))
    return c.json(booking, 201)
  })

  // Booker only, and `booker` itself cannot change (RLS: `booker = auth.uid()` in both
  // USING and WITH CHECK). A booking whose booker was deleted can no longer be edited.
  api.patch('/bookings/:id{[0-9]+}', async (c) => {
    const id = Number(c.req.param('id'))
    const booking = bookingById(id)
    if (!booking) return c.json({ error: 'Réservation introuvable.' }, 404)
    if (booking.booker !== c.get('member').id) {
      return c.json({ error: 'Seul le membre qui a fait la réservation peut la modifier.' }, 403)
    }
    const read = readFields(await jsonObject(c), ALL_FIELDS, { partial: true })
    if ('error' in read) return c.json({ error: read.error }, 400)
    if (Object.keys(read.fields).length) db.update(bookings).set(toColumns(read.fields)).where(eq(bookings.id, id)).run()
    return c.json(bookingById(id))
  })

  // Any member, touching nothing but `status`: what the `set_booking_status` definer RPC did,
  // since RLS couldn't scope a policy to one column.
  api.post('/bookings/:id{[0-9]+}/status', async (c) => {
    const id = Number(c.req.param('id'))
    if (!bookingById(id)) return c.json({ error: 'Réservation introuvable.' }, 404)
    const read = readFields(await jsonObject(c), ['status'], { partial: false })
    if ('error' in read) return c.json({ error: read.error }, 400)
    db.update(bookings).set({ status: read.fields.status }).where(eq(bookings.id, id)).run()
    return c.json(bookingById(id))
  })

  // Any member, as the `USING (true)` policy allowed; restricting it is #20, out of scope for
  // the migration. Like Supabase, deleting a booking that is already gone succeeds.
  api.delete('/bookings/:id{[0-9]+}', (c) => {
    db.delete(bookings).where(eq(bookings.id, Number(c.req.param('id')))).run()
    return c.body(null, 204)
  })

  // The signed-in member's own email and display name. Under RLS any member could read every
  // member's, but the SPA only reads its own; other display names come joined into the bookings.
  const memberById = (id: string) => db.select({ id: user.id, email: user.email, name: user.name }).from(user).where(eq(user.id, id)).get()

  api.get('/me', (c) => c.json(memberById(c.get('member').id)))

  // Own display name only (RLS: `auth.uid() = id`), and nothing else about the member.
  api.patch('/me', async (c) => {
    const body = await jsonObject(c)
    if (!body || Object.keys(body).join() !== 'name' || typeof body.name !== 'string') {
      return c.json({ error: 'Requête invalide : seul le nom affiché (name) peut être modifié.' }, 400)
    }
    const { id } = c.get('member')
    db.update(user).set({ name: body.name }).where(eq(user.id, id)).run()
    return c.json(memberById(id))
  })

  async function notifyAdmin(booking: BookingFields) {
    if (!adminEmail) throw new Error('ADMIN_EMAIL is not set')
    await sendEmail({ to: adminEmail, ...bookingNotificationEmail(booking, appUrl) })
  }

  return api
}

type BookingFields = { title: string; start_date: string; end_date: string; status: (typeof BOOKING_STATUSES)[number] }

const FIELD_CHECKS: { [K in keyof BookingFields]: (value: unknown) => value is BookingFields[K] } = {
  title: (value) => typeof value === 'string',
  start_date: isCivilDate,
  end_date: isCivilDate,
  status: (value): value is BookingFields['status'] => BOOKING_STATUSES.includes(value as BookingFields['status']),
}

const ALL_FIELDS = Object.keys(FIELD_CHECKS) as (keyof BookingFields)[]

// The fields named by `keys` in a request body, all of them unless `partial`. Any other key,
// `booker` included, is refused rather than ignored.
function readFields(
  body: Record<string, unknown> | undefined,
  keys: (keyof BookingFields)[],
  { partial }: { partial: boolean },
): { fields: Partial<BookingFields> } | { error: string } {
  if (!body) return { error: 'Requête invalide : objet JSON attendu.' }
  for (const key of Object.keys(body)) {
    if (!keys.includes(key as keyof BookingFields)) return { error: `Champ non modifiable : ${key}.` }
  }
  const fields: Partial<BookingFields> = {}
  for (const key of keys) {
    const value = body[key]
    if (value === undefined) {
      if (!partial) return { error: `Champ manquant : ${key}.` }
    } else if (!FIELD_CHECKS[key](value)) {
      return { error: `Champ invalide : ${key}.` }
    } else {
      Object.assign(fields, { [key]: value })
    }
  }
  return { fields }
}

// The request body when it is a JSON object, undefined for anything else.
async function jsonObject(c: Context): Promise<Record<string, unknown> | undefined> {
  const body: unknown = await c.req.json().catch(() => undefined)
  return typeof body === 'object' && body !== null && !Array.isArray(body) ? (body as Record<string, unknown>) : undefined
}

function toColumns(fields: Partial<BookingFields>) {
  return { title: fields.title, startDate: fields.start_date, endDate: fields.end_date, status: fields.status }
}

// A real calendar day written `YYYY-MM-DD`, as the date columns hold (see "Calendar day" in CONTEXT.md).
function isCivilDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value)
}
