// api/message.json.js
const fetch = require('node-fetch');

const VPS_BACKEND_URL = process.env.VPS_BACKEND_URL;

module.exports = async (req, res) => {
  if (!VPS_BACKEND_URL) {
    console.error('Error: VPS_BACKEND_URL no está configurada.');
    return res.status(500).json({ error: 'Server configuration error.' });
  }

  try {
    const response = await fetch(`${VPS_BACKEND_URL}/message.json`);

    res.status(response.status);
    for (const [key, value] of response.headers.entries()) {
        if (!['transfer-encoding', 'content-encoding', 'connection', 'keep-alive'].includes(key.toLowerCase())) {
            res.setHeader(key, value);
        }
    }
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error en /api/message.json (Vercel proxy):', error);
    res.status(500).json({ error: 'Failed to fetch message.json from backend.' });
  }
};
