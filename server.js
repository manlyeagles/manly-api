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
    const stat = (req.query.stat || 'avg').toLowerCase();
    const order = req.query.order === 'asc' ? 'asc' : 'desc';
    const season = req.query.season || '2025/26';

    const url = `${SUPABASE_URL}/rest/v1/player_season_stats?season_id=eq.${encodeURIComponent(season)}&select=*,players!inner(first_name,last_name)&order=${stat}.${order}`;

    const response = await fetch(url, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`
      }
    });

    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return res.send(text);
    }

    if (!Array.isArray(data)) {
      return res.send(text);
    }

    let rows = '';

    data.forEach((p) => {
      rows += `
        <tr>
          <td class="jersey">${p.jersey_number || ''}</td>
          <td class="name">${p.players?.first_name || ''}</td>
          <td class="name">${p.players?.last_name || ''}</td>
          <td>${p.season_id || ''}</td>
          <td>${p.grade || ''}</td>

          <td>${p.gp || 0}</td>
          <td>${p.pa || 0}</td>
          <td>${p.ab || 0}</td>
          <td>${p.h || 0}</td>
          <td>${p["1B"] || 0}</td>
          <td>${p["2B"] || 0}</td>
          <td>${p["3B"] || 0}</td>
          <td>${p.hr || 0}</td>
          <td>${p.rbi || 0}</td>
          <td>${p.r || 0}</td>
          <td>${p.so || 0}</td>
          <td>${p.kl || 0}</td>
          <td>${p.bb || 0}</td>
          <td>${p.hbp || 0}</td>
          <td>${p.roe || 0}</td>
          <td>${p.fc || 0}</td>
          <td>${p.ci || 0}</td>

          <td>${formatStat('AVG', p.avg)}</td>
          <td>${formatStat('OBP', p.obp)}</td>
          <td>${formatStat('SLG', p.slg)}</td>
          <td>${formatStat('OPS', p.ops)}</td>
          <td>${formatStat('BA/RISP', p.bawrisp)}</td>

          <td>${p.sac || 0}</td>
          <td>${p.sf || 0}</td>
          <td>${p.lob || 0}</td>
          <td>${p.pik || 0}</td>
          <td>${p.qab || 0}</td>
          <td>${formatStat('QABpct', p.qabpct)}</td>
          <td>${formatStat('BABIP', p.babip)}</td>

          <td>${p.sb || 0}</td>
          <td>${p.cs || 0}</td>
          <td>${formatStat('SBpct', p.sbpct)}</td>
        </tr>
      `;
    });

    res.send(`
<html>
  <head>
    <style>
      body { font-family: Arial; margin: 0; }

      .table-container {
        width: 100vw;
        height: calc(100vh - 60px);
        overflow: auto;
      }

      table {
        border-collapse: collapse;
        font-size: 13px;
        min-width: 1800px;
      }

      thead th {
        position: sticky;
        top: 0;
        background: #800000;
        color: #fff;
        padding: 10px;
        text-align: center;
        white-space: nowrap;
      }

      tbody td {
        padding: 6px 10px;
        text-align: center;
        white-space: nowrap;
      }

      tbody tr { border-bottom: 1px solid #eee; }

      tbody tr:nth-child(even) {
        background: #fafafa;
      }

      .name { text-align: left; }
      .jersey { font-weight: bold; }

      tbody td:nth-child(1) {
        position: sticky;
        left: 0;
        background: #fff;
        z-index: 5;
      }

      tbody td:nth-child(2) {
        position: sticky;
        left: 50px;
        background: #fff;
        z-index: 5;
      }

      tbody td:nth-child(3) {
        position: sticky;
        left: 170px;
        background: #fff;
        z-index: 5;
      }

      thead th:nth-child(1),
      thead th:nth-child(2),
      thead th:nth-child(3) {
        position: sticky;
        z-index: 25;
        background: #800000;
      }
    </style>
  </head>

  <body>

    <div style="padding:10px;">
      <select onchange="location.href='?season='+this.value">
        <option value="2025/26" ${season === '2025/26' ? 'selected' : ''}>2025/26</option>
        <option value="2024/25" ${season === '2024/25' ? 'selected' : ''}>2024/25</option>
      </select>
    </div>

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>First</th>
            <th>Last</th>
            <th>Season</th>
            <th>Grade</th>
            <th>GP</th>
            <th>PA</th>
            <th>AB</th>
            <th>H</th>
            <th>1B</th>
            <th>2B</th>
            <th>3B</th>
            <th>HR</th>
            <th>RBI</th>
            <th>R</th>
            <th>SO</th>
            <th>KL</th>
            <th>BB</th>
            <th>HBP</th>
            <th>ROE</th>
            <th>FC</th>
            <th>CI</th>
            <th>AVG</th>
            <th>OBP</th>
            <th>SLG</th>
            <th>OPS</th>
            <th>BA/RISP</th>
            <th>SAC</th>
            <th>SF</th>
            <th>LOB</th>
            <th>PIK</th>
            <th>QAB</th>
            <th>QAB%</th>
            <th>BABIP</th>
            <th>SB</th>
            <th>CS</th>
            <th>SB%</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
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
