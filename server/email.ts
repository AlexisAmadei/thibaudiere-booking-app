import { Resend } from 'resend'

export type Email = { to: string; subject: string; html: string; text: string }
export type SendEmail = (email: Email) => Promise<void>

const FROM = 'La Thibaudière <la-thibaudiere.fr@kiwidev.fr>'

// Sends through Resend when RESEND_API_KEY is set. Without it, outside production, the
// email is printed instead, so invitations and resets can be followed locally.
export const sendEmail: SendEmail = async (email) => {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    if (process.env.NODE_ENV === 'production') throw new Error('RESEND_API_KEY is not set')
    console.log(`[email] To: ${email.to}\n[email] Subject: ${email.subject}\n\n${email.text}\n`)
    return
  }
  const { error } = await new Resend(apiKey).emails.send({ from: FROM, ...email })
  if (error) throw new Error(`Resend refused the email to ${email.to}: ${error.message}`)
}

// Both links open the SPA's /reset-password, which posts the token and the chosen password
// to Better Auth. They expire after RESET_LINK_LIFETIME_SECONDS (see `auth.ts`).
export function invitationEmail(link: string): Omit<Email, 'to'> {
  return {
    subject: 'Invitation à La Thibaudière',
    html: layout({
      heading: 'Bienvenue à La Thibaudière',
      body: 'Vous êtes invité à rejoindre le calendrier de réservation de La Thibaudière. Choisissez votre mot de passe pour activer votre compte.',
      button: 'Choisir mon mot de passe',
      link,
      note: 'Ce lien expire dans une heure. Passé ce délai, utilisez « Mot de passe oublié ? » avec cette adresse pour en recevoir un nouveau.',
    }),
    text: `Bienvenue à La Thibaudière\n\nVous êtes invité à rejoindre le calendrier de réservation de La Thibaudière. Choisissez votre mot de passe pour activer votre compte :\n${link}\n\nCe lien expire dans une heure. Passé ce délai, utilisez « Mot de passe oublié ? » avec cette adresse pour en recevoir un nouveau.`,
  }
}

export function passwordResetEmail(link: string): Omit<Email, 'to'> {
  return {
    subject: 'Réinitialisation de votre mot de passe',
    html: layout({
      heading: 'Réinitialiser votre mot de passe',
      body: 'Vous avez demandé à réinitialiser le mot de passe de votre compte La Thibaudière.',
      button: 'Choisir un nouveau mot de passe',
      link,
      note: "Ce lien expire dans une heure. Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail : votre mot de passe reste inchangé.",
    }),
    text: `Réinitialiser votre mot de passe\n\nVous avez demandé à réinitialiser le mot de passe de votre compte La Thibaudière. Choisissez un nouveau mot de passe :\n${link}\n\nCe lien expire dans une heure. Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail : votre mot de passe reste inchangé.`,
  }
}

const STATUS_LABELS = {
  CONFIRMED: { label: 'Confirmée', color: '#2d6a4f', bg: '#d8f3dc' },
  PENDING: { label: 'Provisoire', color: '#b45309', bg: '#fef9c3' },
}

// Sent to ADMIN_EMAIL for every new booking. The email the Vercel function sent
// (`api/send-booking-email.js`, now removed), with the title escaped in the HTML.
export function bookingNotificationEmail(
  booking: { title: string; start_date: string; end_date: string; status: keyof typeof STATUS_LABELS },
  appUrl: string,
): Omit<Email, 'to'> {
  const { title, status } = booking
  const { label, color, bg } = STATUS_LABELS[status]
  const arrival = formatDay(booking.start_date)
  const departure = formatDay(booking.end_date)
  return {
    subject: `Nouvelle réservation : ${title}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#111;">
        <h2 style="color:#2d6a4f;margin-top:0;">Nouvelle réservation</h2>

        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
          <tr>
            <td style="padding:8px 0;color:#6b7280;width:40%;">Titre</td>
            <td style="padding:8px 0;font-weight:600;">${escapeHtml(title)}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#6b7280;">Arrivée</td>
            <td style="padding:8px 0;">${arrival}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#6b7280;">Départ</td>
            <td style="padding:8px 0;">${departure}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#6b7280;">Statut</td>
            <td style="padding:8px 0;">
              <span style="background:${bg};color:${color};padding:2px 10px;border-radius:999px;font-size:13px;font-weight:600;">
                ${label}
              </span>
            </td>
          </tr>
        </table>

        <p style="text-align:center;margin:32px 0;">
          <a href="${appUrl}"
             style="background:#2d6a4f;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block;">
            Voir les réservations
          </a>
        </p>

        <p style="color:#9ca3af;font-size:12px;text-align:center;">
          La Thibaudière &mdash; notification automatique
        </p>
      </div>
    `,
    text: `Nouvelle réservation\n\nTitre : ${title}\nArrivée : ${arrival}\nDépart : ${departure}\nStatut : ${label}\n\nVoir les réservations : ${appUrl}`,
  }
}

// A civil date (`YYYY-MM-DD`) in French, e.g. "jeudi 24 décembre 2026". Read at UTC midnight
// and formatted in UTC, so the server's timezone cannot shift the day.
function formatDay(day: string) {
  return new Date(`${day}T00:00:00Z`).toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

const HTML_ENTITIES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => HTML_ENTITIES[c])
}

// The look of the booking notification: one column, green heading and button, grey footer.
function layout({ heading, body, button, link, note }: { heading: string; body: string; button: string; link: string; note: string }) {
  return `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#111;">
      <h2 style="color:#2d6a4f;margin-top:0;">${heading}</h2>

      <p style="line-height:1.5;">${body}</p>

      <p style="text-align:center;margin:32px 0;">
        <a href="${link}"
           style="background:#2d6a4f;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block;">
          ${button}
        </a>
      </p>

      <p style="color:#6b7280;font-size:13px;line-height:1.5;">${note}</p>

      <p style="color:#9ca3af;font-size:12px;text-align:center;">
        La Thibaudière &mdash; message automatique
      </p>
    </div>
  `
}
