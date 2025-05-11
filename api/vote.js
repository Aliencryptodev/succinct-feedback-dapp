const express = require('express');
const router = express.Router();

let ideas = require('./ideas').ideas || [];

router.post('/', (req, res) => {
  const { index, discord_id } = req.body;
  if (typeof index !== 'number' || !discord_id) return res.status(400).json({ error: 'Missing data' });

  if (!ideas[index]) return res.status(404).json({ error: 'Idea not found' });

  ideas[index].votes += 1;
  res.json({ success: true });
});

module.exports = router;
