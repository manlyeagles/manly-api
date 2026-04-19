const express = require('express');
const app = express();

const SUPABASE_URL = 'https://rtmzihkxiwiilxytahre.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ZG0Uq-sVDa0aFI1zkVHZiw_wBBNYpA4';

const formatStat = (key, value) => {
  if (value === null || value === undefined) return 0;
  const num = Number(value);

  if (key === 'ERA') return num.toFixed(2);
  if (['AVG','OBP','SLG','OPS','BA/RISP','QABpct','BABIP','SBpct'].includes(key)) {
    return num.toFixed(3);
  }
  return num;
};

app.get('/leaderboard/view', async (req, res) => {
  try {
    const stat = req.query.stat || 'AVG';
    const order = req.query.order === 'asc' ? 'asc' : 'desc';
    const season = req.query.season || 1;

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/player_season_stats?season_id=eq.${season}&select=*,players(first_name,last_name,grade),seasons(season_name)&order=${stat}.${order}`,
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

    const header = (col) =>
      `<a href="?stat=${col}&order=${toggleOrder(col)}&season=${season}">${col}</a>`;

    let rows = '';

    data.forEach((p) => {
      rows += `
        <tr>
          <td>${p.jersey_number || ''}</td>
          <td>${p.players?.first_name || ''} ${p.players?.last_name || ''}</td>
          <td>${p.players?.grade || ''}</td>
          <td>${p.seasons?.season_name || ''}</td>

          <td>${formatStat('PA', p.PA)}</td>
          <td>${formatStat('AB', p.AB)}</td>
          <td>${formatStat('H', p.H)}</td>
          <td>${formatStat('1B', p['1B'])}</td>
          <td>${formatStat('2B', p['2B'])}</td>
          <td>${formatStat('3B', p['3B'])}</td>
          <td>${formatStat('HR', p.HR)}</td>
          <td>${formatStat('RBI', p.RBI)}</td>
          <td>${formatStat('R', p.R)}</td>
          <td>${formatStat('BB', p.BB)}</td>
          <td>${formatStat('HBP', p.HBP)}</td>
          <td>${formatStat('SO', p.SO)}</td>

          <td>${formatStat('AVG', p.AVG)}</td>
          <td>${formatStat('OBP', p.OBP)}</td>
          <td>${formatStat('SLG', p.SLG)}</td>
          <td>${formatStat('OPS', p.OPS)}</td>

          <td>${formatStat('SB', p.SB)}</td>
          <td>${formatStat('CS', p.CS)}</td>
        </tr>
      `;
    });

    res.send(`
      <html>
        <body style="overflow-x:auto; font-family:Arial">

        <table border="1" style="border-collapse:collapse; font-size:12px;">
          <thead>
            <tr>
              <th>Jersey</th>
              <th>Name</th>
              <th>Grade</th>
              <th>Season</th>

              <th>${header('PA')}</th>
              <th>${header('AB')}</th>
              <th>${header('H')}</th>
              <th>${header('1B')}</th>
              <th>${header('2B')}</th>
              <th>${header('3B')}</th>
              <th>${header('HR')}</th>
              <th>${header('RBI')}</th>
              <th>${header('R')}</th>
              <th>${header('BB')}</th>
              <th>${header('HBP')}</th>
              <th>${header('SO')}</th>

              <th>${header('AVG')}</th>
              <th>${header('OBP')}</th>
              <th>${header('SLG')}</th>
              <th>${header('OPS')}</th>

              <th>${header('SB')}</th>
              <th>${header('CS')}</th>
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
