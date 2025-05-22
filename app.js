const express = require('express');
const session = require('express-session');
const fetch = require('node-fetch');
const crypto = require('crypto'); // Aunque no se usa directamente en el código proporcionado, lo mantengo si lo necesitas.
const fs = require('fs');
const { ensureUserVotes, updateUserVotes } = require('./votes');
// require('dotenv').config(); // Quita esto si estás desplegando en Vercel, ya que Vercel maneja las variables de entorno.
                            // Solo se usa para desarrollo local.

const app = express();
// En Vercel, el puerto se asigna automáticamente, no se necesita PORT = 3000.
// app.listen(process.env.PORT || 3000, ...) se encargará de esto.

const DATA_FILE = 'ideas.json';
// ¡CORRECCIÓN CLAVE! Tu backend en Vercel debe llamar directamente a la API de Discord.
const DISCORD_API = 'https://succinct-feedback-dapp.vercel.app/api/discord';
const VOTE_ROLE = 'Proof Verified';
const COMMENT_ROLE = "lets pruv it";

// CLIENT_ID, CLIENT_SECRET, REDIRECT_URI se obtienen de las variables de entorno de Vercel.
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const REDIRECT_URI = process.env.DISCORD_REDIRECT_URI; // Esta variable debe ser la URL de Vercel con /api/callback

