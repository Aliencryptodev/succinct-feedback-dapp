
export default async function handler(req, res) {
  try {
    const backendRes = await fetch('http://217.65.144.64:3000/api/user');
    const data = await backendRes.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
}
