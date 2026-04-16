app.get('/leaderboard/avg', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM player_advanced_stats LIMIT 10');
    res.json(result.rows);
  } catch (err) {
    console.error('FULL ERROR:', err);
    res.status(500).json({
      message: err.message,
      code: err.code,
      detail: err.detail
    });
  }
});
