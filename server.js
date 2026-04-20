const express = require('express');
const app = express();

const SUPABASE_URL = 'https://rtmzihkxiwiilxytahre.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ZG0Uq-sVDa0aFI1zkVHZiw_wBBNYpA4';

app.get('/leaderboard/view', async (req, res) => {
  try {
    const season = req.query.season || '';
    const grade = req.query.grade || '';
    const search = req.query.search || '';

    // ✅ FETCH SEASONS
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

    // ✅ BUILD QUERY
    let url = `${SUPABASE_URL}/rest/v1/player_season_stats?select=*,players!inner(first_name,last_name)`;

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

    // ✅ GROUP PLAYERS
    const playersMap = {};

    data.forEach(p => {
      const id = p.player_id;

      if (!playersMap[id]) {
        playersMap[id] = {
          player_id: id,
          first_name: p.players?.first_name,
          last_name: p.players?.last_name,
          jersey: p.jersey_number,
          seasons: []
        };
      }

      playersMap[id].seasons.push(p);
    });

    const players = Object.values(playersMap);

    // ✅ GENERIC TABLE BUILDER
    function buildTable(columns) {
      let rows = '';

      players.forEach(player => {

        const totals = {};
        columns.forEach(c => {
          totals[c] = player.seasons.reduce((sum, s) => sum + (Number(s[c]) || 0), 0);
        });

        rows += `
<tr class="main-row" onclick="toggle('${player.player_id}')">
  <td>${player.jersey || ''}</td>
  <td>${player.first_name}</td>
  <td>${player.last_name}</td>
  ${columns.map(c => `<td><b>${totals[c] || ''}</b></td>`).join('')}
</tr>
`;

        player.seasons.forEach(s => {
          rows += `
<tr class="detail-${player.player_id}" style="display:none;">
  <td></td>
  <td colspan="2">${s.season_id} - ${s.grade}</td>
  ${columns.map(c => `<td>${s[c] || ''}</td>`).join('')}
</tr>
`;
        });

      });

      return rows;
    }

    // ✅ TABLE DATA
    const gamesTable = buildTable(['gp']);

    const hittingTable = buildTable([
      'gp','pa','ab','h','hr','rbi','r','avg','obp','slg','ops'
    ]);

    res.send(`
<html>
<head>
<style>
html, body {
  margin:0;
  height:100%;
  font-family:Arial;
}

.wrapper {
  height:100vh;
  display:flex;
  flex-direction:column;
}

.controls {
  padding:10px;
  border-bottom:1px solid #ddd;
}

.button-bar {
  margin-bottom:10px;
  display:flex;
  gap:8px;
  flex-wrap:wrap;
}

.table-container {
  flex:1;
  overflow:auto;
}

table {
  border-collapse:collapse;
  width:max-content;
  min-width:1400px;
}

thead th {
  position:sticky;
  top:0;
  background:#800000;
  color:#fff;
  padding:8px;
}

td {
  padding:6px 10px;
  white-space:nowrap;
}

tr:nth-child(even) td {
  background:#f5f5f5;
}

.main-row {
  background:#eef;
  cursor:pointer;
  font-weight:bold;
}
</style>

<script>
function toggle(id) {
  document.querySelectorAll('.detail-' + id)
    .forEach(r => r.style.display =
      r.style.display === 'none' ? 'table-row' : 'none');
}
</script>

</head>

<body>

<div class="wrapper">

  <div class="controls">

    <!-- NAV -->
    <div class="button-bar">
      <a href="#games"><button>Total Games</button></a>
      <a href="#hitting"><button>Hitting</button></a>
    </div>

    <!-- GRADE BUTTONS -->
    <div class="button-bar">
      <a href="?"><button>All</button></a>
      <a href="?grade=First Grade"><button>First Grade</button></a>
      <a href="?grade=Second Grade"><button>Second Grade</button></a>
      <a href="?grade=Third Grade"><button>Third Grade</button></a>
      <a href="?grade=Under 18"><button>Under 18</button></a>
      <a href="?grade=Womens"><button>Womens</button></a>
      <a href="?grade=Other"><button>Other</button></a>
    </div>

    <!-- FILTERS -->
    <form method="GET">
      <input name="search" placeholder="Search..." value="${search}">
      <button>Search</button>

      <select name="season" onchange="this.form.submit()">
        ${seasonOptions}
      </select>

      <input type="hidden" name="grade" value="${grade}">
    </form>

  </div>

  <div class="table-container">

    <h2 id="games">Total Games</h2>
    <table>
      <thead>
        <tr><th>#</th><th>First</th><th>Last</th><th>GP</th></tr>
      </thead>
      <tbody>${gamesTable}</tbody>
    </table>

    <h2 id="hitting">Hitting</h2>
    <table>
      <thead>
        <tr>
          <th>#</th><th>First</th><th>Last</th>
          <th>GP</th><th>PA</th><th>AB</th><th>H</th>
          <th>HR</th><th>RBI</th><th>R</th>
          <th>AVG</th><th>OBP</th><th>SLG</th><th>OPS</th>
        </tr>
      </thead>
      <tbody>${hittingTable}</tbody>
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
