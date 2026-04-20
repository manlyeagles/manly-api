const express = require('express');
const app = express();

const SUPABASE_URL = 'https://rtmzihkxiwiilxytahre.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ZG0Uq-sVDa0aFI1zkVHZiw_wBBNYpA4';

app.get('/leaderboard/view', async (req, res) => {
  try {
    const stat = (req.query.stat || 'gp').toLowerCase();
    const order = req.query.order === 'asc' ? 'asc' : 'desc';
    const season = req.query.season || '';
    const grade = req.query.grade || '';
    const search = req.query.search || '';

    // seasons
    const seasonsRes = await fetch(`${SUPABASE_URL}/rest/v1/seasons?select=season_name,season_num&order=season_num.asc`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`
      }
    });
    const seasons = await seasonsRes.json();

    const seasonOptions = `
      <option value="">All Seasons</option>
      ${seasons.map(s => `
        <option value="${s.season_name}" ${season === s.season_name ? 'selected' : ''}>
          ${s.season_name}
        </option>
      `).join('')}
    `;

    // query
    let url = `${SUPABASE_URL}/rest/v1/player_season_stats?select=*,players!inner(first_name,last_name)&order=${stat}.${order}`;

    if (season) url += `&season_id=eq.${encodeURIComponent(season)}`;
    if (grade) url += `&grade=eq.${encodeURIComponent(grade)}`;

    if (search) {
      const safe = search.replace(/[^a-zA-Z0-9]/g, '');
      url += `&or=(players.first_name.ilike.*${safe}*,players.last_name.ilike.*${safe}*,jersey_number.eq.${safe})`;
    }

    const response = await fetch(url, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`
      }
    });

    const data = await response.json();

    const toggle = col => (stat === col && order === 'desc') ? 'asc' : 'desc';

    const link = (col, label = col.toUpperCase()) =>
      `<a href="?stat=${col}&order=${toggle(col)}&season=${season}&grade=${grade}&search=${search}" style="color:white;text-decoration:none;">${label}</a>`;

    // rows
    let rows = '';

    data.forEach(p => {
      rows += `
<tr>
<td>${p.jersey_number || ''}</td>
<td>${p.players?.first_name || ''}</td>
<td>${p.players?.last_name || ''}</td>
<td>${p.season_id}</td>
<td>${p.grade || ''}</td>

<td>${p.gp || 0}</td>
<td>${p.pa || 0}</td>
<td>${p.ab || 0}</td>
<td>${p.h || 0}</td>
<td>${p.hr || 0}</td>
<td>${p.rbi || 0}</td>
<td>${p.r || 0}</td>

<td>${p.avg || ''}</td>
<td>${p.obp || ''}</td>
<td>${p.slg || ''}</td>
<td>${p.ops || ''}</td>
</tr>
`;
    });

    res.send(`
<html>
<head>
<style>
html, body {
  margin: 0;
  height: 100%;
  font-family: Arial;
}

.wrapper {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.controls {
  padding: 10px;
  border-bottom: 1px solid #ddd;
}

/* buttons */
.button-bar {
  margin-bottom:10px;
  display:flex;
  gap:8px;
  flex-wrap:wrap;
}

.button-bar a button {
  padding:6px 10px;
  cursor:pointer;
}

/* scroll container */
.table-container {
  flex: 1;
  overflow: auto;
}

/* table */
table {
  border-collapse: collapse;
  width: max-content;
  min-width: 1400px;
  font-size: 13px;
}

thead th {
  position: sticky;
  top: 0;
  background: #800000;
  color: white;
  padding: 8px;
}

td {
  padding: 6px 10px;
  white-space: nowrap;
}

tr:nth-child(even) td {
  background: #f5f5f5;
}
</style>
</head>

<body>

<div class="wrapper">

  <div class="controls">

    <!-- SECTION NAV -->
    <div class="button-bar">
      <a href="#games"><button>Total Games</button></a>
      <a href="#hitting"><button>Hitting</button></a>
    </div>

    <!-- GRADE BUTTONS -->
    <div class="button-bar">
      <a href="?grade=&season=${season}&search=${search}"><button>All</button></a>
      <a href="?grade=First Grade&season=${season}&search=${search}"><button>First Grade</button></a>
      <a href="?grade=Second Grade&season=${season}&search=${search}"><button>Second Grade</button></a>
      <a href="?grade=Third Grade&season=${season}&search=${search}"><button>Third Grade</button></a>
      <a href="?grade=Under 18&season=${season}&search=${search}"><button>Under 18</button></a>
      <a href="?grade=Womens&season=${season}&search=${search}"><button>Womens</button></a>
      <a href="?grade=Other&season=${season}&search=${search}"><button>Other</button></a>
    </div>

    <!-- FILTERS -->
    <form method="GET">
      <input name="search" placeholder="Search..." value="${search}">
      <button>Search</button>

      <select name="season" onchange="this.form.submit()">
        ${seasonOptions}
      </select>

      <input type="hidden" name="grade" value="${grade}">
      <input type="hidden" name="stat" value="${stat}">
      <input type="hidden" name="order" value="${order}">
    </form>

  </div>

  <div class="table-container">

    <!-- TOTAL GAMES -->
    <h2 id="games">Total Games Played</h2>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>First</th>
          <th>Last</th>
          <th>Season</th>
          <th>Grade</th>
          <th>${link('gp','GP')}</th>
        </tr>
      </thead>
      <tbody>
        ${data.map(p => `
          <tr>
            <td>${p.jersey_number || ''}</td>
            <td>${p.players?.first_name || ''}</td>
            <td>${p.players?.last_name || ''}</td>
            <td>${p.season_id}</td>
            <td>${p.grade}</td>
            <td>${p.gp || 0}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <!-- HITTING -->
    <h2 id="hitting">Hitting</h2>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>First</th>
          <th>Last</th>
          <th>Season</th>
          <th>Grade</th>

          <th>${link('gp')}</th>
          <th>${link('pa')}</th>
          <th>${link('ab')}</th>
          <th>${link('h')}</th>
          <th>${link('hr')}</th>
          <th>${link('rbi')}</th>
          <th>${link('r')}</th>

          <th>${link('avg')}</th>
          <th>${link('obp')}</th>
          <th>${link('slg')}</th>
          <th>${link('ops')}</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>

  </div>

</div>

</body>
</html>
`);
  } catch (err) {
    res.send(err.toString());
  }
});

app.listen(3001, () => console.log("Server running"));
