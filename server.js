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

    const url = `${SUPABASE_URL}/rest/v1/player_season_stats?season_id=eq.${encodeURIComponent(season)}&select=*,players!inner(first_name,last_name,grade)&order=${stat}.${order}`;

    const response = await fetch(url, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`
      }
    });

    const text = await response.text();
    console.log('RAW RESPONSE:', text);

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
          <td>${p.jersey_number || ''}</td>
          <td>${p.players?.first_name || ''}</td>
          <td>${p.players?.last_name || ''}</td>
          <td>${p.season_id || ''}</td>
          <td>${p.players?.grade || ''}</td>

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
  <body>

    <select onchange="location.href='?season='+this.value">
      <option value="2025/26" ${season === '2025/26' ? 'selected' : ''}>2025/26</option>
      <option value="2024/25" ${season === '2024/25' ? 'selected' : ''}>2024/25</option>
    </select>

    <table border="1">
      ${rows}
    </table>

  </body>
</html>
`);
  } catch (err) {
    res.send(err.toString());
  }
});

    <style>
      body { margin:0; }

      .table-container {
        width: 100vw;
        height: calc(100vh - 80px);
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
        z-index: 100;
        background: #800000;
        color: #fff;
        padding: 10px;
        text-align: center;
        white-space: nowrap;
      }

      thead th a {
        color: #fff;
        text-decoration: none;
      }

      tbody td {
        padding: 6px 10px;
        text-align: center;
        white-space: nowrap;
      }

      .name { text-align: left; }
      .jersey { font-weight: bold; }

     /* BODY frozen columns */
tbody td:nth-child(1) {
  position: sticky;
  left: 0;
  z-index: 5;
  background: #fff;
}

tbody td:nth-child(2) {
  position: sticky;
  left: 50px;
  z-index: 5;
  background: #fff;
}

tbody td:nth-child(3) {
  position: sticky;
  left: 170px;
  z-index: 5;
  background: #fff;
}

/* HEADER frozen columns (KEEP MAROON) */
thead th:nth-child(1),
thead th:nth-child(2),
thead th:nth-child(3) {
  position: sticky;
  z-index: 25;
  background: #800000;
}

/* header always on top */
thead th {
  z-index: 30;
}

      tbody tr { border-bottom: 1px solid #eee; }

      tbody tr:nth-child(even) {
        background: #fafafa;
      }
    </style>

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

  } catch (err) {
    res.send(err.toString());
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log("API running on port " + PORT);
});
