export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).end(); // Method Not Allowed
  }

  // 🔒 Simulación de usuario autenticado (reemplaza con lógica real si ya usas OAuth)
  const user = {
    discord_id: '802872716935692348',
    username: 'alien_cryp',
    avatar_url: 'https://cdn.discordapp.com/avatars/802872716935692348/e11157ca6303369937bd86a9c9cf07ba.png',
    roles: [
      'lets pruv it',
      '🇪🇸・español',
      'X PROVER',
      'ZK EVENTS',
      'PROOF OF DEV',
      'Dev Channel',
      'Proof Verified'
    ]
  };

  res.status(200).json(user);
}

