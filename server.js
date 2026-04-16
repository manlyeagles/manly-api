app.get('/leaderboard/avg', async (req, res) => {
  try {
    const result = await pool.query(`SELECT 1`);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});
