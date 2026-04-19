const express = require('express');
const app = express();

const SUPABASE_URL = 'https://rtmzihkxiwiilxytahre.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ZG0Uq-sVDa0aFI1zkVHZiw_wBBNYpA4';

const formatStat = (key, value) => {
  if (value === null || value === undefined) return 0;

  const num = Number(value);

  // ERA → 2 decimal places
  if (key === 'ERA') return num.toFixed(2);

  // AVG/OBP/SLG/OPS → 3 decimal places
  if (['AVG', 'OBP', 'SLG', 'OPS'].includes(key)) return num.toFixed(3);

  return num;
};

app.get('/leaderboard/view', async (req, res) => {
  try {
    const stat = req.query.stat || 'AVG';
    const order = req.query.order === 'asc' ? 'asc' : 'desc';
    const season = req.query.season || 1;

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/player_season_stats?season_id=eq.${season}&select=player_id,season_id,"AB","H","HR","RBI","OPS","AVG",players(first_name,last_name,grade),seasons(season_name)&order=${stat}.${order}`,
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

    const toggleOrder = (col) => {
      return (stat === col && order === 'desc') ? 'asc' : 'desc';
    };

    let rows = '';

    data.forEach((p, i) => {
      rows += `
        <tr>
          <td>${i + 1}</td>
          <td>${p.players?.first_name || ''} ${p.players?.last_name || ''}</td>
          <td>${p.players?.grade || ''}</td>
          <td>${p.seasons?.season_name || ''}</td>
          <td>${formatStat('AVG', p.AVG)}</td>
          <td>${formatStat('HR', p.HR)}</td>
          <td>${formatStat('RBI', p.RBI)}</td>
          <td>${formatStat('OPS', p.OPS)}</td>
        </tr>
      `;
    });

    const headerLink = (col, label) =>
      `<a href="?stat=${col}&order=${toggleOrder(col)}&season=${season}">${label}</a>`;

    res.send(`
      <html>
        <body>

        <table border="1" style="width:100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Grade</th>
              <th>Season</th>
              <th>${headerLink('AVG', 'AVG')}</th>
              <th>${headerLink('HR', 'HR')}</th>
              <th>${headerLink('RBI', 'RBI')}</th>
              <th>${headerLink('OPS', 'OPS')}</th>
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
