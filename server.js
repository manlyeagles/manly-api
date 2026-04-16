app.get('/leaderboard/avg', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM player_advanced_stats
      LIMIT 10
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});
