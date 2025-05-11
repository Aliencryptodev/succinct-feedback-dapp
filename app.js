require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const path = require('path');

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/user', require('./api/user'));
app.use('/api/active-users', require('./api/active-users'));
app.use('/api/ideas', require('./api/ideas'));
app.use('/api/vote', require('./api/vote'));

app.use(express.static(path.join(__dirname, 'public')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
