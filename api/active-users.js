const express = require('express');
const router = express.Router();
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
require('dotenv').config();

router.get('/', async (req, res) => {
  const apiKey = process.env.ROLES_API_KEY;

  try {
    const response = await fetch('https://152.53.243.39.sslip.io/api/discord', {
      headers: { 'x-api-key': apiKey }
    });

    if (!response.ok) return res.status(500).json({ error: 'Failed to fetch users' });

    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
