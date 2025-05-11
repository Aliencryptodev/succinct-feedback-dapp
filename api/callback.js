export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const code = req.query.code;
  if (!code) return res.status(400).send('Missing code');

  const client_id = process.env.DISCORD_CLIENT_ID;
  const client_secret = process.env.DISCORD_CLIENT_SECRET;
  const redirect_uri = process.env.DISCORD_REDIRECT_URI;

  try {
    // Step 1: Exchange code for token
    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id,
        client_secret,
        grant_type: 'authorization_code',
        code,
        redirect_uri,
      })
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) throw new Error(tokenData.error || 'Token exchange failed');

    const access_token = tokenData.access_token;

    // Step 2: Fetch user info from Discord
    const userRes = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    const user = await userRes.json();
    if (!userRes.ok) throw new Error('User fetch failed');

    // Step 3: Redirect to frontend and save data
    const username = user.username;
    const userId = user.id;

    // Use avatar URL format from Discord CDN
    const avatar = user.avatar
      ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
      : 'https://cdn.discordapp.com/embed/avatars/0.png';

    // Build redirect URL to your frontend, passing data as query
    const frontendURL = `https://your-frontend.vercel.app/?discord_id=${userId}&username=${username}&avatar=${encodeURIComponent(avatar)}`;

    return res.redirect(frontendURL);

  } catch (err) {
    console.error('OAuth callback error:', err);
    return res.status(500).send('OAuth failed');
  }
}
