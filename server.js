const express = require('express');
const app = express();

const SUPABASE_URL = 'https://rtmzihkxiwiilxytahre.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ZG0Uq-sVDa0aFI1zkVHZiw_wBBNYpA4';

app.get('/leaderboard/view', async (req, res) => {
  try {
    const season = req.query.season || '';
    const grade = req.query.grade || '';
    const search = req.query.search || '';

    // fetch seasons
    const seasonsRes = await fetch(`${SUPABASE_URL}/rest/v1/seasons?select=season_name,season_num&order=season_num.asc`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    });
    const seasons = await seasonsRes.json();

    const seasonOptions = `
      <option value="">All Seasons</option>
      ${seasons.map(s => `<option value="${s.season_name}" ${season===s.season_name?'selected':''}>${s.season_name}</option>`).join('')}
    `;

    // fetch stats
    let url = `${SUPABASE_URL}/rest/v1/player_season_stats?select=*,players!inner(first_name,last_name)`;

    if (season) url += `&season_id=eq.${encodeURIComponent(season)}`;
    if (grade) url += `&grade=eq.${encodeURIComponent(grade)}`;

    if (search) {
      const safe = search.replace(/[^a-zA-Z0-9]/g,'');
      url += `&or=(players.first_name.ilike.*${safe}*,players.last_name.ilike.*${safe}*,jersey_number.eq.${safe})`;
    }

    const resData = await fetch(url, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    });

    const data = await resData.json();

    // group players
  const players = Object.values(playersMap);

players.sort((a, b) => {
  const totalA = a.seasons.reduce((sum, s) => sum + (Number(s.gp) || 0), 0);
  const totalB = b.seasons.reduce((sum, s) => sum + (Number(s.gp) || 0), 0);
  return totalB - totalA;
});

// next code...

    data.forEach(p => {
      if (!playersMap[p.player_id]) {
        playersMap[p.player_id] = {
          player_id: p.player_id,
          first_name: p.players?.first_name,
          last_name: p.players?.last_name,
          jersey: p.jersey_number,
          seasons: []
        };
      }
      playersMap[p.player_id].seasons.push(p);
    });

    const players = Object.values(playersMap);

    // =========================
    // ✅ FIXED GAMES TABLE
    // =========================
    function buildGamesTable(players) {

  const grades = [
    'First Grade',
    'Second Grade',
    'Third Grade',
    'Under 18',
    'Womens',
    'Other'
  ];

  let rows = '';

  players.forEach(player => {

    // grade totals
    const gradeTotals = {};
    grades.forEach(g => gradeTotals[g] = 0);

    const seasonSet = new Set();

    player.seasons.forEach(s => {
      seasonSet.add(s.season_id);

      if (gradeTotals[s.grade] !== undefined) {
        gradeTotals[s.grade] += Number(s.gp) || 0;
      } else {
        gradeTotals['Other'] += Number(s.gp) || 0;
      }
    });

    const totalGames = Object.values(gradeTotals).reduce((a,b)=>a+b,0);

    // NEW CALCULATIONS
    const seasonsArray = Array.from(seasonSet).sort();

    const seasonsPlayed = seasonsArray.length;
    const firstYear = seasonsArray[0] || '';
    const lastYear = seasonsArray[seasonsArray.length - 1] || '';

    // MAIN ROW
    rows += `
<tr class="main-row" onclick="toggle('${player.player_id}')">
  <td class="center">${player.jersey||''}</td>
  <td class="left">${player.first_name}</td>
  <td class="left">${player.last_name}</td>

  <td class="center"><b>${totalGames}</b></td>

  ${grades.map(g=>`<td class="center"><b>${gradeTotals[g] || ''}</b></td>`).join('')}

  <td class="center"><b>${seasonsPlayed}</b></td>
  <td class="center"><b>${firstYear}</b></td>
  <td class="center"><b>${lastYear}</b></td>
</tr>
`;

    // season rows
    const seasonsMap = {};

    player.seasons.forEach(s=>{
      if(!seasonsMap[s.season_id]) seasonsMap[s.season_id]={};
      seasonsMap[s.season_id][s.grade]=(seasonsMap[s.season_id][s.grade]||0)+(Number(s.gp)||0);
    });

    Object.keys(seasonsMap).sort().reverse().forEach(season=>{
      rows += `
<tr class="detail-${player.player_id}" style="display:none;">
  <td></td>
  <td colspan="2">${season}</td>
  <td></td>
  ${grades.map(g=>`<td class="center">${seasonsMap[season][g]||''}</td>`).join('')}
  <td></td><td></td><td></td>
</tr>
`;
    });

  });

  return rows;
}

    const gamesTable = buildGamesTable(players);

    // =========================
    // HTML
    // =========================
    res.send(`
<html>
<head>
<style>
html,body{margin:0;height:100%;font-family:Arial;}

.wrapper{height:100vh;display:flex;flex-direction:column;}

.controls{padding:10px;border-bottom:1px solid #ddd;}

.page-header{text-align:center;margin-bottom:10px;}
.page-header h1{margin:0;color:#800000;font-size:26px;}
.page-header h2{margin:0;font-size:16px;}
.page-header h3{margin:0;font-size:13px;color:#666;}

.table-container{flex:1;overflow:auto;}

table{border-collapse:collapse;width:max-content;font-size:12px;}

thead th{
position:sticky;top:0;background:#800000;color:#fff;
padding:6px;text-align:center;
}

th.left{text-align:left;}

td{padding:4px 6px;white-space:nowrap;}
td.center{text-align:center;}
td.left{text-align:left;}

tr:nth-child(even) td{background:#f5f5f5;}

.main-row{background:#eef;cursor:pointer;font-weight:bold;}
</style>

<script>
function toggle(id){
document.querySelectorAll('.detail-'+id)
.forEach(r=>r.style.display=r.style.display==='none'?'table-row':'none');
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
<tbody>${gamesTable}</tbody>
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
