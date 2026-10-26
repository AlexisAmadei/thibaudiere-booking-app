/**
 * A same-origin call to the server's `/api`, which the session cookie authenticates.
 *
 * Resolves to the response's JSON (undefined for an empty body) and rejects with an `Error`
 * carrying the server's French reason, so callers can show `error.message` as it is.
 */
export async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const init: RequestInit = { method };
  if (body !== undefined) {
    init.headers = { 'Content-Type': 'application/json' };
    init.body = JSON.stringify(body);
  }

  const res = await fetch(`/api${path}`, init);

  if (!res.ok) {
    // Not every failure is the server's own JSON: a proxy in front of it answers in HTML.
    const reason = await res.json().then((data) => (data as { error?: string } | null)?.error, () => undefined);
    throw new Error(reason ?? `La requête a échoué (${res.status}). Veuillez réessayer.`);
  }

  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}
