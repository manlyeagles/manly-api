const express = require('express');
const app = express();

const SUPABASE_URL = 'https://rtmzihkxiwiilxytahre.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ZG0Uq-sVDa0aFI1zkVHZiw_wBBNYpA4';

const formatStat = (key, value) => {
  if (value === null || value === undefined) return '';

  const num = Number(value);

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

    const toggleOrder = (col) =>
      (stat === col && order === 'desc') ? 'asc' : 'desc';

    const header = (col, label = col) =>
      `<a href="?stat=${encodeURIComponent(col)}&order=${toggleOrder(col)}&season=${season}">${label}</a>`;

    let rows = '';

    data.forEach((p) => {
      rows += `
        <tr>
          <td>${p.jersey_number || ''}</td>
          <td>${p.players?.first_name || ''}</td>
          <td>${p.players?.last_name || ''}</td>
          <td>${p.seasons?.season_name || ''}</td>
          <td>${p.players?.grade || ''}</td>

          <td>${p.GP || 0}</td>
          <td>${p.PA || 0}</td>
          <td>${p.AB || 0}</td>
          <td>${p.H || 0}</td>
          <td>${p['1B'] || 0}</td>
          <td>${p['2B'] || 0}</td>
          <td>${p['3B'] || 0}</td>
          <td>${p.HR || 0}</td>
          <td>${p.RBI || 0}</td>
          <td>${p.R || 0}</td>
          <td>${p.SO || 0}</td>
          <td>${p.KL || 0}</td>
          <td>${p.BB || 0}</td>
          <td>${p.HBP || 0}</td>
          <td>${p.ROE || 0}</td>
          <td>${p.FC || 0}</td>
          <td>${p.CI || 0}</td>

          <td>${formatStat('AVG', p.AVG)}</td>
          <td>${formatStat('OBP', p.OBP)}</td>
          <td>${formatStat('SLG', p.SLG)}</td>
          <td>${formatStat('OPS', p.OPS)}</td>
          <td>${formatStat('BA/RISP', p['BA/RISP'])}</td>

          <td>${p.SAC || 0}</td>
          <td>${p.SF || 0}</td>
          <td>${p.LOB || 0}</td>
          <td>${p.PIK || 0}</td>
          <td>${p.QAB || 0}</td>
          <td>${formatStat('QABpct', p.QABpct)}</td>
          <td>${formatStat('BABIP', p.BABIP)}</td>

          <td>${p.SB || 0}</td>
          <td>${p.CS || 0}</td>
          <td>${formatStat('SBpct', p.SBpct)}</td>
        </tr>
      `;
    });

   res.send(`
  <html>
    <body style="font-family:Arial">

    <div style="overflow-x:auto; width:100%;">
    </table>

</div>

    <style>
      table {
       <style>
  table {
    border-collapse: collapse;
    table-layout: auto;
    font-size: 12px;
  }

  thead th {
    padding: 10px 14px;
    white-space: nowrap;
    text-align: center;
    border-bottom: 2px solid #ccc;
  }

  tbody td {
    padding: 6px 12px;
    white-space: nowrap;
    text-align: center;
  }

  tr {
    border-bottom: 1px solid #eee;
  }
</style>
          <thead>
            <tr>
              <th style="padding:6px; white-space:nowrap;">#</th>
              <th style="padding:6px; white-space:nowrap;">First</th>
              <th style="padding:6px; white-space:nowrap;">Last</th>
              <th style="padding:6px; white-space:nowrap;">Season</th>
              <th style="padding:6px; white-space:nowrap;">Grade</th>

              <th>${header('GP')}</th>
              <th>${header('PA')}</th>
              <th>${header('AB')}</th>
              <th>${header('H')}</th>
              <th>${header('1B')}</th>
              <th>${header('2B')}</th>
              <th>${header('3B')}</th>
              <th>${header('HR')}</th>
              <th>${header('RBI')}</th>
              <th>${header('R')}</th>
              <th>${header('SO')}</th>
              <th>${header('KL','K-L')}</th>
              <th>${header('BB')}</th>
              <th>${header('HBP')}</th>
              <th>${header('ROE')}</th>
              <th>${header('FC')}</th>
              <th>${header('CI')}</th>

              <th>${header('AVG')}</th>
              <th>${header('OBP')}</th>
              <th>${header('SLG')}</th>
              <th>${header('OPS')}</th>
              <th>${header('BA/RISP')}</th>

              <th>${header('SAC')}</th>
              <th>${header('SF')}</th>
              <th>${header('LOB')}</th>
              <th>${header('PIK')}</th>
              <th>${header('QAB')}</th>
              <th>${header('QABpct','QAB%')}</th>
              <th>${header('BABIP')}</th>

              <th>${header('SB')}</th>
              <th>${header('CS')}</th>
              <th>${header('SBpct','SB%')}</th>
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
