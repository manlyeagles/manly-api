const express = require('express');
const { Pool } = require('pg');

const app = express();

// database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// test route
app.get('/leaderboard/avg', async (req, res) => {
  try {
    const result = await pool.query('SELECT 1');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});
