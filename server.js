const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());

// TEST ROUTE (no database yet)
app.get('/leaderboard/avg', (req, res) => {
  res.json([
    {
      first_name: "Test",
      last_name: "Player",
      grade: "First Grade",
      avg: 0.500
    }
  ]);
});

// IMPORTANT for Render (uses dynamic port)
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});
