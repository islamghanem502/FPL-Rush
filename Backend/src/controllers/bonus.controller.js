const axios = require('axios');

// ── In-memory cache ────────────────────────────────────────────────────────────
const cache = {};
const CACHE_TTL        = 60  * 1000;  // 60 seconds  — live bonus data
const BOOTSTRAP_TTL    = 10  * 60 * 1000; // 10 minutes — teams / GW rarely change

// ── FPL API headers (mimic browser) ───────────────────────────────────────────
const FPL_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept': 'application/json',
  'Accept-Language': 'en-US,en;q=0.9',
  'Referer': 'https://fantasy.premierleague.com/',
  'Origin': 'https://fantasy.premierleague.com',
};

// ── Helper: fetch bootstrap-static (cached) ────────────────────────────────────
async function fetchBootstrap() {
  const KEY = 'bootstrap';
  if (cache[KEY] && Date.now() - cache[KEY].timestamp < BOOTSTRAP_TTL) {
    return cache[KEY].data;
  }
  const { data } = await axios.get(
    'https://fantasy.premierleague.com/api/bootstrap-static/',
    { headers: FPL_HEADERS }
  );
  cache[KEY] = { timestamp: Date.now(), data };
  return data;
}

// ── BPS Bonus Ranking Logic ────────────────────────────────────────────────────
// Given an array of { element, bps } → returns array of { element, bonus }
// Tie logic: if two players tie for 1st they both get 3, next eligible gets 1
function calculateBonusFromBPS(bpsPlayers) {
  if (!bpsPlayers || bpsPlayers.length === 0) return [];

  // Sort descending by BPS
  const sorted = [...bpsPlayers].sort((a, b) => b.bps - a.bps);

  const result = [];
  const bonusValues = [3, 2, 1];
  let bonusIdx = 0;
  let i = 0;

  while (bonusIdx < bonusValues.length && i < sorted.length) {
    const currentBPS = sorted[i].bps;
    if (currentBPS === 0) break;

    // Find all players with the same BPS (ties)
    const tied = [];
    while (i < sorted.length && sorted[i].bps === currentBPS) {
      tied.push(sorted[i]);
      i++;
    }

    // Assign the HIGHEST remaining bonus to all tied players
    const bonusToAssign = bonusValues[bonusIdx];
    tied.forEach((p) => result.push({ element: p.element, bonus: bonusToAssign, bps: p.bps }));

    // Skip as many bonus slots as there were tied players
    bonusIdx += tied.length;
  }

  return result;
}

