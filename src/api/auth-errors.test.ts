import assert from 'node:assert/strict'
import { test } from 'node:test'
import { authErrorMessage } from './auth-errors.ts'

// The errors are shaped as the Better Auth client returns them: `{ code, message, status }`,
// with an English message, or no code at all from the rate limiter.

test('a wrong email or password is explained in French', () => {
  const error = { code: 'INVALID_EMAIL_OR_PASSWORD', message: 'Invalid email or password', status: 401 }
  assert.equal(authErrorMessage(error), 'Email ou mot de passe incorrect.')
})

test('an expired or already used link says so', () => {
  const error = { code: 'INVALID_TOKEN', message: 'Invalid token', status: 400 }
  assert.equal(authErrorMessage(error), 'Ce lien est invalide ou a expiré. Demandez-en un nouveau.')
})

test('a wrong current password, when changing it, is explained in French', () => {
  const error = { code: 'INVALID_PASSWORD', message: 'Invalid password', status: 400 }
  assert.equal(authErrorMessage(error), 'Le mot de passe actuel est incorrect.')
})

test('too many attempts asks the member to wait', () => {
  const error = { message: 'Too many requests. Please try again later.', status: 429 }
  assert.equal(authErrorMessage(error), 'Trop de tentatives. Veuillez patienter quelques instants avant de réessayer.')
})

test('anything else is never shown in English', () => {
  const error = { code: 'FAILED_TO_CREATE_SESSION', message: 'Failed to create session', status: 500 }
  assert.equal(authErrorMessage(error), 'Une erreur est survenue. Veuillez réessayer.')
})

// The forms check the 6-character minimum but not bcrypt's 72-character maximum.
test('a password longer than bcrypt allows is explained in French', () => {
  const error = { code: 'PASSWORD_TOO_LONG', message: 'Password too long', status: 400 }
  assert.equal(authErrorMessage(error), 'Le mot de passe doit contenir au plus 72 caractères.')
})
