app.get('/leaderboard/avg', async (req, res) => {
  try {
    const result = await pool.query('SELECT 1');
    res.json(result.rows);
  } catch (err) {
    console.error('FULL ERROR:', err);
    res.status(500).json(err); // 👈 send EVERYTHING
  }
});
