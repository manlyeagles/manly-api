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

    data.forEach(p => {
      const id = Number(p.player_id);
      if (!id) return;

      if (!playersMap[id]) {
        playersMap[id] = {
          player_id: id,
          first_name: p.players?.first_name || p.first_name || '',
          last_name: p.players?.last_name || p.last_name || '',
          games: 0
        };
      }

      playersMap[id].games += Number(p.gp) || 0;
    });

    let players = Object.values(playersMap)
      .sort((a, b) => b.games - a.games)
      .slice(0, 10);

    const rows = players.map((p, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${p.first_name}</td>
        <td>${p.last_name}</td>
        <td>${p.games}</td>
      </tr>
    `).join('');

    res.send(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Top 10 Games Played</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h2 { margin-bottom: 12px; }
    table { border-collapse: collapse; width: 100%; max-width: 700px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background: #800000; color: white; }
    tr:nth-child(even) { background: #f7f7f7; }
  </style>
</head>
<body>
  <h2>Top 10 Games Played${season ? ` - ${season}` : ''}${grade ? ` (${grade})` : ''}</h2>
  <table>
    <thead>
      <tr>
        <th>Rank</th>
        <th>First</th>
        <th>Last</th>
        <th>Games</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>
</body>
</html>
    `);
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});




