export default async function handler(req, res) {
  const response = await fetch('http://217.65.144.64:3000/api/user', {
    headers: req.headers
  });
  const data = await response.json();
  res.status(response.status).json(data);
}
