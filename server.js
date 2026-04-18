const express = require('express');

const app = express();

const SUPABASE_URL = 'https://rtmzihkxiwiilxytahre.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ZG0Uq-sVDa0aFI1zkVHZiw_wBBNYpA4';

// HTML PAGE (for iframe)
app.get('/leaderboard/view', async (req, res) => {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/player_advanced_stats?select=player_code,first_name,last_name,grade,pa,avg&pa=gte.10&order=avg.desc&limit=10`,
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`
      }
    }
  );

  const data = await response.json();

  let rows = '';

  data.forEach((p, i) => {
    rows += `
      <tr>
        <td>${i + 1}</td>
        <td>${p.first_name} ${p.last_name}</td>
        <td>${p.grade}</td>
        <td>${p.avg}</td>
      </tr>
    `;
  });

  res.send(`
    <html>
      <body style="font-family: Arial; padding:20px;">
        <table border="1" style="width:100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Grade</th>
              <th>AVG</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </body>
    </html>
  `);
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});
