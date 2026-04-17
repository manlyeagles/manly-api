const express = require('express');
const { Pool } = require('pg');

const app = express();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

app.get('/leaderboard/avg', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM player_advanced_stats LIMIT 10');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json(err);
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});
