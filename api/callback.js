// api/callback.js
const fetch = require('node-fetch');

const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const REDIRECT_URI = process.env.DISCORD_REDIRECT_URI; // Esta será la URL de Vercel
const FRONTEND_URL = process.env.FRONTEND_URL; // La URL de tu frontend en Vercel (ej: https://succinct-feedback-dapp.vercel.app)

module.exports = async (req, res) => {
  const code = req.query.code;
  if (!code) {
    return res.status(400).send('No se proporcionó código de autorización.');
  }

  const params = new URLSearchParams();
  params.append('client_id', CLIENT_ID);
  params.append('client_secret', CLIENT_SECRET);
  params.append('grant_type', 'authorization_code');
  params.append('code', code);
  params.append('redirect_uri', REDIRECT_URI);
  params.append('scope', 'identify guilds guilds.members.read');

  try {
    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      body: params,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    const tokenData = await tokenRes.json();
    if (tokenData.error) {
        console.error('Error obteniendo token de Discord:', tokenData.error_description || tokenData.error);
        return res.status(400).send(`Error autenticando: ${tokenData.error_description || tokenData.error}`);
    }

    const userRes = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const userData = await userRes.json();
    if (userData.message === '401: Unauthorized') {
        console.error('Error obteniendo datos de usuario de Discord: No autorizado');
        return res.status(401).send('Error: No autorizado por Discord.');
    }

    res.redirect(FRONTEND_URL || 'https://succinct-feedback-dapp.vercel.app');

  } catch (error) {
    console.error('❌ Error en /api/callback (Vercel):', error);
    res.status(500).send('Error al autenticar con Discord');
  }
};
