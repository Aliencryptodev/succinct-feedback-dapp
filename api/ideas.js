
import ideas from '../../../server/ideas.json';

export default function handler(req, res) {
  const sorted = ideas.sort((a, b) => b.votes - a.votes);
  const totalVotes = ideas.reduce((sum, i) => sum + (i.votes || 0), 0);
  res.status(200).json({ ideas: sorted, totalVotes });
}
