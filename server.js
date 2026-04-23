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
<tr class="main-row" data-player-id="${player.player_id}" onclick="toggle('${player.player_id}')">
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
<tr class="main-row" data-player-id="${player.player_id}" onclick="toggle('${player.player_id}')">
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

  function sortTable(tableId, colIndex, isNumeric = false) {
    const table = document.getElementById(tableId);
    const tbody = table.querySelector('tbody');
    const allRows = Array.from(tbody.querySelectorAll('tr'));

    const mainRows = allRows.filter(row => row.classList.contains('main-row'));

    const groups = mainRows.map(mainRow => {
      const playerId = mainRow.getAttribute('data-player-id');
      const detailRows = allRows.filter(r => r.classList.contains(`detail-${playerId}`));
      return { mainRow, detailRows };
    });

    const currentDir = table.getAttribute('data-sort-dir') || 'desc';
    const currentCol = table.getAttribute('data-sort-col');

    let newDir = 'asc';
    if (currentCol == colIndex && currentDir === 'asc') {
      newDir = 'desc';
    }

    groups.sort((a, b) => {
      let aText = a.mainRow.children[colIndex].innerText.trim();
      let bText = b.mainRow.children[colIndex].innerText.trim();

      if (isNumeric) {
        const aNum = parseFloat(aText.replace(/[^0-9.\-]/g, '')) || 0;
        const bNum = parseFloat(bText.replace(/[^0-9.\-]/g, '')) || 0;
        return newDir === 'asc' ? aNum - bNum : bNum - aNum;
      } else {
        return newDir === 'asc'
          ? aText.localeCompare(bText)
          : bText.localeCompare(aText);
      }
    });

    tbody.innerHTML = '';
    groups.forEach(group => {
      tbody.appendChild(group.mainRow);
      group.detailRows.forEach(detail => tbody.appendChild(detail));
    });

    table.setAttribute('data-sort-col', colIndex);
    table.setAttribute('data-sort-dir', newDir);
  }
</script>

