app.get('/leaderboard/avg', async (req, res) => {
  res.json([
    {
      first_name: "Test",
      last_name: "Player",
      grade: "First Grade",
      avg: 0.500
    }
  ]);
});
