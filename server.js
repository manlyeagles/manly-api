const express = require('express');
const app = express();

const SUPABASE_URL = 'https://rtmzihkxiwiilxytahre.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ZG0Uq-sVDa0aFI1zkVHZiw_wBBNYpA4';

const formatStat = (key, value) => {
  if (value === null || value === undefined) return '';
  const num = Number(value);
  if (['avg','obp','slg','ops','bawrisp','qabpct','babip','sbpct'].includes(key)) {
    return num.toFixed(3);
  }
  return num;
};

app.get('/leaderboard/view', async (req, res) => {
  try {
    const stat = (req.query.stat || 'avg').toLowerCase();
    const order = req.query.order === 'asc' ? 'asc' : 'desc';
    const season = req.query.season || '2025/26';

    const url = `${SUPABASE_URL}/rest/v1/player_season_stats?season_id=eq.${encodeURIComponent(season)}&select=*,players!inner(first_name,last_name)&order=${stat}.${order}`;

    const response = await fetch(url, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`
      }
    });

    const data = await response.json();
    if (!Array.isArray(data)) return res.send(JSON.stringify(data));

    const toggle = (col) => (stat === col && order === 'desc') ? 'asc' : 'desc';
    const link = (col, label = col.toUpperCase()) =>
      `<a href="?stat=${encodeURIComponent(col)}&order=${toggle(col)}&season=${season}" style="color:white;text-decoration:none;">${label}</a>`;

    let rows = '';

    data.forEach((p) => {
      rows += `
<tr>
<td class="jersey">${p.jersey_number || ''}</td>
<td class="name">${p.players?.first_name || ''}</td>
<td class="name">${p.players?.last_name || ''}</td>
<td>${p.season_id}</td>
<td>${p.grade || ''}</td>

<td>${p.gp || 0}</td>
<td>${p.pa || 0}</td>
<td>${p.ab || 0}</td>
<td>${p.h || 0}</td>
<td>${p["1B"] || 0}</td>
<td>${p["2B"] || 0}</td>
<td>${p["3B"] || 0}</td>
<td>${p.hr || 0}</td>
<td>${p.rbi || 0}</td>
<td>${p.r || 0}</td>
<td>${p.so || 0}</td>
<td>${p.kl || 0}</td>
<td>${p.bb || 0}</td>
<td>${p.hbp || 0}</td>
<td>${p.roe || 0}</td>
<td>${p.fc || 0}</td>

<td>${formatStat('avg', p.avg)}</td>
<td>${formatStat('obp', p.obp)}</td>
<td>${formatStat('slg', p.slg)}</td>
<td>${formatStat('ops', p.ops)}</td>
<td>${formatStat('bawrisp', p.bawrisp)}</td>

<td>${p.sac || 0}</td>
<td>${p.sf || 0}</td>
<td>${p.lob || 0}</td>
<td>${p.pik || 0}</td>
<td>${p.qab || 0}</td>
<td>${formatStat('qabpct', p.qabpct)}</td>
<td>${formatStat('babip', p.babip)}</td>

<td>${p.sb || 0}</td>
<td>${p.cs || 0}</td>
<td>${formatStat('sbpct', p.sbpct)}</td>
</tr>
`;
    });

    res.send(`
<html>
<head>
<style>
body { margin:0; font-family:Arial; }

.table-container {
  width:100vw;
  height:calc(100vh - 60px);
  overflow:auto;
}

table {
  border-collapse: collapse;
  table-layout: fixed;
  width: max-content;
  font-size:13px;
}

thead th {
  position: sticky;
  top: 0;
  z-index: 100;
  background:#800000;
  color:#fff;
  padding:10px;
  white-space:nowrap;
}

tbody td {
  padding:6px 10px;
  white-space:nowrap;
  background:#fff;
}

tbody tr:nth-child(even) td { background:#fafafa; }

.name { text-align:left; }
.jersey { font-weight:bold; }

/* LOCKED COLUMNS */
th:nth-child(1), td:nth-child(1) { position:sticky; left:0; z-index:50; }
th:nth-child(2), td:nth-child(2) { position:sticky; left:70px; z-index:50; }
th:nth-child(3), td:nth-child(3) { position:sticky; left:190px; z-index:50; }

thead th:nth-child(1),
thead th:nth-child(2),
thead th:nth-child(3) {
  background:#800000;
  z-index:150;
}

tbody td:nth-child(1),
tbody td:nth-child(2),
tbody td:nth-child(3) {
  background:#fff;
  z-index:40;
}

/* remove bleed-through */
td, th { border-right:1px solid #ddd; }
</style>
</head>

<body>

<div style="padding:10px;">
<select onchange="location.href='?season='+this.value">
<option value="2025/26" ${season==='2025/26'?'selected':''}>2025/26</option>
<option value="2024/25" ${season==='2024/25'?'selected':''}>2024/25</option>
</select>
</div>

<div class="table-container">
<table>
<thead>
<tr>
<th>${link('jersey_number','#')}</th>
<th>${link('first_name','First')}</th>
<th>${link('last_name','Last')}</th>
<th>${link('season_id','Season')}</th>
<th>${link('grade','Grade')}</th>

<th>${link('gp')}</th>
<th>${link('pa')}</th>
<th>${link('ab')}</th>
<th>${link('h')}</th>
<th>${link('1B')}</th>
<th>${link('2B')}</th>
<th>${link('3B')}</th>
<th>${link('hr')}</th>
<th>${link('rbi')}</th>
<th>${link('r')}</th>
<th>${link('so')}</th>
<th>${link('kl')}</th>
<th>${link('bb')}</th>
<th>${link('hbp')}</th>
<th>${link('roe')}</th>
<th>${link('fc')}</th>

<th>${link('avg')}</th>
<th>${link('obp')}</th>
<th>${link('slg')}</th>
<th>${link('ops')}</th>
<th>${link('bawrisp')}</th>

<th>${link('sac')}</th>
<th>${link('sf')}</th>
<th>${link('lob')}</th>
<th>${link('pik')}</th>
<th>${link('qab')}</th>
<th>${link('qabpct')}</th>
<th>${link('babip')}</th>

<th>${link('sb')}</th>
<th>${link('cs')}</th>
<th>${link('sbpct')}</th>
</tr>
</thead>

<tbody>
${rows}
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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log("API running on port " + PORT));
