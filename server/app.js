const express = require('express');
const session = require('express-session');
const fetch = require('node-fetch');
const crypto = require('crypto');
const fs = require('fs');
const { ensureUserVotes, updateUserVotes } = require('./votes');
const app = express();
require('dotenv').config();

const DATA_FILE = 'ideas.json';
const DISCORD_API = 'https://152.53.243.39.sslip.io/api/discord';
const VOTE_ROLE = 'Proof Verified';
const COMMENT_ROLE = "lets pruv it";

app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));
app.use(express.static('public'));

const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const REDIRECT_URI = process.env.DISCORD_REDIRECT_URI;

function loadIdeas() {
  if (!fs.existsSync(DATA_FILE)) return [];
  return JSON.parse(fs.readFileSync(DATA_FILE));
}

function saveIdeas(ideas) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(ideas, null, 2));
}

async function userHasRole(discordId, requiredRole) {
  try {
    const res = await fetch(`${DISCORD_API}/${discordId}`, {
      headers: { 'x-api-key': process.env.DISCORD_API_KEY }
    });
    if (res.status !== 200) return false;
    const data = await res.json();
    return data.roles && data.roles.some(r =>
      r.toLowerCase().replace(/['"]/g, '') === requiredRole.toLowerCase().replace(/['"]/g, '')
    );
  } catch (e) {
    console.error("Error verificando usuario Discord:", e);
    return false;
  }
}

async function getUserRoles(discordId) {
  try {
    const res = await fetch(`${DISCORD_API}/${discordId}`, {
      headers: { 'x-api-key': process.env.DISCORD_API_KEY }
    });
    if (res.status !== 200) return [];
    const data = await res.json();
    return data.roles || [];
  } catch (e) {
    return [];
  }
}

app.get('/login', (req, res) => {
  const url = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=identify guilds guilds.members.read`;
  res.redirect(url);
});

app.get('/callback', async (req, res) => {
  const code = req.query.code;
  const params = new URLSearchParams();
  params.append('client_id', CLIENT_ID);
  params.append('client_secret', CLIENT_SECRET);
  params.append('grant_type', 'authorization_code');
  params.append('code', code);
  params.append('redirect_uri', REDIRECT_URI);
  params.append('scope', 'identify guilds guilds.members.read');

  const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    body: params,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  const tokenData = await tokenRes.json();
  const userRes = await fetch('https://discord.com/api/users/@me', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const userData = await userRes.json();
  req.session.user = userData;
  res.redirect('/dashboard');
});

app.get('/dashboard', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  res.sendFile(__dirname + '/public/index.html');
});

app.get('/api/user', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'No autenticado' });

  const discordId = req.session.user.id;
  const username = req.session.user.username;
  const roles = await getUserRoles(discordId);

  // Aseguramos que tenga asignados los votos
  const userVotes = ensureUserVotes(discordId, username, roles);

  res.json({
    username,
    discord_id: discordId,
    avatar_url: `https://cdn.discordapp.com/avatars/${discordId}/${req.session.user.avatar}.png`,
    roles,
    remaining_votes: userVotes.remaining_votes
  });
});


app.post('/submit-idea', async (req, res) => {
  const { idea, discord_id, username } = req.body;

  if (!(await userHasRole(discord_id, COMMENT_ROLE))) {
    return res.status(403).json({ success: false, error: 'No tienes el rol Lets pruv it' });
  }

  try {
    const ideaEntry = {
      idea,
      discord_id,
      username,
      timestamp: Date.now(),
      votes: 0
    };

    const ideas = loadIdeas();
    ideas.push(ideaEntry);
    saveIdeas(ideas);

    res.json({ success: true });
  } catch (err) {
    console.error('Error al guardar la idea:', err);
    res.status(500).json({ success: false, error: 'Error al guardar la idea' });
  }
});

app.post('/vote', async (req, res) => {
  const { index, discord_id, username, amount } = req.body;

  console.log(`🗳️ Intentando votar con ${amount} voto(s) por ${discord_id} en idea #${index}`);

  if (!index && index !== 0 || !discord_id || !username || !amount) {
    return res.status(400).json({ success: false, error: 'Faltan datos en la petición' });
  }

  const roles = await getUserRoles(discord_id);

  // Asegura que el usuario tenga votos asignados
  try {
    ensureUserVotes(discord_id, username, roles);
  } catch (e) {
    return res.status(500).json({ success: false, error: 'Error al inicializar votos del usuario' });
  }

  // Verifica que tenga suficientes votos
  try {
    updateUserVotes(discord_id, index, amount);
  } catch (e) {
    return res.status(403).json({ success: false, error: e.message });
  }

  // Carga y actualiza ideas
  const ideas = loadIdeas();
  if (!ideas[index]) {
    return res.status(404).json({ success: false, error: 'Idea no encontrada' });
  }

  ideas[index].votes += amount;
  saveIdeas(ideas);

  console.log(`✅ Se aplicaron ${amount} votos a la idea #${index}`);
  return res.json({ success: true });
});

app.listen(3000, () => console.log('Backend running on http://localhost:3000'));
