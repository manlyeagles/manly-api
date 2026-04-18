app.get('/leaderboard/avg', async (req, res) => {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/player_advanced_stats?select=*&pa=gte.20&order=avg.desc&limit=10`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`
        }
      }
    );

    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json(err);
  }
});
