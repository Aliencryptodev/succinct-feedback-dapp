// server/app.js
const express = require('express');
const session = require('express-session');
const fetch = require('node-fetch');
const { exec } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();

// ─── Importa el router de proofs ─────────────────────────
const proofsRouter = require('./routes/proofs');

// ─── Constantes y configuración ──────────────────────────
const DATA_FILE     = 'ideas.json';
const DISCORD_API   = process.env.DISCORD_API_URL   || 'https://152.53.243.39.sslip.io/api/discord';
const VOTE_ROLE     = process.env.VOTE_ROLE         || 'Proof Verified';
const COMMENT_ROLE  = process.env.SUBMIT_ROLE       || 'lets pruv it';

const CLIENT_ID     = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const REDIRECT_URI  = process.env.DISCORD_REDIRECT_URI;

// ─── Middlewares ─────────────────────────────────────────
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'succinct-secret',
  resave: false,
  saveUninitialized: false
}));
app.use(express.static('public'));

// ─── Monta el router de SP1 proofs ────────────────────────
app.use('/api', proofsRouter);

// ─── Funciones de ayuda ───────────────────────────────────
function hashInput(str) {
  return parseInt(
    crypto.createHash('sha256')
          .update(str)
          .digest('hex')
          .slice(0, 8),
    16
  );
}

function loadIdeas() {
  if (!fs.existsSync(DATA_FILE)) return [];
  return JSON.parse(fs.readFileSync(DATA_FILE));
}

function saveIdeas(ideas) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(ideas, null, 2));
}

function saveIdea(newIdea) {
  const ideas = loadIdeas();
  ideas.push(newIdea);
  saveIdeas(ideas);
}

async function userHasRole(discordId, requiredRole) {
  try {
    const res = await fetch(`${DISCORD_API}/${discordId}`, {
      headers: { 'x-api-key': process.env.DISCORD_API_KEY }
    });
    if (res.status !== 200) return false;
    const data = await res.json();
    return Array.isArray(data.roles) && data.roles.includes(requiredRole);
  } catch (e) {
    console.error('Error verificando usuario Discord:', e);
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
    return Array.isArray(data.roles) ? data.roles : [];
  } catch {
    return [];
  }
}

// ─── Rutas de OAuth y usuario ────────────────────────────
app.get('/login', (req, res) => {
  const url =
    `https://discord.com/api/oauth2/authorize?` +
    `client_id=${CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&response_type=code` +
    `&scope=identify guilds guilds.members.read`;
  res.redirect(url);
});

app.get('/callback', async (req, res) => {
  const code = req.query.code;
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDIRECT_URI,
    scope: 'identify guilds guilds.members.read'
  });

  const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    body: params,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });
  const tokenData = await tokenRes.json();
  const userRes = await fetch('https://discord.com/api/users/@me', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` }
  });
  const userData = await userRes.json();
  req.session.user = userData;
  res.redirect('/dashboard');
});

app.get('/dashboard', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.get('/api/user', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'No autenticado' });
  const discordId = req.session.user.id;
  const roles = await getUserRoles(discordId);
  res.json({
    username: req.session.user.username,
    discord_id: discordId,
    avatar_url: `https://cdn.discordapp.com/avatars/${discordId}/${req.session.user.avatar}.png`,
    roles
  });
});

// ─── Rutas de ideas y votos ───────────────────────────────
app.post('/submit-idea', async (req, res) => {
  const { idea, discord_id, username } = req.body;
  if (!(await userHasRole(discord_id, COMMENT_ROLE))) {
    return res.status(403).json({ success: false, error: 'No tienes el rol lets pruv it' });
  }

  const ideaHash    = hashInput(idea);
  const discordHash = hashInput(discord_id);
  const cmd = `sp1 prove src/main.rs --args ${discordHash} ${ideaHash}`;

  exec(cmd, { cwd: './sp1-circuit' }, (err, stdout, stderr) => {
    if (err) return res.status(500).json({ success: false, error: stderr });

    exec('sp1 verify ./output/proof.json', { cwd: './sp1-circuit' }, (vErr) => {
      if (vErr) return res.status(403).json({ success: false, error: 'Prueba SP1 inválida' });
      saveIdea({ idea, discord_id, username, proof: stdout.trim(), timestamp: Date.now(), votes: 0 });
      res.json({ success: true });
    });
  });
});

app.post('/vote', async (req, res) => {
  const { index, discord_id } = req.body;
  if (!(await userHasRole(discord_id, VOTE_ROLE))) {
    return res.status(403).json({ success: false, error: 'No tienes el rol Proof Verified' });
  }

  const ideas = loadIdeas();
  if (!ideas[index]) return res.status(404).json({ success: false, error: 'Idea no encontrada' });

  const ideaHash    = hashInput(ideas[index].idea);
  const discordHash = hashInput(discord_id);
  const cmd = `sp1 prove src/main.rs --args ${discordHash} ${ideaHash}`;

  exec(cmd, { cwd: './sp1-circuit' }, (err, stdout, stderr) => {
    if (err) return res.status(500).json({ success: false, error: stderr });

    exec('sp1 verify ./output/proof.json', { cwd: './sp1-circuit' }, (vErr) => {
      if (vErr) return res.status(403).json({ success: false, error: 'Prueba SP1 inválida' });
      ideas[index].votes++;
      saveIdeas(ideas);
      res.json({ success: true });
    });
  });
});

app.get('/ideas', (req, res) => {
  const ideas      = loadIdeas();
  const sorted     = ideas.sort((a, b) => b.votes - a.votes);
  const totalVotes = ideas.reduce((sum, i) => sum + (i.votes || 0), 0);
  res.json({ ideas: sorted, totalVotes });
});

// ─── Inicia el servidor ───────────────────────────────────
app.listen(3000, () => console.log('Backend running on http://localhost:3000'));
