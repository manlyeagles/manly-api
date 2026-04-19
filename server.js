const express = require('express');
const app = express();

const SUPABASE_URL = 'https://rtmzihkxiwiilxytahre.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ZG0Uq-sVDa0aFI1zkVHZiw_wBBNYpA4';

app.get('/leaderboard/view', async (req, res) => {
  try {
    const stat = req.query.stat || 'AVG';
    const season = req.query.season || 1;

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/player_season_stats?season_id=eq.${season}&select=player_id,season_id,"AB","H","HR","RBI","OPS","AVG",players(first_name,last_name,grade),seasons(season_name)&order=${stat}.desc`,
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
      rows += `
        <tr>
          <td>${i + 1}</td>
          <td>${p.players?.first_name || ''} ${p.players?.last_name || ''}</td>
          <td>${p.players?.grade || ''}</td>
          <td>${p.seasons?.season_name || ''}</td>
          <td>${p.AVG || 0}</td>
          <td>${p.HR || 0}</td>
          <td>${p.RBI || 0}</td>
          <td>${p.OPS || 0}</td>
        </tr>
      `;
    });

    res.send(`
      <html>
        <body>

        <select onchange="window.location='?stat=' + this.value + '&season=${season}'">
          <option value="AVG">AVG</option>
          <option value="OPS">OPS</option>
          <option value="HR">HR</option>
          <option value="RBI">RBI</option>
        </select>

        <table border="1" style="width:100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Grade</th>
              <th>Season</th>
              <th>AVG</th>
              <th>HR</th>
              <th>RBI</th>
              <th>OPS</th>
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
