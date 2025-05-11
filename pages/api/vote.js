export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { index, discord_id } = req.body;

  try {
    const backendRes = await fetch('http://217.65.144.64:3000/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ index, discord_id })
    });

    const data = await backendRes.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ success: false, error: 'Internal error' });
  }
}
