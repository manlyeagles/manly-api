const express = require('express');
const app = express();

app.get('/leaderboard/avg', (req, res) => {
  res.json([{ test: "working" }]);
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});
