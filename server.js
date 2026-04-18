const express = require('express');

const app = express();

const SUPABASE_URL = 'https://rtmzihkxiwiilxytahre.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ZG0Uq-sVDa0aFI1zkVHZiw_wBBNYpA4';

app.get('/players', async (req, res) => {
  try {
    const { grade, min_pa, stat, order } = req.query;

    let url = `${SUPABASE_URL}/rest/v1/player_advanced_stats?select=*`;

    // filter by grade
    if (grade) {
      url += `&grade=eq.${grade}`;
    }

    // filter by minimum plate appearances
    if (min_pa) {
      url += `&pa=gte.${min_pa}`;
    }

    // sort
    if (stat) {
      url += `&order=${stat}.${order || 'desc'}`;
    }

    const response = await fetch(url, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`
      }
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json(err);
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});
