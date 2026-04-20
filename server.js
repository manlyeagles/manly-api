const express = require('express');
const app = express();

const SUPABASE_URL = 'https://rtmzihkxiwiilxytahre.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ZG0Uq-sVDa0aFI1zkVHZiw_wBBNYpA4';

app.get('/leaderboard/view', async (req, res) => {
  try {
    const season = req.query.season || '';
    const grade = req.query.grade || '';
    const search = req.query.search || '';

    const format3 = v => (v ? Number(v).toFixed(3) : '');

    // seasons dropdown
    const seasonsRes = await fetch(`${SUPABASE_URL}/rest/v1/seasons?select=season_name,season_num&order=season_num.asc`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    });
    const seasons = await seasonsRes.json();

    const seasonOptions = `
      <option value="">All Seasons</option>
      ${seasons.map(s => `<option value="${s.season_name}" ${season===s.season_name?'selected':''}>${s.season_name}</option>`).join('')}
    `;

    // data query
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
    const playersMap = {};

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
    // ✅ GAMES TABLE (NEW)
    // =========================
    function buildGamesTable(players) {

      const grades = ['First Grade','Second Grade','Third Grade','Under 18','Womens','Other'];
      let rows = '';

      players.forEach(player => {

        const totalGames = player.seasons.reduce((sum,s)=>sum+(Number(s.gp)||0),0);

        rows += `
<tr class="main-row" onclick="toggle('${player.player_id}')">
  <td class="center">${player.jersey||''}</td>
  <td class="left">${player.first_name}</td>
  <td class="left">${player.last_name}</td>
  <td class="center"><b>${totalGames}</b></td>
</tr>
`;

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
</tr>
`;
        });

      });

      return rows;
    }

    // =========================
    // ✅ HITTING TABLE
    // =========================
    function buildHittingTable(players){

      const cols = ['gp','pa','ab','h','1b','2b','3b','hr','rbi','r','bb','so','sb','cs','avg','obp','slg','ops'];
      const avgCols = ['avg','obp','slg','ops'];

      let rows='';

      players.forEach(player=>{

        const totals={};

        cols.forEach(c=>{
          if(avgCols.includes(c)){
            const vals=player.seasons.map(s=>Number(s[c])||0);
            totals[c]=vals.length?(vals.reduce((a,b)=>a+b,0)/vals.length):0;
          } else {
            totals[c]=player.seasons.reduce((sum,s)=>sum+(Number(s[c])||0),0);
          }
        });

        rows+=`
<tr class="main-row" onclick="toggle('${player.player_id}')">
<td class="center">${player.jersey||''}</td>
<td class="left">${player.first_name}</td>
<td class="left">${player.last_name}</td>
${cols.map(c=>`<td class="center"><b>${avgCols.includes(c)?format3(totals[c]):totals[c]}</b></td>`).join('')}
</tr>
`;

        player.seasons.forEach(s=>{
          rows+=`
<tr class="detail-${player.player_id}" style="display:none;">
<td></td>
<td colspan="2">${s.season_id} - ${s.grade}</td>
${cols.map(c=>`<td class="center">${avgCols.includes(c)?format3(s[c]):(s[c]||0)}</td>`).join('')}
</tr>
`;
        });

      });

      return rows;
    }

    const gamesTable = buildGamesTable(players);
    const hittingTable = buildHittingTable(players);

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

<h2 id="games">Total Games</h2>
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
