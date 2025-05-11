const express = require('express');
const router = express.Router();
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
require('dotenv').config();

router.get('/', async (req, res) => {
  const userId = req.headers['x-discord-id'];
  const username = req.headers['x-username'];

  if (!userId && !username) {
    return res.status(401).json({ error: 'No user ID or username provided' });
  }

  const query = userId || username;
  const apiKey = process.env.ROLES_API_KEY;

  try {
    const response = await fetch(`https://152.53.243.39.sslip.io/api/discord/${query}`, {
      headers: { 'x-api-key': apiKey }
    });

    if (!response.ok) throw new Error('Failed to fetch user roles');
    const data = await response.json();

    res.status(200).json({
      discord_id: data.id,
      username: data.username,
      avatar_url: data.avatar,
      roles: data.roles || []
    });
  } catch (err) {
    console.error('Error fetching roles:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
