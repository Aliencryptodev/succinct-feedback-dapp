  export default async function handler(req, res) {
  const code = req.query.code;

  if (!code) {
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
    // Step 1: Exchange code for access_token
    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    });

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      return res.status(400).json({ error: 'Invalid access token exchange' });
    }

    // Step 2: Fetch user info
    const userRes = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const userData = await userRes.json();

    const discord_id = userData.id;
    const username = userData.username;
    const avatar_url = `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`;

    // Step 3: Redirect to frontend with user info in query params
    const redirectURL = new URL('/', process.env.DISCORD_REDIRECT_URI);
    redirectURL.searchParams.set('discord_id', discord_id);
    redirectURL.searchParams.set('username', username);
    redirectURL.searchParams.set('avatar_url', avatar_url);

    return res.redirect(302, redirectURL.toString());
  } catch (err) {
    console.error('OAuth callback error:', err);
    return res.status(500).json({ error: 'Internal error during Discord login' });
  }
}
