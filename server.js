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
      url += `&or=(players.first_name.ilike.*${safe}*,players.last_name.ilike.*${safe}*,jersey_number.eq.${safe})`;
    }

    const resData = await fetch(url, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    });

    const data = await resData.json();

    // =========================
    // GROUP DATA PROPERLY
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

      const seasonKey = p.season_id;
      const gradeKey = p.grade || 'Other';

      if (!playersMap[id].seasons[seasonKey]) {
        playersMap[id].seasons[seasonKey] = {};
      }

      if (!playersMap[id].seasons[seasonKey][gradeKey]) {
        playersMap[id].seasons[seasonKey][gradeKey] = 0;
      }

      // ✅ THIS is the important part (prevents duplication issues)
      playersMap[id].seasons[seasonKey][gradeKey] += Number(p.gp) || 0;
    });

    let players = Object.values(playersMap);

    // =========================
    // SORT BY TOTAL GAMES DESC
    // =========================
    players.sort((a, b) => {
      const totalA = Object.values(a.seasons)
        .flatMap(g => Object.values(g))
        .reduce((x,y)=>x+y,0);

      const totalB = Object.values(b.seasons)
        .flatMap(g => Object.values(g))
        .reduce((x,y)=>x+y,0);

      return totalB - totalA;
    });

    // =========================
    // BUILD TABLE
    // =========================
    function buildGamesTable(players) {

      const grades = ['First Grade','Second Grade','Third Grade','Under 18','Womens','Other'];

      let rows = '';

      players.forEach(player => {

        const gradeTotals = {};
        grades.forEach(g => gradeTotals[g] = 0);

        const seasonKeys = Object.keys(player.seasons).sort();

        // calculate totals
        seasonKeys.forEach(season => {
          const gradesObj = player.seasons[season];

          Object.entries(gradesObj).forEach(([grade, value]) => {
            if (gradeTotals[grade] !== undefined) {
              gradeTotals[grade] += value;
            } else {
              gradeTotals['Other'] += value;
            }
          });
        });

        const totalGames = Object.values(gradeTotals).reduce((a,b)=>a+b,0);

        const seasonsPlayed = seasonKeys.length;
        const firstYear = seasonKeys[0] || '';
        const lastYear = seasonKeys[seasonKeys.length - 1] || '';

        // MAIN ROW
        rows += `
<tr class="main-row" onclick="toggle('${player.player_id}')">
<td class="center">${player.jersey || ''}</td>
<td class="left">${player.first_name}</td>
<td class="left">${player.last_name}</td>

<td class="center"><b>${totalGames}</b></td>

${grades.map(g=>`<td class="center"><b>${gradeTotals[g] || ''}</b></td>`).join('')}

<td class="center"><b>${seasonsPlayed}</b></td>
<td class="center"><b>${firstYear}</b></td>
<td class="center"><b>${lastYear}</b></td>
</tr>
`;

        // EXPANDED ROWS
        seasonKeys.slice().reverse().forEach(season => {

          rows += `
<tr class="detail-${player.player_id}" style="display:none;">
<td></td>
<td colspan="2">${season}</td>
<td></td>

${grades.map(g=>`<td class="center">${player.seasons[season][g] || ''}</td>`).join('')}

<td></td><td></td><td></td>
</tr>
`;
        });

      });

      return rows;
    }

    const gamesTable = buildGamesTable(players);

    // =========================
    // OUTPUT
    // =========================
    res.send(`
<html>
<head>
<style>
body { font-family: Arial; margin:0; }

.table-container { height:90vh; overflow:auto; }

table { border-collapse: collapse; width:max-content; }

th, td { padding:4px 6px; white-space:nowrap; }

thead th {
  position:sticky;
  top:0;
  background:#800000;
  color:#fff;
  text-align:center;
}

th.left, td.left { text-align:left; }
td.center { text-align:center; }

tr:nth-child(even) td { background:#f5f5f5; }

.main-row {
  background:#eef;
  font-weight:bold;
  cursor:pointer;
}
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

<h2 style="text-align:center;">MANLY EAGLES BASEBALL</h2>
<h3 style="text-align:center;">HISTORICAL STATISTICS</h3>
<h4 style="text-align:center;">1950 - CURRENT DAY</h4>

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
