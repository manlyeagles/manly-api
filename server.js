res.send(`
<html>
  <body style="font-family:Arial; margin:0; padding:0;">

    <!-- DROPDOWN -->
    <div style="padding:10px 0;">
      <select onchange="changeSeason(this.value)">
        <option value="1" ${season == 1 ? 'selected' : ''}>2025/26</option>
        <option value="2" ${season == 2 ? 'selected' : ''}>2024/25</option>
      </select>
    </div>

    <style>
      /* ALL YOUR CSS GOES HERE (move it here) */
    </style>

    <div class="table-container">
      <table>
        <thead>
          <!-- YOUR HEADERS -->
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>

    <script>
      function changeSeason(season) {
        const url = new URL(window.location.href);
        url.searchParams.set('season', season);
        window.location.href = url.toString();
      }
    </script>

  </body>
</html>
`);
