const fs = require('fs');

const ROLE_VOTE_MAP = {
  'all in succinct': 50,
  'proof verified': 20,
  'proof of dev': 15
};

const USERS_FILE = 'users.json';

function normalize(str) {
  return str.toLowerCase().replace(/['"]/g, '');
}

function calculateVotesFromRoles(roles) {
  let maxVotes = 0;
  for (const role of roles) {
    const normalized = normalize(role);
    if (ROLE_VOTE_MAP[normalized] && ROLE_VOTE_MAP[normalized] > maxVotes) {
      maxVotes = ROLE_VOTE_MAP[normalized];
    }
  }
  return maxVotes;
}

function getUsers() {
  if (!fs.existsSync(USERS_FILE)) return {};
  return JSON.parse(fs.readFileSync(USERS_FILE));
}

function saveUsers(data) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2));
}

function ensureUserVotes(discord_id, username, roles) {
  const users = getUsers();

  if (!users[discord_id]) {
    const votes = calculateVotesFromRoles(roles);
    users[discord_id] = {
      username,
      roles,
      remaining_votes: votes,
      used_votes: []
    };
    saveUsers(users);
  }

  return users[discord_id];
}

function updateUserVotes(discord_id, ideaIndex, amount) {
  const users = getUsers();
  const user = users[discord_id];

  if (!user || user.remaining_votes < amount) {
    throw new Error(`No tienes suficientes votos disponibles (te quedan ${user?.remaining_votes || 0})`);
  }

  // registrar
  user.remaining_votes -= amount;
  user.used_votes.push({ ideaIndex, amount });
  saveUsers(users);
}

module.exports = {
  ensureUserVotes,
  updateUserVotes
};
