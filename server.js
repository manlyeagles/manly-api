const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());

// ✅ DATABASE CONNECTION
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// ✅ REAL DATA ROUTE
app.get('/leaderboard/avg', async (req, res) => {
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

// REQUIRED FOR RENDER
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});
