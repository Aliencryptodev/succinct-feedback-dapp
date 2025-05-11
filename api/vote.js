let ideas = [];
let totalVotes = 0;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end(); // Method Not Allowed
  }

  const { index, discord_id } = req.body;

  if (typeof index !== 'number' || !discord_id) {
    return res.status(400).json({ error: 'Missing index or discord_id' });
  }

  // Simula la verificación con SP1 (aquí conectas con tu backend real más adelante)
  const zkVerified = true; // ← Cambia esto por una llamada real al verificador

  if (!zkVerified) {
    return res.status(403).json({ error: 'SP1 verification failed' });
  }

  // Evita error si aún no se han cargado ideas (temporalmente en memoria)
  if (!ideas[index]) {
    return res.status(404).json({ error: 'Idea not found' });
  }

  ideas[index].votes += 1;
  totalVotes += 1;

  return res.status(200).json({ success: true });
}

