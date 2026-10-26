import { createAuthClient } from 'better-auth/react';
import { authErrorMessage, type AuthError } from './auth-errors.ts';

/**
 * Better Auth's client, on the server's `/api/auth` (its default path, same origin). The
 * session is an httpOnly cookie, so the SPA never holds a token; `useSession` reads it.
 */
export const authClient = createAuthClient({
  // Looked up on each call rather than captured once, so tests can stand in for the browser.
  fetchOptions: { customFetchImpl: (input, init) => fetch(input, init) },
});

/** Rejects with the French explanation when Better Auth refused the call. */
async function settled<T>(call: Promise<{ data: T; error: AuthError | null }>): Promise<T> {
  const { data, error } = await call;
  if (error) throw new Error(authErrorMessage(error));
  return data;
}

export async function signIn(email: string, password: string) {
  return settled(authClient.signIn.email({ email, password }));
}

export async function signOut() {
  await settled(authClient.signOut());
}

/**
 * Emails a link to `/reset-password?token=…`: an invitation instead, to a member who has never
 * chosen a password. Succeeds whether or not the address belongs to a member.
 */
export async function requestPasswordReset(email: string) {
  await settled(authClient.requestPasswordReset({ email }));
}

/** Sets a new password with the `token` from an emailed link, which then stops working. */
export async function resetPassword(token: string, newPassword: string) {
  await settled(authClient.resetPassword({ token, newPassword }));
}

/**
 * Changes the signed-in member's password, which Better Auth only does given the current
 * one. Other sessions stay signed in.
 */
export async function changePassword(currentPassword: string, newPassword: string) {
  await settled(authClient.changePassword({ currentPassword, newPassword }));
}
