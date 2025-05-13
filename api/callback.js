export default async function handler(req, res) {
  const code = req.query.code;
  if (!code) {
    console.error('Missing code in callback request');
    return res.status(400).json({ error: 'Missing code' });
  }

  const params = new URLSearchParams();
  params.append('client_id', process.env.DISCORD_CLIENT_ID);
  params.append('client_secret', process.env.DISCORD_CLIENT_SECRET);
  params.append('grant_type', 'authorization_code');
  params.append('code', code);
  params.append('redirect_uri', process.env.DISCORD_REDIRECT_URI);
  params.append('scope', 'identify guilds.members.read');

  try {
    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    });

    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      console.error('Invalid token exchange:', tokenData);
      return res.status(400).json({ error: 'Invalid token exchange' });
    }

    const userRes = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });

    const userData = await userRes.json();

    if (!userData.id || !userData.username) {
      console.error('Failed to fetch user data:', userData);
      return res.status(400).json({ error: 'Invalid user data from Discord' });
    }

    const redirectURL = new URL('https://succinct-feedback-dapp.vercel.app');
    redirectURL.searchParams.set('discord_id', userData.id);
    redirectURL.searchParams.set('username', userData.username);
    redirectURL.searchParams.set('avatar_url', `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`);

    console.log('✅ Redirecting with params:', redirectURL.toString());

    return res.redirect(302, redirectURL.toString());
  } catch (err) {
    console.error('Callback error:', err);
    return res.status(500).json({ error: 'Internal error during Discord login' });
  }
}
