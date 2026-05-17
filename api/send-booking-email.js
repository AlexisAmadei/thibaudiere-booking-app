import { Resend } from 'resend';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

const STATUS_LABELS = {
  CONFIRMED: { label: 'Confirmée', color: '#2d6a4f', bg: '#d8f3dc' },
  PENDING: { label: 'Provisoire', color: '#b45309', bg: '#fef9c3' },
};

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { title, start_date, end_date, status } = req.body;

  if (!title || !start_date || !end_date || !status) {
    return res.status(400).json({ error: 'Champs manquants' });
  }

  const appUrl = process.env.APP_URL;
  const { label, color, bg } = STATUS_LABELS[status] ?? { label: status, color: '#374151', bg: '#f3f4f6' };

  const resend = new Resend(process.env.RESEND_API_KEY);

  const { error: emailError } = await resend.emails.send({
    from: 'La Thibaudière <la-thibaudiere.fr@kiwidev.fr>',
    to: [ADMIN_EMAIL],
    subject: `Nouvelle réservation : ${title}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#111;">
        <h2 style="color:#2d6a4f;margin-top:0;">Nouvelle réservation</h2>

        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
          <tr>
            <td style="padding:8px 0;color:#6b7280;width:40%;">Titre</td>
            <td style="padding:8px 0;font-weight:600;">${title}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#6b7280;">Arrivée</td>
            <td style="padding:8px 0;">${formatDate(start_date)}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#6b7280;">Départ</td>
            <td style="padding:8px 0;">${formatDate(end_date)}</td>
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
    text: `Nouvelle réservation\n\nTitre : ${title}\nArrivée : ${formatDate(start_date)}\nDépart : ${formatDate(end_date)}\nStatut : ${label}\n\nVoir les réservations : ${appUrl}`,
  });

  if (emailError) {
    return res.status(500).json({ error: emailError.message });
  }

  return res.status(200).json({ success: true });
}
