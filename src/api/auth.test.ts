import assert from 'node:assert/strict'
import { test, type TestContext } from 'node:test'
import { createApp } from '../../server/app.ts'
import { createAuth } from '../../server/auth.ts'
import type { Email } from '../../server/email.ts'
import { addMember, APP_URL, browserFetch, freshDatabase, SECRET, SUPABASE_HASH, SUPABASE_PASSWORD } from '../../server/test-support.ts'
import { changePassword, requestPasswordReset, resetPassword, signIn, signOut } from './auth.ts'

// The SPA's sign-in, sign-out and password calls against the real server, in one member's tab.

function setup(t: TestContext) {
  const db = freshDatabase()
  const emails: Email[] = []
  const sendEmail = async (email: Email) => void emails.push(email)
  const app = createApp({ auth: createAuth(db, { appUrl: APP_URL, secret: SECRET, sendEmail }) })
  addMember(db, 'camille@example.test', SUPABASE_HASH)
  const fetch = browserFetch(app)
  t.mock.method(globalThis, 'fetch', fetch)
  return { fetch, emails }
}

// The `?token=` of the link in an emailed invitation or reset, as /reset-password reads it.
function tokenIn(email: Email) {
  const link = /href="([^"]+)"/.exec(email.html)?.[1] ?? ''
  return new URL(link).searchParams.get('token') ?? ''
}

test('a member signs in with their password', async (t) => {
  const { fetch } = setup(t)
  await signIn('camille@example.test', SUPABASE_PASSWORD)
  const session = (await (await fetch('/api/auth/get-session')).json()) as { user: { email: string } } | null
  assert.equal(session?.user.email, 'camille@example.test')
})

test('a wrong password is refused in French', async (t) => {
  setup(t)
  await assert.rejects(signIn('camille@example.test', 'pas-le-bon'), { message: 'Email ou mot de passe incorrect.' })
})

test('signing out ends the session on the server', async (t) => {
  const { fetch } = setup(t)
  await signIn('camille@example.test', SUPABASE_PASSWORD)
  await signOut()
  assert.equal(await (await fetch('/api/auth/get-session')).json(), null)
})

test('a member who forgot their password chooses a new one from the emailed link', async (t) => {
  const { emails } = setup(t)
  await requestPasswordReset('camille@example.test')
  assert.equal(emails.length, 1)

  await resetPassword(tokenIn(emails[0]), 'nouveau-mot-de-passe')
  await signIn('camille@example.test', 'nouveau-mot-de-passe')
})

test('a link already used, or made up, is refused in French', async (t) => {
  const { emails } = setup(t)
  await requestPasswordReset('camille@example.test')
  const token = tokenIn(emails[0])
  await resetPassword(token, 'nouveau-mot-de-passe')

  const refused = { message: 'Ce lien est invalide ou a expiré. Demandez-en un nouveau.' }
  await assert.rejects(resetPassword(token, 'encore-un-autre'), refused)
  await assert.rejects(resetPassword('', 'encore-un-autre'), refused)
})

test('a signed-in member changes their password by giving the current one', async (t) => {
  setup(t)
  await signIn('camille@example.test', SUPABASE_PASSWORD)

  await assert.rejects(changePassword('pas-le-bon', 'nouveau-mot-de-passe'), { message: 'Le mot de passe actuel est incorrect.' })
  await changePassword(SUPABASE_PASSWORD, 'nouveau-mot-de-passe')
  await signOut()
  await signIn('camille@example.test', 'nouveau-mot-de-passe')
})
