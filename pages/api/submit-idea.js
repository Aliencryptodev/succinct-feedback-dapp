
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { idea, discord_id, username } = req.body;

  try {
    const backendRes = await fetch('http://217.65.144.64:3000/submit-idea', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idea, discord_id, username })
    });

    const data = await backendRes.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ success: false, error: 'Internal error' });
  }
}