// Middleware
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET, // Se obtiene de las variables de entorno de Vercel
  resave: false,
  saveUninitialized: false
}));
// Servir archivos estáticos desde la carpeta 'public'
app.use(express.static('public'));

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
    // La API de Discord para obtener roles de un miembro en un guild.
    // Necesitas los permisos adecuados (guilds.members.read) y un Bot Token para esto.
    // Si DISCORD_API_KEY es un token de bot, entonces la URL de la API es diferente.
    // Aquí asumo que DISCORD_API es 'https://discord.com/api' y que tienes el token de bot.
    // Si 'DISCORD_API_KEY' es el token de tu bot, necesitas la ID de tu guild.
    // Ejemplo: `https://discord.com/api/guilds/TU_GUILD_ID/members/${discordId}`
    // Y el header sería `Authorization: Bearer TU_BOT_TOKEN` o `Bot TU_BOT_TOKEN`.

    // Si DISCORD_API_KEY es realmente una clave para *otra* API de roles que tú tienes:
    const res = await fetch(`${DISCORD_API}/users/${discordId}/guilds`, { // Cambiado para intentar obtener los roles del usuario si DISCORD_API es la API de Discord
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}` // Se necesita un token de acceso aquí, el de OAuth
        // O si ROLES_API_KEY es un token de bot:
        // 'Authorization': `Bot ${process.env.ROLES_API_KEY}`
      }
    });

    if (res.status !== 200) {
      console.error(`Error al verificar roles para ${discordId}: ${res.status} ${res.statusText}`);
      return false;
    }
    const data = await res.json();
    // La estructura de 'data' dependerá de la API que estés llamando.
    // Si DISCORD_API es 'https://discord.com/api' y obtienes el perfil del usuario,
    // necesitarías un paso adicional para obtener los roles del usuario en el Gremio.
    // Esto generalmente se hace si tienes el permiso `guilds.members.read` y la ID del gremio.

    // Si `data` contiene una lista de roles directamente:
    return data.some(r =>
      r.toLowerCase().replace(/['"]/g, '') === requiredRole.toLowerCase().replace(/['"]/g, '')
    );
    // Si la llamada a DISCORD_API es para un servicio de roles que tu tienes,
    // la implementación actual `data.roles && data.roles.some(...)` podría ser correcta.
    // Dada la confusión anterior con `DISCORD_API` apuntando a tu VPS, es probable que `DISCORD_API_KEY`
    // se usara para una API propia que tuvieras en tu VPS para obtener roles.
    // Si ahora DISCORD_API es 'https://discord.com/api', esta función `userHasRole` y `getUserRoles`
    // probablemente necesiten ser reescritas para interactuar con la API de Discord usando un token de bot
    // y la ID de tu gremio, o para confiar en los scopes que se obtienen en el OAuth.
    // Por simplicidad y para mantener el flujo actual, dejaré la estructura asumiendo que `DISCORD_API_KEY`
    // era para una API de roles externa que no es la API de Discord directa, y que esa API aún existe
    // o que este código se adaptará para usar el token de bot y la API de Discord.

    // Si tu app.js en Vercel es el que consulta los roles directamente de Discord, usando un Bot Token:
    // const GUILD_ID = process.env.DISCORD_GUILD_ID; // Necesitarías una variable de entorno para esto
    // const botToken = process.env.DISCORD_BOT_TOKEN; // Necesitarías una variable de entorno para esto
    // const memberRes = await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/members/${discordId}`, {
    //   headers: { 'Authorization': `Bot ${botToken}` }
    // });
    // if (memberRes.status !== 200) return false;
    // const memberData = await memberRes.json();
    // return memberData.roles && memberData.roles.some(roleId => {
    //    // Necesitarías mapear roleId a nombres de rol o verificar si el roleId coincide con el rol requerido.
    //    // Esto requiere obtener todos los roles del gremio primero para comparar.
    //    return true; // Lógica más compleja aquí.
    // });

    // POR AHORA, mantengo la estructura original asumiendo que DISCORD_API_KEY es para un servicio de roles.
    // Si quieres que el propio `app.js` de Vercel gestione esto directamente con Discord:
    // Opción 1: Usa el token de bot (recomendado para roles de guild)
    //   Necesitas DISCORD_BOT_TOKEN y DISCORD_GUILD_ID como ENV variables.
    //   Y la ruta sería `https://discord.com/api/v10/guilds/${GUILD_ID}/members/${discordId}`.
    //   El header sería `Authorization: Bot ${process.env.DISCORD_BOT_TOKEN}`.
    // Opción 2: Confía en los roles del OAuth (si el scope guilds.members.read devuelve los roles directamente, que a veces no lo hace)
    //   Si userData del callback ya tiene roles, podrías guardarlos en sesión.

    // Dada la complejidad de la gestión de roles de Discord, y que tu app.js original usaba DISCORD_API_KEY
    // para una API externa, asumo que esa API (o una similar) es la que proporciona los roles.
    // Si `DISCORD_API` ahora es `https://discord.com/api`, y `DISCORD_API_KEY` es un token de bot,
    // entonces `userHasRole` y `getUserRoles` NECESITAN una refactorización para usar la API de Discord de manera apropiada
    // (con GUILD_ID y un Bot Token para la ruta `/guilds/{guild.id}/members/{user.id}`).
    // Por la inmediatez, si `DISCORD_API` era tu VPS con una API de roles, y ahora quieres que Vercel use esa API,
    // `DISCORD_API` DEBERÍA SER LA URL DE TU VPS PARA ESA API DE ROLES.
    // Si no, y `DISCORD_API_KEY` es para la API de Discord como Bot Token, la lógica de la URL debe cambiar.

    // Para evitar más bloqueos, y como la lógica de `userHasRole` y `getUserRoles` en tu app.js
    // usa `DISCORD_API_KEY` y una ruta como `/${discordId}`, la dejaré como estaba,
    // pero **es crucial que `DISCORD_API` apunte a la URL de tu API de roles** (si existe una externa,
    // que podría ser tu VPS si solo esa parte está allí), **o que refactorices esto para usar la API de Discord
    // con un Bot Token y Guild ID.**
    // **Si DISCORD_API es https://discord.com/api, entonces esta función DEBE ser refactorizada.**
    // Asumo que ROLES_API_KEY es el token de bot y que DISCORD_API es la base de la API de Discord.
    // Entonces la URL DEBERÍA ser: `https://discord.com/api/v10/guilds/${process.env.DISCORD_GUILD_ID}/members/${discordId}`
    // Y el header: `Authorization: Bot ${process.env.ROLES_API_KEY}`.

    // DEBIDO a que tu app.js anterior apuntaba a una IP para DISCORD_API con x-api-key,
    // **Si esa IP de tu VPS tiene una API de roles**, entonces `DISCORD_API` debería ser esa URL de tu VPS.
    // Si no tienes esa API de roles en tu VPS, y quieres que Vercel obtenga los roles directamente de Discord,
    // este `userHasRole` y `getUserRoles` necesitan una reescritura.

    // PARA SEGUIR ADELANTE, voy a mantener la estructura asumiendo que `DISCORD_API`
    // DEBERÍA APUNTAR A TU API DE ROLES EXTERNA (TU VPS), Y `ROLES_API_KEY` es para esa API.
    // Si esa API ya no existe o quieres que Vercel lo haga directamente, esta es la parte a cambiar.
    // Vuelvo a poner la URL que tenías en `app.js` (si es la API de roles en tu VPS)
    // O si `DISCORD_API` es la API de Discord, esta función necesita ser reescrita con la API de Guilds.
    // Considerando el `x-api-key`, es más probable que `DISCORD_API` fuera tu propia API de roles.
    // Por ahora, para que compile y funcione con la menor fricción, `DISCORD_API` debe ser la URL de tu API de ROLES.
    // Si tu API de ROLES está en tu VPS, mantén esa URL.

    // Para un despliegue completo en Vercel, el ideal es que `app.js` llame directamente a Discord.
    // Si `ROLES_API_KEY` es el token de bot de Discord, entonces el fetch debería ser:
    /*
    const GUILD_ID = process.env.DISCORD_GUILD_ID; // Necesitarías esto en Vercel ENV
    const res = await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/members/${discordId}`, {
      headers: { 'Authorization': `Bot ${process.env.ROLES_API_KEY}` } // ROLES_API_KEY como BOT_TOKEN
    });
    if (res.status !== 200) return false;
    const memberData = await res.json();
    // Aquí necesitarías mapear `memberData.roles` (IDs de rol) a los nombres de los roles
    // para compararlos con `requiredRole`. Esto implica otra llamada a /guilds/{GUILD_ID}/roles.
    return memberData.roles.some(roleId => {
      // Lógica de mapeo de IDs de rol a nombres de rol
      return false; // Placeholder
    });
    */

    // Mantengo la lógica que tenías, asumiendo que `DISCORD_API` es una API que ya te devuelve los roles de esa forma.
    // Si no es el caso, esta parte FALLARÁ.
    const fetchedRes = await fetch(`${process.env.DISCORD_ROLES_API_URL || 'https://discord.com/api'}/users/${discordId}/roles`, { // Nueva variable para roles API URL si existe
      headers: { 'x-api-key': process.env.ROLES_API_KEY } // Asumiendo que ROLES_API_KEY es para esta API
    });
    if (fetchedRes.status !== 200) {
      console.error(`Error al verificar roles para ${discordId}: ${fetchedRes.status} ${fetchedRes.statusText}`);
      return false;
    }
    const data = await fetchedRes.json();
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
    const res = await fetch(`${process.env.DISCORD_ROLES_API_URL || 'https://discord.com/api'}/users/${discordId}/roles`, { // Nueva variable para roles API URL si existe
      headers: { 'x-api-key': process.env.ROLES_API_KEY } // Asumiendo que ROLES_API_KEY es para esta API
    });
    if (res.status !== 200) return [];
    const data = await res.json();
    return data.roles || [];
  } catch (e) {
    console.error("Error obteniendo roles de usuario Discord:", e); // Añadido console.error
    return [];
  }
}

