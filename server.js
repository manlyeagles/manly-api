const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(cors());

console.log("Starting server...");

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'Manly Eagles Statistical History',
  password: 'manlyeagles',
  port: 5433,
});

app.get('/leaderboard/avg', async (req, res) => {
  console.log("Request received");

  try {
    const result = await pool.query(`
      SELECT *
      FROM player_advanced_stats
      WHERE pa >= (games_played * 2.2)
      ORDER BY avg DESC
      LIMIT 10
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

app.listen(3001, () => {
  console.log('API running on http://localhost:3001');
});