import { createClient } from '@supabase/supabase-js';
import { MailtrapClient } from 'mailtrap';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email requis' });
  }

  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: {
      redirectTo: `${process.env.APP_URL}/reset-password`,
    },
  });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  const mailtrap = new MailtrapClient({ token: process.env.MAILTRAP_TOKEN });

  await mailtrap.send({
    from: { email: 'hello@la-thibaudiere.fr', name: 'La Thibaudière' },
    to: [{ email }],
    subject: 'Réinitialisation de votre mot de passe',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #2d6a4f;">Réinitialisation de mot de passe</h2>
        <p>Vous avez demandé la réinitialisation de votre mot de passe pour votre compte La Thibaudière.</p>
        <p>Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe :</p>
        <p style="text-align: center; margin: 32px 0;">
          <a href="${data.properties.action_link}"
             style="background:#2d6a4f;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block;">
            Réinitialiser mon mot de passe
          </a>
        </p>
        <p style="color:#666;font-size:14px;">
          Ce lien expirera dans 1 heure.<br>
          Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
        </p>
      </div>
    `,
    text: `Réinitialisation de mot de passe\n\nCliquez sur ce lien pour réinitialiser votre mot de passe :\n${data.properties.action_link}\n\nCe lien expirera dans 1 heure.`,
    category: 'Password Reset',
  });

  return res.status(200).json({ success: true });
}