</head>
<body>
  <h2>Top 10 Games Played${season ? ` - ${season}` : ''}${grade ? ` (${grade})` : ''}</h2>

  <div class="table-wrapper">
    <table id="leaderboardTable">
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

    let url = `${SUPABASE_URL}/rest/v1/player_season_stats?select=player_id,season_id,grade,gp,pa,ab,h,\"1B\",\"2B\",\"3B\",hr,rbi,r,so,kl,bb,hbp,roe,fc,ci,avg,obp,slg,ops,sac,sf,lob,pik,qab,qabpct,babip,sb,cs,sbpct,bawrisp,players(first_name,last_name)`;

    if (season) url += `&season_id=eq.${encodeURIComponent(season)}`;
    if (grade) {
      url += `&grade=eq.${encodeURIComponent(grade)}`;
    } else {
      url += `&grade=neq.Womens`;
    }

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
          gp: 0,
          pa: 0,
          ab: 0,
          h: 0,
          single: 0,
          double: 0,
          triple: 0,
          hr: 0,
          rbi: 0,
          r: 0,
          so: 0,
          kl: 0,
          bb: 0,
          hbp: 0,
          roe: 0,
          fc: 0,
          ci: 0,
          sac: 0,
          sf: 0,
          lob: 0,
          pik: 0,
          qab: 0,
          sb: 0,
          cs: 0,
          seasons: {}
        };
      }

      const gp = Number(p.gp) || 0;
      const pa = Number(p.pa) || 0;
      const ab = Number(p.ab) || 0;
      const h = Number(p.h) || 0;
      const single = Number(p["1B"]) || 0;
      const double = Number(p["2B"]) || 0;
      const triple = Number(p["3B"]) || 0;
      const hr = Number(p.hr) || 0;
      const rbi = Number(p.rbi) || 0;
      const r = Number(p.r) || 0;
      const so = Number(p.so) || 0;
      const kl = Number(p.kl) || 0;
      const bb = Number(p.bb) || 0;
      const hbp = Number(p.hbp) || 0;
      const roe = Number(p.roe) || 0;
      const fc = Number(p.fc) || 0;
      const ci = Number(p.ci) || 0;
      const sac = Number(p.sac) || 0;
      const sf = Number(p.sf) || 0;
      const lob = Number(p.lob) || 0;
      const pik = Number(p.pik) || 0;
      const qab = Number(p.qab) || 0;
      const sb = Number(p.sb) || 0;
      const cs = Number(p.cs) || 0;

      playersMap[id].gp += gp;
      playersMap[id].pa += pa;
      playersMap[id].ab += ab;
      playersMap[id].h += h;
      playersMap[id].single += single;
      playersMap[id].double += double;
      playersMap[id].triple += triple;
      playersMap[id].hr += hr;
      playersMap[id].rbi += rbi;
      playersMap[id].r += r;
      playersMap[id].so += so;
      playersMap[id].kl += kl;
      playersMap[id].bb += bb;
      playersMap[id].hbp += hbp;
      playersMap[id].roe += roe;
      playersMap[id].fc += fc;
      playersMap[id].ci += ci;
      playersMap[id].sac += sac;
      playersMap[id].sf += sf;
      playersMap[id].lob += lob;
      playersMap[id].pik += pik;
      playersMap[id].qab += qab;
      playersMap[id].sb += sb;
      playersMap[id].cs += cs;

      const s = p.season_id || 'Unknown';

      if (!playersMap[id].seasons[s]) {
        playersMap[id].seasons[s] = {
          gp: 0,
          pa: 0,
          ab: 0,
          h: 0,
          single: 0,
          double: 0,
          triple: 0,
          hr: 0,
          rbi: 0,
          r: 0,
          so: 0,
          kl: 0,
          bb: 0,
          hbp: 0,
          roe: 0,
          fc: 0,
          ci: 0,
          sac: 0,
          sf: 0,
          lob: 0,
          pik: 0,
          qab: 0,
          sb: 0,
          cs: 0
        };
      }

      playersMap[id].seasons[s].gp += gp;
      playersMap[id].seasons[s].pa += pa;
      playersMap[id].seasons[s].ab += ab;
      playersMap[id].seasons[s].h += h;
      playersMap[id].seasons[s].single += single;
      playersMap[id].seasons[s].double += double;
      playersMap[id].seasons[s].triple += triple;
      playersMap[id].seasons[s].hr += hr;
      playersMap[id].seasons[s].rbi += rbi;
      playersMap[id].seasons[s].r += r;
      playersMap[id].seasons[s].so += so;
      playersMap[id].seasons[s].kl += kl;
      playersMap[id].seasons[s].bb += bb;
      playersMap[id].seasons[s].hbp += hbp;
      playersMap[id].seasons[s].roe += roe;
      playersMap[id].seasons[s].fc += fc;
      playersMap[id].seasons[s].ci += ci;
      playersMap[id].seasons[s].sac += sac;
      playersMap[id].seasons[s].sf += sf;
      playersMap[id].seasons[s].lob += lob;
      playersMap[id].seasons[s].pik += pik;
      playersMap[id].seasons[s].qab += qab;
      playersMap[id].seasons[s].sb += sb;
      playersMap[id].seasons[s].cs += cs;
    });

    function formatAvg(value) {
      return value ? value.toFixed(3).replace(/^0/, '') : '.000';
    }

    function calcObp(h, bb, hbp, ab, sf) {
      const denom = ab + bb + hbp + sf;
      return denom > 0 ? (h + bb + hbp) / denom : 0;
    }

    function calcSlg(single, double, triple, hr, ab) {
      const tb = single + (double * 2) + (triple * 3) + (hr * 4);
      return ab > 0 ? tb / ab : 0;
    }

    let players = Object.values(playersMap)
      .map(p => {
        const avg = p.ab > 0 ? p.h / p.ab : 0;
        const obp = calcObp(p.h, p.bb, p.hbp, p.ab, p.sf);
        const slg = calcSlg(p.single, p.double, p.triple, p.hr, p.ab);
        const ops = obp + slg;
        return { ...p, avg, obp, slg, ops };
      })
      .filter(p => p.ab >= 10)
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 10);

    function buildHittingTable(players) {
      let rows = '';

      players.forEach((player, index) => {
        const seasons = Object.keys(player.seasons).sort();

        rows += `
<tr class="main-row" data-player-id="${player.player_id}" onclick="toggle('${player.player_id}')">
  <td class="center">${index + 1}</td>
  <td class="left">${player.first_name}</td>
  <td class="left">${player.last_name}</td>
  <td class="center">${player.gp}</td>
  <td class="center">${player.pa}</td>
  <td class="center">${player.ab}</td>
  <td class="center">${player.h}</td>
  <td class="center">${player.single}</td>
  <td class="center">${player.double}</td>
  <td class="center">${player.triple}</td>
  <td class="center">${player.hr}</td>
  <td class="center">${player.rbi}</td>
  <td class="center">${player.r}</td>
  <td class="center">${player.bb}</td>
  <td class="center">${player.so}</td>
  <td class="center"><b>${formatAvg(player.avg)}</b></td>
  <td class="center">${formatAvg(player.obp)}</td>
  <td class="center">${formatAvg(player.slg)}</td>
  <td class="center">${formatAvg(player.ops)}</td>
  <td class="center">${player.sb}</td>
  <td class="center">${player.cs}</td>
  <td class="center">${seasons.length}</td>
  <td class="center">${seasons[0] || ''}</td>
  <td class="center">${seasons[seasons.length - 1] || ''}</td>
</tr>
`;

        seasons.slice().reverse().forEach(season => {
          const s = player.seasons[season];
          const avg = s.ab > 0 ? s.h / s.ab : 0;
          const obp = calcObp(s.h, s.bb, s.hbp, s.ab, s.sf);
          const slg = calcSlg(s.single, s.double, s.triple, s.hr, s.ab);
          const ops = obp + slg;

          rows += `
<tr class="main-row" data-player-id="${player.player_id}" onclick="toggle('${player.player_id}')">
  <td></td>
  <td colspan="2">${season}</td>
  <td class="center">${s.gp}</td>
  <td class="center">${s.pa}</td>
  <td class="center">${s.ab}</td>
  <td class="center">${s.h}</td>
  <td class="center">${s.single}</td>
  <td class="center">${s.double}</td>
  <td class="center">${s.triple}</td>
  <td class="center">${s.hr}</td>
  <td class="center">${s.rbi}</td>
  <td class="center">${s.r}</td>
  <td class="center">${s.bb}</td>
  <td class="center">${s.so}</td>
  <td class="center">${formatAvg(avg)}</td>
  <td class="center">${formatAvg(obp)}</td>
  <td class="center">${formatAvg(slg)}</td>
  <td class="center">${formatAvg(ops)}</td>
  <td class="center">${s.sb}</td>
  <td class="center">${s.cs}</td>
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
    table { border-collapse: collapse; width: 100%; min-width: 1700px; }
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
    tbody tr:nth-child(even) td { background: #f7f7f7; }
    .main-row { cursor: pointer; }
    .main-row:hover td { background: #f0e6e6; }
  </style>
  <script>
  function toggle(id) {
    document.querySelectorAll('.detail-' + id).forEach(row => {
      row.style.display = row.style.display === 'none' ? 'table-row' : 'none';
    });
  }

  function sortTable(tableId, colIndex, isNumeric = false) {
    const table = document.getElementById(tableId);
    const tbody = table.querySelector('tbody');
    const allRows = Array.from(tbody.querySelectorAll('tr'));

    const mainRows = allRows.filter(row => row.classList.contains('main-row'));

    const groups = mainRows.map(mainRow => {
      const playerId = mainRow.getAttribute('data-player-id');
      const detailRows = allRows.filter(r => r.classList.contains(`detail-${playerId}`));
      return { mainRow, detailRows };
    });

    const currentDir = table.getAttribute('data-sort-dir') || 'desc';
    const currentCol = table.getAttribute('data-sort-col');

    let newDir = 'asc';
    if (currentCol == colIndex && currentDir === 'asc') {
      newDir = 'desc';
    }

    groups.sort((a, b) => {
      let aText = a.mainRow.children[colIndex].innerText.trim();
      let bText = b.mainRow.children[colIndex].innerText.trim();

      if (isNumeric) {
        const aNum = parseFloat(aText.replace(/[^0-9.\-]/g, '')) || 0;
        const bNum = parseFloat(bText.replace(/[^0-9.\-]/g, '')) || 0;
        return newDir === 'asc' ? aNum - bNum : bNum - aNum;
      } else {
        return newDir === 'asc'
          ? aText.localeCompare(bText)
          : bText.localeCompare(aText);
      }
    });

    tbody.innerHTML = '';
    groups.forEach(group => {
      tbody.appendChild(group.mainRow);
      group.detailRows.forEach(detail => tbody.appendChild(detail));
    });

    table.setAttribute('data-sort-col', colIndex);
    table.setAttribute('data-sort-dir', newDir);
  }
</script>

</head>
<body>
 <h2>Top 10 Batting Average${season ? ` - ${season}` : ''}${grade ? ` (${grade})` : ''}</h2>
  
  <div class="table-wrapper">
    <table id="leaderboardTable">
      <thead>
        <tr>
          <tr>
  <th onclick="sortTable('leaderboardTable', 0, true)">Rank</th>
  <th onclick="sortTable('leaderboardTable', 1, false)">First</th>
  <th onclick="sortTable('leaderboardTable', 2, false)">Last</th>
  <th onclick="sortTable('leaderboardTable', 3, true)">GP</th>
  <th onclick="sortTable('leaderboardTable', 4, true)">PA</th>
  <th onclick="sortTable('leaderboardTable', 5, true)">AB</th>
  <th onclick="sortTable('leaderboardTable', 6, true)">H</th>
  <th onclick="sortTable('leaderboardTable', 7, true)">1B</th>
  <th onclick="sortTable('leaderboardTable', 8, true)">2B</th>
  <th onclick="sortTable('leaderboardTable', 9, true)">3B</th>
  <th onclick="sortTable('leaderboardTable', 10, true)">HR</th>
  <th onclick="sortTable('leaderboardTable', 11, true)">RBI</th>
  <th onclick="sortTable('leaderboardTable', 12, true)">R</th>
  <th onclick="sortTable('leaderboardTable', 13, true)">BB</th>
  <th onclick="sortTable('leaderboardTable', 14, true)">SO</th>
  <th onclick="sortTable('leaderboardTable', 15, true)">AVG</th>
  <th onclick="sortTable('leaderboardTable', 16, true)">OBP</th>
  <th onclick="sortTable('leaderboardTable', 17, true)">SLG</th>
  <th onclick="sortTable('leaderboardTable', 18, true)">OPS</th>
  <th onclick="sortTable('leaderboardTable', 19, true)">SB</th>
  <th onclick="sortTable('leaderboardTable', 20, true)">CS</th>
  <th onclick="sortTable('leaderboardTable', 21, true)">#S</th>
  <th onclick="sortTable('leaderboardTable', 22, false)">First Year</th>
  <th onclick="sortTable('leaderboardTable', 23, false)">Last Year</th>
</tr>

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


