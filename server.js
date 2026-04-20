const express = require('express');
const app = express();

const SUPABASE_URL = 'https://rtmzihkxiwiilxytahre.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ZG0Uq-sVDa0aFI1zkVHZiw_wBBNYpA4';

app.get('/leaderboard/view', async (req, res) => {
  try {
    const season = req.query.season || '';
    const grade = req.query.grade || '';
    const search = req.query.search || '';

    // helper for decimals
    const format3 = v => (v !== null && v !== undefined && v !== '' ? Number(v).toFixed(3) : '');

    // fetch seasons
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

    // fetch stats
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

    // group players
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

    // table builder
    function buildTable(columns, isAverage = []) {
      let rows = '';

      players.forEach(player => {

        const totals = {};

        columns.forEach(c => {
          if (isAverage.includes(c)) {
            const vals = player.seasons.map(s => Number(s[c]) || 0);
            totals[c] = vals.length ? (vals.reduce((a,b)=>a+b,0)/vals.length) : 0;
          } else {
            totals[c] = player.seasons.reduce((sum, s) => sum + (Number(s[c]) || 0), 0);
          }
        });

        rows += `
<tr class="main-row" onclick="toggle('${player.player_id}')">
  <td class="center">${player.jersey || ''}</td>
  <td class="left">${player.first_name}</td>
  <td class="left">${player.last_name}</td>
  ${columns.map(c => `
    <td class="center"><b>${
      isAverage.includes(c) ? format3(totals[c]) : totals[c]
    }</b></td>
  `).join('')}
</tr>
`;

        player.seasons.forEach(s => {
          rows += `
<tr class="detail-${player.player_id}" style="display:none;">
  <td></td>
  <td colspan="2">${s.season_id} - ${s.grade}</td>
  ${columns.map(c => `
    <td class="center">${
      isAverage.includes(c) ? format3(s[c]) : (s[c] || 0)
    }</td>
  `).join('')}
</tr>
`;
        });

      });

      return rows;
    }

    // tables
    const gamesTable = buildTable(['gp']);

    const hittingTable = buildTable(
      ['gp','pa','ab','h','1b','2b','3b','hr','rbi','r','bb','so','sb','cs','avg','obp','slg','ops'],
      ['avg','obp','slg','ops']
    );

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

/* HEADER */
.page-header {
  text-align:center;
  margin-bottom:10px;
}

.page-header h1 {
  margin:0;
  font-size:26px;
  color:#800000;
}

.page-header h2 {
  margin:0;
  font-size:16px;
}

.page-header h3 {
  margin:0;
  font-size:13px;
  color:#666;
}

/* buttons */
.button-bar {
  margin-bottom:10px;
  display:flex;
  gap:6px;
  flex-wrap:wrap;
}

.table-container {
  flex:1;
  overflow:auto;
}

/* TABLE */
table {
  border-collapse:collapse;
  width:max-content;
  font-size:12px;
}

thead th {
  position:sticky;
  top:0;
  background:#800000;
  color:#fff;
  padding:6px;
  text-align:center;
}

th.left {
  text-align:left;
}

td {
  padding:4px 6px;
  white-space:nowrap;
}

td.center {
  text-align:center;
}

td.left {
  text-align:left;
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

<div class="page-header">
  <h1>MANLY EAGLES BASEBALL</h1>
  <h2>HISTORICAL STATISTICS</h2>
  <h3>1950 - CURRENT DAY</h3>
</div>

<div class="button-bar">
  <a href="#games"><button>Total Games</button></a>
  <a href="#hitting"><button>Hitting</button></a>
</div>

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
<tr>
<th>#</th>
<th class="left">First</th>
<th class="left">Last</th>
<th>GP</th>
</tr>
</thead>
<tbody>${gamesTable}</tbody>
</table>

<h2 id="hitting">Hitting</h2>
<table>
<thead>
<tr>
<th>#</th>
<th class="left">First</th>
<th class="left">Last</th>
<th>GP</th><th>PA</th><th>AB</th><th>H</th>
<th>1B</th><th>2B</th><th>3B</th><th>HR</th>
<th>RBI</th><th>R</th><th>BB</th><th>SO</th>
<th>SB</th><th>CS</th>
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
