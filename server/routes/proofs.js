// server/routes/proofs.js
const express = require('express');
const { spawn } = require('child_process');
const path = require('path');

const router = express.Router();
const ELF_PATH = path.join(__dirname, '../../zk/hasher/script/script/example.elf');

router.post('/hash-proof', async (req, res) => {
  try {
    const { input } = req.body;
    if (typeof input !== 'string') {
      return res.status(400).json({ error: 'Input must be a string' });
    }

    const prover = spawn('sp1-prover', [
      'prove',
      '--elf', ELF_PATH,
      '--json'
    ]);

    let stdout = '', stderr = '';
    prover.stdin.write(JSON.stringify(input));
    prover.stdin.end();

    prover.stdout.on('data', d => stdout += d);
    prover.stderr.on('data', d => stderr += d);

    prover.on('close', code => {
      if (code !== 0) {
        console.error('Prover error:', stderr);
        return res.status(500).json({ error: 'Proof generation failed', details: stderr });
      }
      res.json(JSON.parse(stdout));
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
