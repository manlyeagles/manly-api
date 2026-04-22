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
          <th>1G</th>
          <th>2G</th>
          <th>3G</th>
          <th>U18</th>
          <th>W</th>
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


