const express = require('express');
const app = express();

const SUPABASE_URL = 'https://rtmzihkxiwiilxytahre.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ZG0Uq-sVDa0aFI1zkVHZiw_wBBNYpA4';

app.get('/leaderboard/view', async (req, res) => {
  try {

    const season = req.query.season || '';
    const grade = req.query.grade || '';
    const search = req.query.search || '';

    // =========================
    // FETCH DATA
    // =========================
    let url = `${SUPABASE_URL}/rest/v1/player_season_stats?select=*,players!inner(first_name,last_name)`;

    if (season) url += `&season_id=eq.${encodeURIComponent(season)}`;
    if (grade) url += `&grade=eq.${encodeURIComponent(grade)}`;

    if (search) {
      const safe = search.replace(/[^a-zA-Z0-9]/g,'');
      url += `&or=(players.first_name.ilike.*${safe}*,players.last_name.ilike.*${safe}*)`;
    }

    const resData = await fetch(url, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`
      }
    });

    const data = await resData.json();

    // =========================
    // FETCH SEASONS (separate)
    // =========================
    const seasonsRes = await fetch(`${SUPABASE_URL}/rest/v1/seasons?select=season_name&order=season_name.desc`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`
      }
    });

    const seasons = await seasonsRes.json();

    const seasonOptions = `
      <option value="">All Seasons</option>
      ${seasons.map(s => `
        <option value="${s.season_name}" ${season===s.season_name?'selected':''}>
          ${s.season_name}
        </option>
      `).join('')}
    `;

    // =========================
    // GROUP DATA (correct)
    // =========================
    const playersMap = {};

    data.forEach(p => {
      const id = p.player_id;

      if (!playersMap[id]) {
        playersMap[id] = {
          player_id: id,
          first_name: p.players?.first_name,
          last_name: p.players?.last_name,
          jersey: p.jersey_number,
          seasons: {}
        };
      }

      const s = p.season_id;
      const g = p.grade || 'Other';

      if (!playersMap[id].seasons[s]) playersMap[id].seasons[s] = {};
      if (!playersMap[id].seasons[s][g]) playersMap[id].seasons[s][g] = 0;

      playersMap[id].seasons[s][g] += Number(p.gp) || 0;
    });

    let players = Object.values(playersMap);

    // =========================
    // SORT BY TOTAL GAMES
    // =========================
    players.sort((a,b)=>{
      const sum = obj => Object.values(obj.seasons)
        .flatMap(g=>Object.values(g))
        .reduce((x,y)=>x+y,0);

      return sum(b) - sum(a);
    });

    // =========================
    // BUILD TABLE
    // =========================
    function buildGamesTable(players){

      const grades = ['First Grade','Second Grade','Third Grade','Under 18','Womens','Other'];
      let rows = '';

      players.forEach(player => {

        const gradeTotals = {};
        grades.forEach(g => gradeTotals[g]=0);

        const seasons = Object.keys(player.seasons).sort();

        seasons.forEach(season=>{
          Object.entries(player.seasons[season]).forEach(([g,v])=>{
            if (gradeTotals[g] !== undefined) gradeTotals[g]+=v;
            else gradeTotals['Other']+=v;
          });
        });

        const total = Object.values(gradeTotals).reduce((a,b)=>a+b,0);

        rows += `
<tr class="main-row" onclick="toggle('${player.player_id}')">
<td class="center">${player.jersey||''}</td>
<td class="left">${player.first_name}</td>
<td class="left">${player.last_name}</td>
<td class="center"><b>${total}</b></td>

${grades.map(g=>`<td class="center"><b>${gradeTotals[g]||''}</b></td>`).join('')}

<td class="center">${seasons.length}</td>
<td class="center">${seasons[0]||''}</td>
<td class="center">${seasons[seasons.length-1]||''}</td>
</tr>
`;

        seasons.slice().reverse().forEach(season=>{
          rows += `
<tr class="detail-${player.player_id}" style="display:none;">
<td></td>
<td colspan="2">${season}</td>
<td></td>
${grades.map(g=>`<td class="center">${player.seasons[season][g]||''}</td>`).join('')}
<td></td><td></td><td></td>
</tr>
`;
        });

      });

      return rows;
    }

    const gamesTable = buildGamesTable(players);

    // =========================
    // OUTPUT HTML
    // =========================
    res.send(`
<html>
<head>
<style>
body { font-family: Arial; margin:0; }

.header { text-align:center; padding:10px; }

.controls { padding:10px; border-bottom:1px solid #ccc; }

.button-bar { margin-bottom:6px; display:flex; gap:6px; flex-wrap:wrap; }

.wrapper { height: calc(100vh - 140px); overflow:auto; }

table { border-collapse: collapse; width:max-content; min-width:1400px; }

th, td { padding:4px 6px; white-space:nowrap; }

thead th {
  position:sticky;
  top:0;
  background:#800000;
  color:white;
  text-align:center;
}

.left { text-align:left; }
.center { text-align:center; }

tr:nth-child(even) td { background:#f5f5f5; }

.main-row { background:#eef; cursor:pointer; font-weight:bold; }
</style>

<script>
function toggle(id){
  document.querySelectorAll('.detail-'+id)
    .forEach(r => r.style.display =
      r.style.display==='none' ? 'table-row' : 'none');
}
</script>
</head>

<body>

<div class="header">
<h1>MANLY EAGLES BASEBALL</h1>
<h2>HISTORICAL STATISTICS</h2>
<h3>1950 - CURRENT DAY</h3>
</div>

<div class="controls">

<div class="button-bar">
<button onclick="location.href='?grade='">All</button>
<button onclick="location.href='?grade=First Grade'">First</button>
<button onclick="location.href='?grade=Second Grade'">Second</button>
<button onclick="location.href='?grade=Third Grade'">Third</button>
<button onclick="location.href='?grade=Under 18'">U18</button>
<button onclick="location.href='?grade=Womens'">Womens</button>
<button onclick="location.href='?grade=Other'">Other</button>
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

<div class="wrapper">

<h2>Total Games</h2>

<table>
<thead>
<tr>
<th>#</th>
<th class="left">First</th>
<th class="left">Last</th>
<th>Total</th>
<th>First</th>
<th>Second</th>
<th>Third</th>
<th>U18</th>
<th>Womens</th>
<th>Other</th>
<th>Seasons</th>
<th>First Year</th>
<th>Last Year</th>
</tr>
</thead>

<tbody>
${gamesTable}
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

app.listen(3001, () => console.log("Server running"));
