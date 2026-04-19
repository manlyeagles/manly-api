data.forEach((p) => {
  rows += `
    <tr>
      <td>${p.jersey_number || ''}</td>
      <td>${p.players?.first_name || ''} ${p.players?.last_name || ''}</td>
      <td>${p.players?.grade || ''}</td>
      <td>${p.seasons?.season_name || ''}</td>

      <td>${formatStat('PA', p.PA)}</td>
      <td>${formatStat('AB', p.AB)}</td>
      <td>${formatStat('H', p.H)}</td>
      <td>${formatStat('1B', p['1B'])}</td>
      <td>${formatStat('2B', p['2B'])}</td>
      <td>${formatStat('3B', p['3B'])}</td>
      <td>${formatStat('HR', p.HR)}</td>
      <td>${formatStat('RBI', p.RBI)}</td>
      <td>${formatStat('R', p.R)}</td>
      <td>${formatStat('BB', p.BB)}</td>
      <td>${formatStat('HBP', p.HBP)}</td>
      <td>${formatStat('SO', p.SO)}</td>

      <td>${formatStat('AVG', p.AVG)}</td>
      <td>${formatStat('OBP', p.OBP)}</td>
      <td>${formatStat('SLG', p.SLG)}</td>
      <td>${formatStat('OPS', p.OPS)}</td>

      <td>${formatStat('SB', p.SB)}</td>
      <td>${formatStat('CS', p.CS)}</td>
    </tr>
  `;
});