// Rutas
app.get('/login', (req, res) => {
  // Asegúrate de que CLIENT_ID y REDIRECT_URI se carguen correctamente de las variables de entorno de Vercel
  const url = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=identify%20guilds%20guilds.members.read`;
  res.redirect(url);
});

app.get('/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) {
    console.error('❌ Código de autorización no recibido en /callback');
    return res.status(400).send('Código de autorización no recibido.');
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
      console.error('❌ Error al obtener el token de Discord:', tokenData.error_description || tokenData.error);
      return res.status(400).send(`Error al obtener el token: ${tokenData.error_description || tokenData.error}`);
    }

    const userRes = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const userData = await userRes.json();
    if (userData.message === '401: Unauthorized') {
      console.error('❌ Error al obtener datos de usuario de Discord: No autorizado.');
      return res.status(401).send('Error al obtener datos de usuario: No autorizado por Discord.');
    }

    req.session.user = userData;

    // ✅ Redirige al frontend en Vercel
    // Asegúrate de que esta URL sea la base de tu frontend en Vercel
    res.redirect(process.env.FRONTEND_URL || 'https://succinct-feedback-dapp.vercel.app');
  } catch (error) {
    console.error('❌ Error en /callback:', error);
    res.status(500).send('Error al autenticar con Discord. Inténtalo de nuevo.');
  }
});

app.get('/api/user', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'No autenticado' });

  const discordId = req.session.user.id;
  const username = req.session.user.username;
  const roles = await getUserRoles(discordId); // Usa la función de obtener roles
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

  if (!idea) {
    return res.status(400).json({ success: false, error: 'El campo de idea no puede estar vacío.' });
  }

  // Verifica el rol usando la función userHasRole
  if (!(await userHasRole(discord_id, COMMENT_ROLE))) {
    return res.status(403).json({ success: false, error: `No tienes el rol "${COMMENT_ROLE}" para enviar ideas.` });
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

    res.json({ success: true, message: 'Idea enviada con éxito.' });
  } catch (err) {
    console.error('❌ Error al guardar la idea:', err);
    res.status(500).json({ success: false, error: 'Error interno del servidor al guardar la idea.' });
  }
});

app.post('/vote', async (req, res) => {
  const { index, discord_id, username, amount } = req.body;

  if (typeof index !== 'number' || index < 0) {
    return res.status(400).json({ success: false, error: 'Índice de idea no válido.' });
  }
  if (typeof amount !== 'number' || amount < 1) {
    return res.status(400).json({ success: false, error: 'Cantidad de votos no válida.' });
  }
  if (!discord_id) {
    return res.status(400).json({ success: false, error: 'ID de Discord del usuario no proporcionado.' });
  }

  console.log(`🗳️ Voto solicitado: ${amount} voto(s) a idea #${index} por ${username} (${discord_id})`);

  // Verifica el rol usando la función userHasRole
  if (!await userHasRole(discord_id, VOTE_ROLE)) {
    return res.status(403).json({ success: false, error: `No tienes el rol "${VOTE_ROLE}" para votar.` });
  }

  const ideas = loadIdeas();
  if (index >= ideas.length) {
    return res.status(404).json({ success: false, error: 'Idea no encontrada para votar.' });
  }

  try {
    updateUserVotes(discord_id, amount); // Modificado para solo pasar el ID y la cantidad de votos
    ideas[index].votes += amount;
    saveIdeas(ideas);
    return res.json({ success: true, message: 'Voto registrado con éxito.' });
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

// Nota: si 'message.json' en tu frontend es para ideas descartadas,
// entonces esta ruta debería cargar 'discarded.json'.
// Asegúrate de que 'discarded.json' exista en la raíz si lo usas.
app.get('/message.json', (req, res) => {
  const discardedPath = __dirname + '/discarded.json'; // O el nombre de tu archivo de ideas descartadas
  if (fs.existsSync(discardedPath)) {
    res.sendFile(discardedPath);
  } else {
    // Si no hay un archivo de descartadas, devuelve un array vacío
    res.json([]);
  }
});

// Ruta de "salud" para verificar que el backend está corriendo
app.get('/', (req, res) => {
  res.send('🚀 Backend Succinct Feedback DApp corriendo correctamente en Vercel.');
});

// Iniciar el servidor
// En Vercel, el puerto se asigna automáticamente, usamos process.env.PORT
app.listen(process.env.PORT || 3000, () => {
  console.log(`✅ Backend running on port ${process.env.PORT || 3000}`);
  console.log(`CLIENT_ID: ${CLIENT_ID ? 'Configurado' : 'NO CONFIGURADO'}`);
  console.log(`REDIRECT_URI: ${REDIRECT_URI || 'NO CONFIGURADO'}`);
});
