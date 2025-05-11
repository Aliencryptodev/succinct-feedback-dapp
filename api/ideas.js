const express = require('express');
const router = express.Router();

let ideas = [];

router.get('/', (req, res) => {
  const totalVotes = ideas.reduce((acc, i) => acc + i.votes, 0);
  res.json({ ideas, totalVotes });
});

router.post('/', (req, res) => {
  const { idea, discord_id, username } = req.body;
  if (!idea || !discord_id) return res.status(400).json({ error: 'Missing idea or discord_id' });

  ideas.push({ idea, discord_id, username, votes: 0 });
  res.json({ success: true });
});

module.exports = router;
