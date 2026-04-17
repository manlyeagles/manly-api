const express = require('express');
const { Client } = require('pg');

const app = express();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

app.get('/leaderboard/avg', async (req, res) => {
  try {
    await client.connect();
    const result = await client.query('SELECT 1');
    await client.end();
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({
      message: err.message,
      code: err.code,
      full: err
    });
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});
