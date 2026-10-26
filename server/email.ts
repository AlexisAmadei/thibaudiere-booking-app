import { Resend } from 'resend'

export type Email = { to: string; subject: string; html: string; text: string }
export type SendEmail = (email: Email) => Promise<void>

// Same sender as the booking notification (`api/send-booking-email.js`).
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
