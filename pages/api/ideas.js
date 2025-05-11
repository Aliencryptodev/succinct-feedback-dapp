
export default async function handler(req, res) {
  try {
    const backendRes = await fetch('http://217.65.144.64:3000/ideas');
    const data = await backendRes.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch ideas from backend' });
  }
}
