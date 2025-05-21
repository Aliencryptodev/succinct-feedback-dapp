// api/login.js
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const REDIRECT_URI = process.env.DISCORD_REDIRECT_URI; // Esta será la URL de Vercel

module.exports = (req, res) => {
  // Asegúrate de que los backticks `` se usan para la plantilla de string
  // Y que las variables se insertan con ${}
  const url = `https://discord.com/api/oauth2/authorize?client_id=<span class="math-inline">\{CLIENT\_ID\}&redirect\_uri\=</span>{encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=identify guilds guilds.members.read`;
  res.redirect(url);
};
