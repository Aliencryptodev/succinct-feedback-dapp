const express = require('express');
const session = require('express-session');
const fetch = require('node-fetch');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { ensureUserVotes, updateUserVotes } = require('./votes');
require('dotenv').config();

const app = express();
const PORT = 3000;

const DATA_FILE = 'ideas.json';
const DISCORD_API = 'https://152.53.243.39.sslip.io/api/discord';
const VOTE_ROLE = 'Proof Verified';
const COMMENT_ROLE = "lets pruv it";

const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const REDIRECT_URI = process.env.DISCORD_REDIRECT_URI;

// CORS middleware: permite ambos dominios, el de producción y el de Vercel
const allowedOrigins = [
  'https://succinct-feedback.com',
  'https://succinct-feedback-dapp.vercel.app'
];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Middleware
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,      // SOLO si usas HTTPS en producción
    sameSite: 'lax',   // O 'none' si necesitas cross-domain
    httpOnly: true
  }
}));
app.use(express.static(path.join(__dirname, 'public')));

// Helpers
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

// Rutas
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

  try {
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

    // Ahora redirige al dashboard en TU dominio
    res.redirect('https://succinct-feedback.com/dashboard');
  } catch (error) {
    console.error('❌ Error en /callback:', error);
    res.status(500).send('Error al autenticar con Discord');
  }
});

app.get('/api/user', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'No autenticado' });

  const discordId = req.session.user.id;
  const username = req.session.user.username;
  const roles = await getUserRoles(discordId);
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
    console.error('❌ Error al guardar la idea:', err);
    res.status(500).json({ success: false, error: 'Error al guardar la idea' });
  }
});

app.post('/vote', async (req, res) => {
  const { index, discord_id, username, amount } = req.body;

  console.log(`🗳️ Voto solicitado: ${amount} voto(s) a idea #${index} por ${username} (${discord_id})`);

  if (!await userHasRole(discord_id, VOTE_ROLE)) {
    return res.status(403).json({ success: false, error: 'No tienes el rol Proof Verified' });
  }

  const ideas = loadIdeas();
  if (!ideas[index]) {
    return res.status(404).json({ success: false, error: 'Idea no encontrada' });
  }

  try {
    updateUserVotes(discord_id, index, amount);
    ideas[index].votes += amount;
    saveIdeas(ideas);
    return res.json({ success: true });
  } catch (e) {
    console.error('❌ Error al votar:', e.message);
    return res.status(400).json({ success: false, error: e.message });
  }
});

app.get('/ideas', (req, res) => {
  const ideas = loadIdeas();
  const totalVotes = ideas.reduce((acc, i) => acc + (i.votes || 0), 0);
  res.json({ ideas, totalVotes });
});

app.get('/message.json', (req, res) => {
  const discardedPath = path.join(__dirname, 'discarded.json');
  if (fs.existsSync(discardedPath)) {
    res.sendFile(discardedPath);
  } else {
    res.json([]);
  }
});

// Última ruta para mostrar algo si visitan la raíz
app.get('/', (req, res) => {
  res.send('🚀 Backend Succinct Feedback DApp corriendo correctamente.');
});

// SPA fallback: sirve index.html para cualquier ruta que no sea API ni recurso estático
app.get('*', (req, res) => {
  // Si la ruta empieza por /api, la dejamos pasar como error 404 de API
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  // Sirve el frontend para cualquier otra ruta (SPA)
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Backend running at http://localhost:${PORT}`);
});
