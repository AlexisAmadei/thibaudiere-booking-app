import bcrypt from 'bcryptjs'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { and, eq, isNotNull } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import type { Db } from './db/index.ts'
import { account, user } from './db/schema.ts'
import { invitationEmail, passwordResetEmail, sendEmail as sendEmailViaResend, type SendEmail } from './email.ts'

// How long an invitation or password-reset link stays valid. The email copy says "une heure".
const RESET_LINK_LIFETIME_SECONDS = 60 * 60

// Bcrypt at cost 10 with the `$2a$` prefix, exactly like the hashes imported from Supabase,
// so every password in the database has one format and one verification path (ADR 0001).
// bcryptjs defaults to `$2b$`, which computes the same hash.
export async function hashPassword(password: string) {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt.replace(/^\$2b\$/, '$2a$'))
}

type AuthOptions = {
  // Public URL of the app: Better Auth's base URL, its only trusted origin, and where the
  // links in emails point. Defaults to APP_URL, or to the Vite dev server outside production.
  appUrl?: string
  // Signs session cookies. Better Auth reads BETTER_AUTH_SECRET itself when this is omitted,
  // and refuses to start in production without one.
  secret?: string
  sendEmail?: SendEmail
}

// Regenerate the schema after changing anything here that adds tables or fields:
// `bun run db:auth-schema && bun run db:generate`.
export function createAuth(db: Db, { appUrl = defaultAppUrl(), secret, sendEmail = sendEmailViaResend }: AuthOptions = {}) {
  return betterAuth({
    baseURL: appUrl,
    trustedOrigins: [appUrl],
    secret,
    database: drizzleAdapter(db, { provider: 'sqlite' }),
    emailAndPassword: {
      enabled: true,
      // Members join only by invitation (`bun run invite`), never on their own.
      disableSignUp: true,
      // Supabase's minimum, which the SPA's forms still enforce.
      minPasswordLength: 6,
      // Bcrypt reads only the first 72 bytes, and Supabase refused longer passwords too.
      maxPasswordLength: 72,
      password: {
        hash: hashPassword,
        verify: ({ hash, password }) => bcrypt.compare(password, hash),
      },
      resetPasswordTokenExpiresIn: RESET_LINK_LIFETIME_SECONDS,
      // Also how invitations are delivered: a member who has never chosen a password gets
      // the invitation email instead, whether `bun run invite` or "Mot de passe oublié ?" asked.
      sendResetPassword: async ({ user, token }) => {
        const invited = !hasPassword(db, user.id)
        const link = new URL('/reset-password', appUrl)
        link.searchParams.set('token', token)
        // Lets the page greet a new member rather than ask for a "new" password.
        if (invited) link.searchParams.set('type', 'invite')
        await sendEmail({ to: user.email, ...(invited ? invitationEmail(link.href) : passwordResetEmail(link.href)) })
      },
    },
    // On in every environment (Better Auth enables it only in production by default). In
    // memory, which is why the app runs as a single replica (ADR 0001). Keyed by the client
    // address in a single-valued X-Forwarded-For, which Dokploy's Traefik sets.
    rateLimit: { enabled: true, storage: 'memory' },
  })
}

export type Auth = ReturnType<typeof createAuth>

// `bun run invite <email>`: makes `email` a member with no password and sends the invitation,
// whose link is where they choose one. Inviting again before they accept sends a fresh link,
// so a lost, expired or unsent invitation is fixed by running the command again. Returns the
// address as stored.
export async function inviteMember(db: Db, email: string, options: AuthOptions = {}) {
  email = email.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+$/.test(email)) throw new Error(`Not an email address: ${email}`)

  const existing = db.select({ id: user.id }).from(user).where(eq(user.email, email)).get()
  if (existing && hasPassword(db, existing.id)) throw new Error(`${email} is already a member`)
  // A UUID like the ids imported from Supabase. No display name yet: the SPA asks for one.
  if (!existing) db.insert(user).values({ id: randomUUID(), name: '', email }).run()

  // Better Auth logs and swallows a failed send, which suits "Mot de passe oublié ?" (the
  // answer must not depend on the address) but would report an invitation that never left.
  const send = options.sendEmail ?? sendEmailViaResend
  let failure: unknown
  const sendEmail: SendEmail = async (invitation) => {
    try {
      await send(invitation)
    } catch (error) {
      failure = error
    }
  }
  // Sends the invitation rather than a reset, since the member has no password (see above).
  await createAuth(db, { ...options, sendEmail }).api.requestPasswordReset({ body: { email } })
  if (failure !== undefined) throw failure
  return email
}

export function defaultAppUrl() {
  if (process.env.APP_URL) return process.env.APP_URL
  if (process.env.NODE_ENV === 'production') throw new Error('APP_URL is not set')
  // Vite, which proxies `/api` to this server in dev.
  return 'http://localhost:5173'
}

function hasPassword(db: Db, userId: string) {
  const credential = db
    .select({ id: account.id })
    .from(account)
    .where(and(eq(account.userId, userId), eq(account.providerId, 'credential'), isNotNull(account.password)))
    .get()
  return credential !== undefined
}
