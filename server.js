console.log("NEW CODE DEPLOYED");

const express = require('express');
const app = express();

const SUPABASE_URL = 'https://rtmzihkxiwiilxytahre.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ZG0Uq-sVDa0aFI1zkVHZiw_wBBNYpA4';

app.get('/leaderboard/view', async (req, res) => {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/player_season_stats?select=player_id,"AB","H",players(first_name,last_name)`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`
        }
      }
    );

    const data = await response.json();

    if (!Array.isArray(data)) {
      return res.send(`<pre>${JSON.stringify(data, null, 2)}</pre>`);
    }

    let rows = '';

    data.forEach((p, i) => {
      const avg = p.AB ? (p.H / p.AB).toFixed(3) : 0;

      rows += `
        <tr>
          <td>${i + 1}</td>
          <td>${p.players?.first_name || ''} ${p.players?.last_name || ''}</td>
          <td>-</td>
          <td>${avg}</td>
        </tr>
      `;
    });

    res.send(`
      <html>
        <body>
          <h2>LIVE DATA</h2>
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

  } catch (err) {
    res.send(err.toString());
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});
