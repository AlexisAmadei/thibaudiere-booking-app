/** An error as the Better Auth client returns it. `message` is English and never shown. */
export interface AuthError {
  code?: string;
  message?: string;
  status: number;
}

const MESSAGES: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: 'Email ou mot de passe incorrect.',
  INVALID_TOKEN: 'Ce lien est invalide ou a expiré. Demandez-en un nouveau.',
  INVALID_PASSWORD: 'Le mot de passe actuel est incorrect.',
  PASSWORD_TOO_LONG: 'Le mot de passe doit contenir au plus 72 caractères.',
};

/** What to tell a member about a failed sign-in, password reset or password change, in French. */
export function authErrorMessage(error: AuthError): string {
  if (error.code && error.code in MESSAGES) return MESSAGES[error.code];
  // The rate limiter answers with a message but no code.
  if (error.status === 429) return 'Trop de tentatives. Veuillez patienter quelques instants avant de réessayer.';
  return 'Une erreur est survenue. Veuillez réessayer.';
}
