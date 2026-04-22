const express = require('express');
const app = express();

const SUPABASE_URL = 'https://rtmzihkxiwiilxytahre.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ZG0Uq-sVDa0aFI1zkVHZiw_wBBNYpA4';

async function safeFetchJson(url) {
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`
    }
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.message || 'Supabase request failed');
  }

  return json;
}

app.get('/leaderboard/games', async (req, res) => {
  try {
    const season = req.query.season || '';
    const grade = req.query.grade || '';

    let url = `${SUPABASE_URL}/rest/v1/player_season_stats?select=player_id,season_id,grade,gp,players(first_name,last_name)`;

    if (season) url += `&season_id=eq.${encodeURIComponent(season)}`;
    if (grade) url += `&grade=eq.${encodeURIComponent(grade)}`;

    const json = await safeFetchJson(url);
    let data = Array.isArray(json) ? json : json.data;

    if (!Array.isArray(data)) {
      return res.status(500).send('Invalid stats response');
    }

    const playersMap = {};
    const grades = ['First Grade', 'Second Grade', 'Third Grade', 'Under 18', 'Womens', 'Other'];

    data.forEach(p => {
      const id = Number(p.player_id);
      if (!id) return;

      if (!playersMap[id]) {
        playersMap[id] = {
          player_id: id,
          first_name: p.players?.first_name || p.first_name || '',
          last_name: p.players?.last_name || p.last_name || '',
          total_games: 0,
          seasons: {}
        };
      }

      const s = p.season_id || 'Unknown';
      const g = p.grade || 'Other';
      const gp = Number(p.gp) || 0;

      playersMap[id].total_games += gp;

      if (!playersMap[id].seasons[s]) playersMap[id].seasons[s] = {};
      if (!playersMap[id].seasons[s][g]) playersMap[id].seasons[s][g] = 0;

      playersMap[id].seasons[s][g] += gp;
    });

    let players = Object.values(playersMap)
      .sort((a, b) => b.total_games - a.total_games)
      .slice(0, 10);

    function buildGamesTable(players) {
      let rows = '';

      players.forEach((player, index) => {
        const gradeTotals = {};
        grades.forEach(g => gradeTotals[g] = 0);

        const seasons = Object.keys(player.seasons).sort();

        seasons.forEach(season => {
          Object.entries(player.seasons[season]).forEach(([g, v]) => {
            if (gradeTotals[g] !== undefined) gradeTotals[g] += v;
            else gradeTotals['Other'] += v;
          });
        });

        rows += `
<tr class="main-row" onclick="toggle('${player.player_id}')">
  <td class="center">${index + 1}</td>
  <td class="left">${player.first_name}</td>
  <td class="left">${player.last_name}</td>
  <td class="center"><b>${player.total_games}</b></td>
  ${grades.map(g => `<td class="center"><b>${gradeTotals[g] || ''}</b></td>`).join('')}
  <td class="center">${seasons.length}</td>
  <td class="center">${seasons[0] || ''}</td>
  <td class="center">${seasons[seasons.length - 1] || ''}</td>
</tr>
`;

        seasons.slice().reverse().forEach(season => {
          rows += `
<tr class="detail-${player.player_id}" style="display:none;">
  <td></td>
  <td colspan="2">${season}</td>
  <td></td>
  ${grades.map(g => `<td class="center">${player.seasons[season][g] || ''}</td>`).join('')}
  <td></td>
  <td></td>
  <td></td>
</tr>
`;
        });
      });

      return rows;
    }

    const gamesTable = buildGamesTable(players);

    res.send(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Top 10 Games Played</title>
  <style>
    html, body { margin:0; font-family: Arial, sans-serif; }
    body { padding: 20px; }
    h2 { margin-bottom: 12px; }

    .table-wrapper {
      overflow-x: auto;
    }

    table {
      border-collapse: collapse;
      width: 100%;
      min-width: 1000px;
    }

    th, td {
      border: 1px solid #ddd;
      padding: 6px 8px;
      font-size: 12px;
      white-space: nowrap;
    }

    th {
      background: #800000;
      color: white;
      text-align: center;
    }

    td.left { text-align: left; }
    td.center { text-align: center; }

    tbody tr:nth-child(even) td {
      background: #f7f7f7;
    }

    .main-row {
      cursor: pointer;
    }

    .main-row:hover td {
      background: #f0e6e6;
    }
  </style>

  <script>
    function toggle(id) {
      document.querySelectorAll('.detail-' + id).forEach(row => {
        row.style.display = row.style.display === 'none' ? 'table-row' : 'none';
      });
    }
  </script>
</head>
<body>
  <h2>Top 10 Games Played${season ? ` - ${season}` : ''}${grade ? ` (${grade})` : ''}</h2>

  <div class="table-wrapper">
    <table>
      <thead>
        <tr>
          <th>Rank</th>
          <th>First</th>
          <th>Last</th>
          <th>Total</th>
          <th>First</th>
          <th>Second</th>
          <th>Third</th>
          <th>U18</th>
          <th>Womens</th>
          <th>Other</th>
          <th># Seasons</th>
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
    console.error(err);
    res.status(500).send(err.message);
  }
});
app.get('/leaderboard/hitting', async (req, res) => {
  try {
    const season = req.query.season || '';
    const grade = req.query.grade || '';

    let url = `${SUPABASE_URL}/rest/v1/player_season_stats?select=player_id,season_id,grade,ab,h,avg,ops,players(first_name,last_name)`;

    if (season) url += `&season_id=eq.${encodeURIComponent(season)}`;
    if (grade) url += `&grade=eq.${encodeURIComponent(grade)}`;

    const json = await safeFetchJson(url);
    let data = Array.isArray(json) ? json : json.data;

    if (!Array.isArray(data)) {
      return res.status(500).send('Invalid stats response');
    }

    const playersMap = {};

    data.forEach(p => {
      const id = Number(p.player_id);
      if (!id) return;

      if (!playersMap[id]) {
        playersMap[id] = {
          player_id: id,
          first_name: p.players?.first_name || p.first_name || '',
          last_name: p.players?.last_name || p.last_name || '',
          ab: 0,
          h: 0,
          seasons: {}
        };
      }

      const s = p.season_id || 'Unknown';
      const g = p.grade || 'Other';
      const ab = Number(p.ab) || 0;
      const h = Number(p.h) || 0;

      playersMap[id].ab += ab;
      playersMap[id].h += h;

      if (!playersMap[id].seasons[s]) {
        playersMap[id].seasons[s] = {
          ab: 0,
          h: 0,
          grades: {}
        };
      }

      playersMap[id].seasons[s].ab += ab;
      playersMap[id].seasons[s].h += h;

      if (!playersMap[id].seasons[s].grades[g]) {
        playersMap[id].seasons[s].grades[g] = { ab: 0, h: 0 };
      }

      playersMap[id].seasons[s].grades[g].ab += ab;
      playersMap[id].seasons[s].grades[g].h += h;
    });

    let players = Object.values(playersMap)
      .map(p => ({
        ...p,
        avg: p.ab > 0 ? p.h / p.ab : 0
      }))
      .filter(p => p.ab >= 10)
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 10);

    function formatAvg(value) {
      return value ? value.toFixed(3).replace(/^0/, '') : '.000';
    }

    function buildHittingTable(players) {
      let rows = '';

      players.forEach((player, index) => {
        const seasons = Object.keys(player.seasons).sort();

        rows += `
<tr class="main-row" onclick="toggle('${player.player_id}')">
  <td class="center">${index + 1}</td>
  <td class="left">${player.first_name}</td>
  <td class="left">${player.last_name}</td>
  <td class="center">${player.ab}</td>
  <td class="center">${player.h}</td>
  <td class="center"><b>${formatAvg(player.avg)}</b></td>
  <td class="center">${seasons.length}</td>
  <td class="center">${seasons[0] || ''}</td>
  <td class="center">${seasons[seasons.length - 1] || ''}</td>
</tr>
`;

        seasons.slice().reverse().forEach(season => {
          const s = player.seasons[season];
          const seasonAvg = s.ab > 0 ? s.h / s.ab : 0;

          rows += `
<tr class="detail-${player.player_id}" style="display:none;">
  <td></td>
  <td colspan="2">${season}</td>
  <td class="center">${s.ab}</td>
  <td class="center">${s.h}</td>
  <td class="center">${formatAvg(seasonAvg)}</td>
  <td></td>
  <td></td>
  <td></td>
</tr>
`;
        });
      });

      return rows;
    }

    const hittingTable = buildHittingTable(players);

    res.send(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Top 10 Batting Average</title>
  <style>
    html, body { margin:0; font-family: Arial, sans-serif; }
    body { padding: 20px; }
    h2 { margin-bottom: 12px; }

    .table-wrapper { overflow-x: auto; }

    table {
      border-collapse: collapse;
      width: 100%;
      min-width: 900px;
    }

    th, td {
      border: 1px solid #ddd;
      padding: 6px 8px;
      font-size: 12px;
      white-space: nowrap;
    }

    th {
      background: #800000;
      color: white;
      text-align: center;
    }

    td.left { text-align: left; }
    td.center { text-align: center; }

    tbody tr:nth-child(even) td {
      background: #f7f7f7;
    }

    .main-row { cursor: pointer; }
    .main-row:hover td { background: #f0e6e6; }
  </style>

  <script>
    function toggle(id) {
      document.querySelectorAll('.detail-' + id).forEach(row => {
        row.style.display = row.style.display === 'none' ? 'table-row' : 'none';
      });
    }
  </script>
</head>
<body>
  <h2>Top 10 Batting Average${season ? ` - ${season}` : ''}${grade ? ` (${grade})` : ''}</h2>
  <p>Minimum 10 at-bats</p>

  <div class="table-wrapper">
    <table>
      <thead>
        <tr>
          <th>Rank</th>
          <th>First</th>
          <th>Last</th>
          <th>AB</th>
          <th>H</th>
          <th>AVG</th>
          <th># Seasons</th>
          <th>First Year</th>
          <th>Last Year</th>
        </tr>
      </thead>
      <tbody>
        ${hittingTable}
      </tbody>
    </table>
  </div>
</body>
</html>
    `);
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

app.listen(3001, () => console.log('Server running'));