// ── Main Controller ────────────────────────────────────────────────────────────
exports.getLiveBonus = async (req, res) => {
  const event = parseInt(req.params.event, 10);

  if (!event || isNaN(event) || event < 1 || event > 38) {
    return res.status(400).json({ error: 'Invalid gameweek. Must be between 1 and 38.' });
  }

  // ── Cache check ──────────────────────────────────────────────────────────────
  const cacheKey = `bonus_gw_${event}`;
  if (cache[cacheKey] && Date.now() - cache[cacheKey].timestamp < CACHE_TTL) {
    console.log(`[BonusCache] HIT — GW${event}`);
    return res.json(cache[cacheKey].data);
  }
  console.log(`[BonusCache] MISS — fetching GW${event} from FPL API`);

  try {
    // ── Fetch both FPL endpoints in parallel ────────────────────────────────────
    const [fixturesRes, liveRes] = await Promise.all([
      axios.get(`https://fantasy.premierleague.com/api/fixtures/?event=${event}`, { headers: FPL_HEADERS }),
      axios.get(`https://fantasy.premierleague.com/api/event/${event}/live/`, { headers: FPL_HEADERS }),
    ]);

    const fixtures = fixturesRes.data;        // array of fixture objects
    const liveData = liveRes.data.elements;   // array of { id, stats, explain }

    // Build a quick lookup: elementId → live stats
    const liveMap = {};
    liveData.forEach((el) => {
      liveMap[el.id] = el.stats;
    });

    // ── Process each fixture ───────────────────────────────────────────────────
    const processedFixtures = fixtures.map((fixture) => {
      const {
        id,
        code,
        team_h,
        team_a,
        team_h_score,
        team_a_score,
        started,
        finished,
        finished_provisional,
        minutes,
        kickoff_time,
        stats,      // contains official bonus from fixtures endpoint
        pulse_id,
      } = fixture;

      // Determine match status
      let status = 'scheduled';
      if (finished || finished_provisional) status = 'finished';
      else if (started) status = 'live';

      // ── Bonus data ────────────────────────────────────────────────────────────
      let bonusData = [];
      let hasOfficialBonus = false;

      if (status === 'finished') {
        // ── Official bonus from fixtures endpoint ─────────────────────────────
        const bonusStat = stats?.find((s) => s.identifier === 'bonus');
        if (bonusStat) {
          const combined = [
            ...(bonusStat.h || []).map((p) => ({ ...p, side: 'h' })),
            ...(bonusStat.a || []).map((p) => ({ ...p, side: 'a' })),
          ];
          if (combined.length > 0) {
            hasOfficialBonus = true;
            bonusData = combined.map((p) => ({
              element: p.element,
              bonus: p.value,
              bps: liveMap[p.element]?.bps ?? null,
            }));
          }
        }
      } 
      
      if (!hasOfficialBonus) {
        // ── Expected bonus from live BPS (For live, scheduled, or newly finished matches) ─
        const bpsStat = stats?.find((s) => s.identifier === 'bps');
        if (bpsStat) {
          const fixturePlayerBPS = [
            ...(bpsStat.h || []),
            ...(bpsStat.a || [])
          ].map(p => ({ element: p.element, bps: p.value }));

          const calculatedBonus = calculateBonusFromBPS(fixturePlayerBPS);
          bonusData = calculatedBonus.map((p) => ({
            element: p.element,
            bonus: p.bonus,
            bps: p.bps,
          }));
        }
      }

      // Sort bonus data: highest bonus first, then highest BPS
      bonusData.sort((a, b) => b.bonus - a.bonus || (b.bps ?? 0) - (a.bps ?? 0));

      return {
        id,
        code,
        team_h,
        team_a,
        team_h_score,
        team_a_score,
        started,
        finished,
        finished_provisional,
        minutes,
        kickoff_time,
        status,
        bonus: bonusData.slice(0, 10), // top 10 is enough for display
      };
    });

    const responseData = {
      event,
      updated_at: new Date().toISOString(),
      fixtures: processedFixtures,
    };

    // ── Store in cache ─────────────────────────────────────────────────────────
    cache[cacheKey] = { timestamp: Date.now(), data: responseData };

    return res.json(responseData);
  } catch (err) {
    console.error('[BonusController] Error:', err.message);
    // If we have stale cache, serve it rather than failing
    if (cache[cacheKey]) {
      console.warn('[BonusCache] Serving stale cache due to error.');
      return res.json({ ...cache[cacheKey].data, stale: true });
    }
    return res.status(502).json({ error: 'Failed to fetch data from FPL API.', detail: err.message });
  }
};

// ── GET /api/bonus/current-gw ─────────────────────────────────────────────────
exports.getCurrentGW = async (req, res) => {
  try {
    const bootstrap = await fetchBootstrap();
    const currentGW = bootstrap.events?.find((e) => e.is_current)?.id
      || bootstrap.events?.find((e) => e.is_next)?.id
      || 1;
    return res.json({ currentGW });
  } catch (err) {
    console.error('[getCurrentGW] Error:', err.message);
    return res.status(502).json({ error: 'Failed to fetch GW from FPL API.', detail: err.message });
  }
};

// ── GET /api/bonus/teams ───────────────────────────────────────────────────────
// Returns a map { teamId: { name, short_name } } for all 20 PL teams
exports.getBootstrapTeams = async (req, res) => {
  try {
    const bootstrap = await fetchBootstrap();
    const teamsMap = {};
    bootstrap.teams?.forEach((t) => {
      teamsMap[t.id] = { name: t.name, short_name: t.short_name, code: t.code };
    });
    const elementsMap = {};
    bootstrap.elements?.forEach((el) => {
      elementsMap[el.id] = {
        web_name: el.web_name,
        team: el.team,
      };
    });
    return res.json({ teams: teamsMap, players: elementsMap });
  } catch (err) {
    console.error('[getBootstrapTeams] Error:', err.message);
    return res.status(502).json({ error: 'Failed to fetch teams from FPL API.', detail: err.message });
  }
};
