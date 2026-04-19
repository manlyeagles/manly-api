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

    const toggleOrder = (col) =>
      (stat === col && order === 'desc') ? 'asc' : 'desc';

    const header = (col, label = col) =>
      `<a href="?stat=${encodeURIComponent(col)}&order=${toggleOrder(col)}&season=${season}">${label}</a>`;

    let rows = '';

    data.forEach((p) => {
      rows += `
        <tr>
          <td class="jersey">${p.jersey_number || ''}</td>
          <td class="name">${p.players?.first_name || ''}</td>
          <td class="name">${p.players?.last_name || ''}</td>
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
  <body>

    <div style="padding:10px 0;">
      <select onchange="changeSeason(this.value)">
        <option value="1" ${season == 1 ? 'selected' : ''}>2025/26</option>
        <option value="2" ${season == 2 ? 'selected' : ''}>2024/25</option>
      </select>
    </div>

    <div class="table-container">
      <table>
        <thead>...</thead>
        <tbody>${rows}</tbody>
      </table>
    </div>

    <script>
      function changeSeason(season) {
        const url = new URL(window.location.href);
        url.searchParams.set('season', season);
        window.location.href = url.toString();
      }
    </script>

  </body>
</html>
`);
      <html>
        <body style="font-family:Arial; margin:0; padding:0;">

        <style>
         body {
  margin: 0;
  padding: 0;
}

.table-container {
  width: 100vw;          /* full screen width */
  height: calc(100vh - 120px); /* fills screen minus header */
  overflow: auto;
  border: none;
}

         table {
  border-collapse: collapse;
  font-size: 13px;       /* slightly bigger = fills space better */
  min-width: 1800px;     /* gives more horizontal presence */
}

          /* HEADER */
          thead th {
            position: sticky;
            top: 0;
            z-index: 100;
            background: #800000;
            color: #fff;
            padding: 10px;
            text-align: center;
          }

          thead th a {
            color: #fff;
            text-decoration: none;
          }

          /* BODY */
          tbody td {
            padding: 6px 10px;
            text-align: center;
            background: #fff;
          }

          .name {
            text-align: left;
          }

          .jersey {
            text-align: center;
            font-weight: bold;
          }

          /* FIXED WIDTHS */
          th:nth-child(1), td:nth-child(1) { min-width: 50px; }
          th:nth-child(2), td:nth-child(2) { min-width: 120px; }
          th:nth-child(3), td:nth-child(3) { min-width: 120px; }

          /* FREEZE ONLY FIRST 3 COLUMNS (BODY ONLY) */
          tbody td:nth-child(1) {
            position: sticky;
            left: 0;
            z-index: 10;
            background: #fff;
          }

          tbody td:nth-child(2) {
            position: sticky;
            left: 50px;
            z-index: 10;
            background: #fff;
          }

          tbody td:nth-child(3) {
            position: sticky;
            left: 170px;
            z-index: 10;
            background: #fff;
          }

          /* HEADER FREEZE MATCH (keeps color) */
          thead th:nth-child(1) {
            position: sticky;
            left: 0;
            z-index: 110;
          }

          thead th:nth-child(2) {
            position: sticky;
            left: 50px;
            z-index: 110;
          }

          thead th:nth-child(3) {
            position: sticky;
            left: 170px;
            z-index: 110;
          }

          tbody tr:hover {
            background: rgba(128,0,0,0.05);
          }
          td:nth-child(5), th:nth-child(5) {
  white-space: nowrap;
}
 table {
    border-collapse: collapse;
  }

  thead th, tbody td {
    border-right: 1px solid #ddd;
  }

  thead th:last-child,
  tbody td:last-child {
    border-right: none;
  }

  tbody tr {
    border-bottom: 1px solid #eee;
  }

  thead th {
    padding: 10px 12px;
  }

  tbody td {
    padding: 6px 10px;
  }

  tbody tr:nth-child(even) {
    background: #fafafa;
  }
        </style>

        <div class="table-wrapper">
  <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>First</th>
                <th>Last</th>
                <th>Season</th>
                <th>Grade</th>

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
        </div>

        </body>
      </html>
    `);
  } catch (err) {
    res.send(err.toString());
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log("API running on port " + PORT);
});
