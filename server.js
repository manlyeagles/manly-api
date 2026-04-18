const response = await fetch(
  `${SUPABASE_URL}/rest/v1/player_advanced_stats?select=player_code,first_name,last_name,grade,pa,avg&order=avg.desc`,
  {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`
    }
  }
);
