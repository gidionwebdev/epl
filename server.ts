import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio';
import { createServer as createViteServer } from 'vite';
import { resolveClub, getVerifiedBadgeUrl, ALL_PREMIER_LEAGUE_CLUBS } from './src/data/clubs';
import { getFallbackStandings, getFallbackStatsOverview } from './src/data/canonicalStats';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory cache structures with TTL
const fixturesCache = new Map<string, { data: any; expiresAt: number }>();
const tablesCache = new Map<string, { data: any; expiresAt: number }>();
const statsCache = new Map<string, { data: any; expiresAt: number }>();

async function fetchWithTimeout(url: string, options: any = {}, timeoutMs = 6500) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    return response;
  } finally {
    clearTimeout(id);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // In-memory caches
  const seasonGameweeksCache: Record<number, any[]> = {};
  const seasonSquadsCache: Record<number, Record<string, { id: string; name: string; shortName: string; abbr: string; badgeUrl: string }>> = {};

  // Historical player-club overrides for famous Premier League icons across seasons
  const HISTORICAL_PLAYER_CLUBS: Record<string, { name: string; startYear?: number; endYear?: number }[]> = {
    'thierry henry': [{ name: 'Arsenal', startYear: 1999, endYear: 2012 }],
    'alan shearer': [
      { name: 'Blackburn Rovers', startYear: 1992, endYear: 1996 },
      { name: 'Newcastle United', startYear: 1996, endYear: 2006 }
    ],
    'wayne rooney': [
      { name: 'Everton', startYear: 2002, endYear: 2004 },
      { name: 'Manchester United', startYear: 2004, endYear: 2017 },
      { name: 'Everton', startYear: 2017, endYear: 2018 }
    ],
    'frank lampard': [
      { name: 'West Ham United', startYear: 1995, endYear: 2001 },
      { name: 'Chelsea', startYear: 2001, endYear: 2014 },
      { name: 'Manchester City', startYear: 2014, endYear: 2015 }
    ],
    'sergio agüero': [{ name: 'Manchester City', startYear: 2011, endYear: 2021 }],
    'sergio aguero': [{ name: 'Manchester City', startYear: 2011, endYear: 2021 }],
    'harry kane': [{ name: 'Tottenham Hotspur', startYear: 2013, endYear: 2023 }],
    'mohamed salah': [
      { name: 'Chelsea', startYear: 2013, endYear: 2015 },
      { name: 'Liverpool', startYear: 2017, endYear: 2025 }
    ],
    'sadio mané': [
      { name: 'Southampton', startYear: 2014, endYear: 2016 },
      { name: 'Liverpool', startYear: 2016, endYear: 2022 }
    ],
    'cristiano ronaldo': [
      { name: 'Manchester United', startYear: 2003, endYear: 2009 },
      { name: 'Manchester United', startYear: 2021, endYear: 2023 }
    ],
    'didier drogba': [{ name: 'Chelsea', startYear: 2004, endYear: 2015 }],
    'ruud van nistelrooij': [{ name: 'Manchester United', startYear: 2001, endYear: 2006 }],
    'ruud van nistelrooy': [{ name: 'Manchester United', startYear: 2001, endYear: 2006 }],
    'robin van persie': [
      { name: 'Arsenal', startYear: 2004, endYear: 2012 },
      { name: 'Manchester United', startYear: 2012, endYear: 2015 }
    ],
    'eden hazard': [{ name: 'Chelsea', startYear: 2012, endYear: 2019 }],
    'kevin de bruyne': [{ name: 'Manchester City', startYear: 2015, endYear: 2025 }],
    'heung-min son': [{ name: 'Tottenham Hotspur', startYear: 2015, endYear: 2026 }],
    'son heung-min': [{ name: 'Tottenham Hotspur', startYear: 2015, endYear: 2026 }],
    'jamie vardy': [{ name: 'Leicester City', startYear: 2014, endYear: 2025 }],
    'robbie fowler': [
      { name: 'Liverpool', startYear: 1993, endYear: 2001 },
      { name: 'Leeds United', startYear: 2001, endYear: 2003 },
      { name: 'Manchester City', startYear: 2003, endYear: 2006 },
      { name: 'Liverpool', startYear: 2006, endYear: 2007 }
    ],
    'andrew cole': [
      { name: 'Newcastle United', startYear: 1993, endYear: 1995 },
      { name: 'Manchester United', startYear: 1995, endYear: 2001 },
      { name: 'Blackburn Rovers', startYear: 2001, endYear: 2004 }
    ],
    'andy cole': [
      { name: 'Newcastle United', startYear: 1993, endYear: 1995 },
      { name: 'Manchester United', startYear: 1995, endYear: 2001 },
      { name: 'Blackburn Rovers', startYear: 2001, endYear: 2004 }
    ],
    'michael owen': [
      { name: 'Liverpool', startYear: 1996, endYear: 2004 },
      { name: 'Newcastle United', startYear: 2005, endYear: 2009 },
      { name: 'Manchester United', startYear: 2009, endYear: 2012 },
      { name: 'Stoke City', startYear: 2012, endYear: 2013 }
    ],
    'les ferdinand': [
      { name: 'Queens Park Rangers', startYear: 1992, endYear: 1995 },
      { name: 'Newcastle United', startYear: 1995, endYear: 1997 },
      { name: 'Tottenham Hotspur', startYear: 1997, endYear: 2003 }
    ],
    'teddy sheringham': [
      { name: 'Tottenham Hotspur', startYear: 1992, endYear: 1997 },
      { name: 'Manchester United', startYear: 1997, endYear: 2001 },
      { name: 'Tottenham Hotspur', startYear: 2001, endYear: 2003 },
      { name: 'Portsmouth', startYear: 2003, endYear: 2004 },
      { name: 'West Ham United', startYear: 2005, endYear: 2007 }
    ],
    'jimmy floyd hasselbaink': [
      { name: 'Leeds United', startYear: 1997, endYear: 1999 },
      { name: 'Chelsea', startYear: 2000, endYear: 2004 },
      { name: 'Middlesbrough', startYear: 2004, endYear: 2006 },
      { name: 'Charlton Athletic', startYear: 2006, endYear: 2007 }
    ],
    'dwight yorke': [
      { name: 'Aston Villa', startYear: 1992, endYear: 1998 },
      { name: 'Manchester United', startYear: 1998, endYear: 2002 },
      { name: 'Blackburn Rovers', startYear: 2002, endYear: 2004 }
    ],
    'nicolas anelka': [
      { name: 'Arsenal', startYear: 1997, endYear: 1999 },
      { name: 'Liverpool', startYear: 2001, endYear: 2002 },
      { name: 'Manchester City', startYear: 2002, endYear: 2005 },
      { name: 'Bolton Wanderers', startYear: 2006, endYear: 2008 },
      { name: 'Chelsea', startYear: 2008, endYear: 2012 }
    ],
    'dimitar berbatov': [
      { name: 'Tottenham Hotspur', startYear: 2006, endYear: 2008 },
      { name: 'Manchester United', startYear: 2008, endYear: 2012 },
      { name: 'Fulham', startYear: 2012, endYear: 2014 }
    ],
    'carlos tevez': [
      { name: 'West Ham United', startYear: 2006, endYear: 2007 },
      { name: 'Manchester United', startYear: 2007, endYear: 2009 },
      { name: 'Manchester City', startYear: 2009, endYear: 2013 }
    ],
    'romelu lukaku': [
      { name: 'Chelsea', startYear: 2011, endYear: 2014 },
      { name: 'West Bromwich Albion', startYear: 2012, endYear: 2013 },
      { name: 'Everton', startYear: 2013, endYear: 2017 },
      { name: 'Manchester United', startYear: 2017, endYear: 2019 },
      { name: 'Chelsea', startYear: 2021, endYear: 2022 }
    ],
    'alexander isak': [
      { name: 'Newcastle United', startYear: 2022, endYear: 2025 },
      { name: 'Liverpool', startYear: 2025, endYear: 2027 }
    ],
    'cole palmer': [
      { name: 'Manchester City', startYear: 2021, endYear: 2023 },
      { name: 'Chelsea', startYear: 2023, endYear: 2027 }
    ],
    'petr cech': [
      { name: 'Chelsea', startYear: 2004, endYear: 2015 },
      { name: 'Arsenal', startYear: 2015, endYear: 2019 }
    ],
    'peter schmeichel': [
      { name: 'Manchester United', startYear: 1992, endYear: 1999 },
      { name: 'Aston Villa', startYear: 2001, endYear: 2002 },
      { name: 'Manchester City', startYear: 2002, endYear: 2003 }
    ],
    'edwin van der sar': [
      { name: 'Fulham', startYear: 2001, endYear: 2005 },
      { name: 'Manchester United', startYear: 2005, endYear: 2011 }
    ],
    'david seaman': [
      { name: 'Arsenal', startYear: 1992, endYear: 2003 },
      { name: 'Manchester City', startYear: 2003, endYear: 2004 }
    ],
    'david de gea': [{ name: 'Manchester United', startYear: 2011, endYear: 2023 }],
    'pepe reina': [{ name: 'Liverpool', startYear: 2005, endYear: 2013 }],
    'alisson': [{ name: 'Liverpool', startYear: 2018, endYear: 2027 }],
    'ederson': [{ name: 'Manchester City', startYear: 2017, endYear: 2027 }],
    'jordan pickford': [
      { name: 'Sunderland', startYear: 2015, endYear: 2017 },
      { name: 'Everton', startYear: 2017, endYear: 2027 }
    ],
    'emiliano martínez': [
      { name: 'Arsenal', startYear: 2012, endYear: 2020 },
      { name: 'Aston Villa', startYear: 2020, endYear: 2027 }
    ],
    'emiliano martinez': [
      { name: 'Arsenal', startYear: 2012, endYear: 2020 },
      { name: 'Aston Villa', startYear: 2020, endYear: 2027 }
    ],
    'david raya': [
      { name: 'Brentford', startYear: 2021, endYear: 2023 },
      { name: 'Arsenal', startYear: 2023, endYear: 2027 }
    ]
  };

  // Helper to resolve player club in a season
  function resolvePlayerClub(playerName: string, rawClubName: string | undefined, rawClubId: string | number | undefined, seasonStartYear: number) {
    const pNameNorm = playerName.toLowerCase().trim();
    
    // Check historical player mappings for that season year
    const hist = HISTORICAL_PLAYER_CLUBS[pNameNorm];
    if (hist && hist.length > 0) {
      const match = hist.find(h => {
        const start = h.startYear || 1992;
        const end = h.endYear || 2027;
        return seasonStartYear >= start && seasonStartYear <= end;
      });
      if (match) {
        const resolved = resolveClub(match.name);
        if (resolved) {
          return {
            id: resolved.id,
            name: resolved.name,
            shortName: resolved.shortName,
            abbr: resolved.abbr,
            badgeUrl: resolved.badgeUrl
          };
        }
      }
    }

    // Resolve from raw club name or ID
    const resolvedFromRaw = resolveClub(rawClubName || rawClubId);
    if (resolvedFromRaw) {
      return {
        id: resolvedFromRaw.id,
        name: resolvedFromRaw.name,
        shortName: resolvedFromRaw.shortName,
        abbr: resolvedFromRaw.abbr,
        badgeUrl: resolvedFromRaw.badgeUrl
      };
    }

    return {
      id: String(rawClubId || ''),
      name: rawClubName || '',
      shortName: rawClubName || '',
      abbr: '',
      badgeUrl: getVerifiedBadgeUrl(rawClubName || rawClubId)
    };
  }

  // All 35 Premier League seasons metadata
  const ALL_SEASONS_META = [
    { compSeasonId: 841, slug: '2026-27', label: '2026/27', startYear: 2026, endYear: 2027, maxMatchweeks: 38, isCurrent: true },
    { compSeasonId: 777, slug: '2025-26', label: '2025/26', startYear: 2025, endYear: 2026, maxMatchweeks: 38 },
    { compSeasonId: 719, slug: '2024-25', label: '2024/25', startYear: 2024, endYear: 2025, maxMatchweeks: 38 },
    { compSeasonId: 578, slug: '2023-24', label: '2023/24', startYear: 2023, endYear: 2024, maxMatchweeks: 38 },
    { compSeasonId: 489, slug: '2022-23', label: '2022/23', startYear: 2022, endYear: 2023, maxMatchweeks: 38 },
    { compSeasonId: 418, slug: '2021-22', label: '2021/22', startYear: 2021, endYear: 2022, maxMatchweeks: 38 },
    { compSeasonId: 363, slug: '2020-21', label: '2020/21', startYear: 2020, endYear: 2021, maxMatchweeks: 38 },
    { compSeasonId: 274, slug: '2019-20', label: '2019/20', startYear: 2019, endYear: 2020, maxMatchweeks: 38 },
    { compSeasonId: 210, slug: '2018-19', label: '2018/19', startYear: 2018, endYear: 2019, maxMatchweeks: 38 },
    { compSeasonId: 79,  slug: '2017-18', label: '2017/18', startYear: 2017, endYear: 2018, maxMatchweeks: 38 },
    { compSeasonId: 54,  slug: '2016-17', label: '2016/17', startYear: 2016, endYear: 2017, maxMatchweeks: 38 },
    { compSeasonId: 42,  slug: '2015-16', label: '2015/16', startYear: 2015, endYear: 2016, maxMatchweeks: 38 },
    { compSeasonId: 27,  slug: '2014-15', label: '2014/15', startYear: 2014, endYear: 2015, maxMatchweeks: 38 },
    { compSeasonId: 22,  slug: '2013-14', label: '2013/14', startYear: 2013, endYear: 2014, maxMatchweeks: 38 },
    { compSeasonId: 21,  slug: '2012-13', label: '2012/13', startYear: 2012, endYear: 2013, maxMatchweeks: 38 },
    { compSeasonId: 20,  slug: '2011-12', label: '2011/12', startYear: 2011, endYear: 2012, maxMatchweeks: 38 },
    { compSeasonId: 19,  slug: '2010-11', label: '2010/11', startYear: 2010, endYear: 2011, maxMatchweeks: 38 },
    { compSeasonId: 18,  slug: '2009-10', label: '2009/10', startYear: 2009, endYear: 2010, maxMatchweeks: 38 },
    { compSeasonId: 17,  slug: '2008-09', label: '2008/09', startYear: 2008, endYear: 2009, maxMatchweeks: 38 },
    { compSeasonId: 16,  slug: '2007-08', label: '2007/08', startYear: 2007, endYear: 2008, maxMatchweeks: 38 },
    { compSeasonId: 15,  slug: '2006-07', label: '2006/07', startYear: 2006, endYear: 2007, maxMatchweeks: 38 },
    { compSeasonId: 14,  slug: '2005-06', label: '2005/06', startYear: 2005, endYear: 2006, maxMatchweeks: 38 },
    { compSeasonId: 13,  slug: '2004-05', label: '2004/05', startYear: 2004, endYear: 2005, maxMatchweeks: 38 },
    { compSeasonId: 12,  slug: '2003-04', label: '2003/04', startYear: 2003, endYear: 2004, maxMatchweeks: 38 },
    { compSeasonId: 11,  slug: '2002-03', label: '2002/03', startYear: 2002, endYear: 2003, maxMatchweeks: 38 },
    { compSeasonId: 10,  slug: '2001-02', label: '2001/02', startYear: 2001, endYear: 2002, maxMatchweeks: 38 },
    { compSeasonId: 9,   slug: '2000-01', label: '2000/01', startYear: 2000, endYear: 2001, maxMatchweeks: 38 },
    { compSeasonId: 8,   slug: '1999-00', label: '1999/00', startYear: 1999, endYear: 2000, maxMatchweeks: 38 },
    { compSeasonId: 7,   slug: '1998-99', label: '1998/99', startYear: 1998, endYear: 1999, maxMatchweeks: 38 },
    { compSeasonId: 6,   slug: '1997-98', label: '1997/98', startYear: 1997, endYear: 1998, maxMatchweeks: 38 },
    { compSeasonId: 5,   slug: '1996-97', label: '1996/97', startYear: 1996, endYear: 1997, maxMatchweeks: 38 },
    { compSeasonId: 4,   slug: '1995-96', label: '1995/96', startYear: 1995, endYear: 1996, maxMatchweeks: 38 },
    { compSeasonId: 3,   slug: '1994-95', label: '1994/95', startYear: 1994, endYear: 1995, maxMatchweeks: 42 },
    { compSeasonId: 2,   slug: '1993-94', label: '1993/94', startYear: 1993, endYear: 1994, maxMatchweeks: 42 },
    { compSeasonId: 1,   slug: '1992-93', label: '1992/93', startYear: 1992, endYear: 1993, maxMatchweeks: 42 }
  ];

  // Helper to find season
  function resolveSeason(querySeason?: string, targetUrl?: string) {
    if (querySeason) {
      const q = querySeason.trim();
      const bySlug = ALL_SEASONS_META.find(s => s.slug === q || s.label === q || s.startYear.toString() === q);
      if (bySlug) return bySlug;
      const byCompId = ALL_SEASONS_META.find(s => s.compSeasonId.toString() === q);
      if (byCompId) return byCompId;
    }
    if (targetUrl) {
      try {
        const urlObj = new URL(targetUrl);
        const parts = urlObj.pathname.split('/').filter(Boolean);
        const seasonPart = parts.find(p => /^\d{4}-\d{2}$/.test(p));
        if (seasonPart) {
          const match = ALL_SEASONS_META.find(s => s.slug === seasonPart);
          if (match) return match;
        }
      } catch (_) {}
    }
    return ALL_SEASONS_META[0]; // Default to current season (2026-27)
  }

  // API Route: List all seasons
  app.get('/api/seasons', (req, res) => {
    res.json({
      success: true,
      seasons: ALL_SEASONS_META
    });
  });

  // API Route: Get fixtures for any season and matchweek
  app.get('/api/scrape', async (req, res) => {
    try {
      const targetUrl = (req.query.url as string) || '';
      const seasonQuery = req.query.season as string;
      const mwQuery = req.query.matchweek as string;

      const seasonInfo = resolveSeason(seasonQuery, targetUrl);

      // Parse matchweek
      let matchweekId = 1;
      if (mwQuery) {
        const parsed = parseInt(mwQuery, 10);
        if (!isNaN(parsed) && parsed > 0) matchweekId = parsed;
      } else if (targetUrl) {
        try {
          const urlObj = new URL(targetUrl);
          const parts = urlObj.pathname.split('/').filter(Boolean);
          const mwPart = parts.find(p => p.startsWith('matchweek-'));
          if (mwPart) {
            const parsed = parseInt(mwPart.replace('matchweek-', ''), 10);
            if (!isNaN(parsed) && parsed > 0) matchweekId = parsed;
          }
        } catch (_) {}
      } else if (seasonInfo.isCurrent) {
        matchweekId = 3; // default to recent completed MW for current season
      }

      const cacheKey = `${seasonInfo.slug}_${matchweekId}`;
      const cached = fixturesCache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        return res.json(cached.data);
      }

      const canonicalUrl = `https://www.premierleague.com/en/matches/premier-league/${seasonInfo.slug}/matchweek-${matchweekId}`;

      const headers = {
        'Origin': 'https://www.premierleague.com',
        'Referer': 'https://www.premierleague.com/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      };

      let matches: any[] = [];
      let rawMatches: any[] = [];

      // If season is modern (2008-2027), try SDP first
      if (seasonInfo.startYear >= 2008) {
        try {
          const sdpUrl = `https://sdp-prem-prod.premier-league-prod.pulselive.com/api/v1/competitions/8/seasons/${seasonInfo.startYear}/matchweeks/${matchweekId}/matches`;
          const sdpRes = await fetchWithTimeout(sdpUrl, { headers }, 5000);
          if (sdpRes.ok) {
            const sdpData = await sdpRes.json();
            rawMatches = sdpData.data || [];
            if (rawMatches.length > 0) {
              matches = rawMatches.map((m: any) => {
                const homeId = m.homeTeam?.id ? String(m.homeTeam.id) : '';
                const awayId = m.awayTeam?.id ? String(m.awayTeam.id) : '';
                const homeClub = resolveClub(homeId || m.homeTeam?.name);
                const awayClub = resolveClub(awayId || m.awayTeam?.name);
                return {
                  matchId: String(m.matchId || ''),
                  competition: m.competition || 'Premier League',
                  period: m.period || 'PreMatch',
                  kickoff: m.kickoff || '',
                  kickoffTimezone: m.kickoffTimezone || 'BST',
                  ground: m.ground || '',
                  clock: m.clock,
                  attendance: m.attendance,
                  resultType: m.resultType,
                  tbc: m.tbc,
                  homeTeam: {
                    id: homeClub ? homeClub.id : homeId,
                    name: homeClub ? homeClub.name : (m.homeTeam?.name || 'Unknown Home'),
                    shortName: homeClub ? homeClub.shortName : (m.homeTeam?.shortName || m.homeTeam?.name || ''),
                    score: typeof m.homeTeam?.score === 'number' ? m.homeTeam.score : undefined,
                    halfTimeScore: typeof m.homeTeam?.halfTimeScore === 'number' ? m.homeTeam.halfTimeScore : undefined,
                    redCards: m.homeTeam?.redCards,
                    badgeUrl: homeClub ? homeClub.badgeUrl : getVerifiedBadgeUrl(homeId || m.homeTeam?.name)
                  },
                  awayTeam: {
                    id: awayClub ? awayClub.id : awayId,
                    name: awayClub ? awayClub.name : (m.awayTeam?.name || 'Unknown Away'),
                    shortName: awayClub ? awayClub.shortName : (m.awayTeam?.shortName || m.awayTeam?.name || ''),
                    score: typeof m.awayTeam?.score === 'number' ? m.awayTeam.score : undefined,
                    halfTimeScore: typeof m.awayTeam?.halfTimeScore === 'number' ? m.awayTeam.halfTimeScore : undefined,
                    redCards: m.awayTeam?.redCards,
                    badgeUrl: awayClub ? awayClub.badgeUrl : getVerifiedBadgeUrl(awayId || m.awayTeam?.name)
                  }
                };
              });
            }
          }
        } catch (sdpErr) {
          console.warn('SDP fetch failed, falling back to FootballAPI:', sdpErr);
        }
      }

      // If matches are not populated yet (e.g. historical season 1992-2007, or SDP was empty)
      if (matches.length === 0) {
        // Fetch or get from cache the gameweeks list for this compSeasonId
        let gameweeksList = seasonGameweeksCache[seasonInfo.compSeasonId];
        if (!gameweeksList) {
          try {
            const gwRes = await fetchWithTimeout(`https://footballapi.pulselive.com/football/compseasons/${seasonInfo.compSeasonId}/gameweeks`, { headers }, 5000);
            if (gwRes.ok) {
              const gwData = await gwRes.json();
              gameweeksList = gwData.gameweeks || [];
              seasonGameweeksCache[seasonInfo.compSeasonId] = gameweeksList;
            }
          } catch (_) {}
        }

        if (Array.isArray(gameweeksList) && gameweeksList.length > 0) {
          const targetGw = gameweeksList.find((g: any) => g.gameweek === matchweekId) ||
            gameweeksList[matchweekId - 1] ||
            gameweeksList[0];

          if (targetGw && targetGw.id) {
            try {
              const fRes = await fetchWithTimeout(`https://footballapi.pulselive.com/football/fixtures?comps=1&compSeasons=${seasonInfo.compSeasonId}&gameweeks=${targetGw.id}&pageSize=50`, { headers }, 5000);
              if (fRes.ok) {
                const fData = await fRes.json();
                rawMatches = fData.content || [];
                matches = rawMatches.map((m: any) => {
                  const home = m.teams?.[0] || {};
                  const away = m.teams?.[1] || {};
                  const homeId = home.team?.id ? String(home.team.id) : '';
                  const awayId = away.team?.id ? String(away.team.id) : '';
                  const isPlayed = m.status === 'C';

                  const homeClub = resolveClub(homeId || home.team?.name || home.team?.shortName);
                  const awayClub = resolveClub(awayId || away.team?.name || away.team?.shortName);

                  return {
                    matchId: String(m.id || ''),
                    competition: 'Premier League',
                    period: isPlayed ? 'FullTime' : m.status === 'L' ? 'Live' : 'PreMatch',
                    kickoff: m.kickoff?.millis ? new Date(m.kickoff.millis).toISOString() : '',
                    kickoffLabel: m.kickoff?.label || '',
                    kickoffTimezone: 'BST',
                    ground: m.ground?.name || '',
                    clock: m.clock?.label ? { label: m.clock.label, secs: m.clock.secs } : undefined,
                    attendance: m.attendance,
                    resultType: isPlayed ? 'Normal' : undefined,
                    homeTeam: {
                      id: homeClub ? homeClub.id : homeId,
                      name: homeClub ? homeClub.name : (home.team?.name || 'Unknown Home'),
                      shortName: homeClub ? homeClub.shortName : (home.team?.shortName || home.team?.club?.shortName || home.team?.name || ''),
                      score: typeof home.score === 'number' ? home.score : undefined,
                      halfTimeScore: typeof home.halfTimeScore === 'number' ? home.halfTimeScore : undefined,
                      badgeUrl: homeClub ? homeClub.badgeUrl : getVerifiedBadgeUrl(homeId || home.team?.name)
                    },
                    awayTeam: {
                      id: awayClub ? awayClub.id : awayId,
                      name: awayClub ? awayClub.name : (away.team?.name || 'Unknown Away'),
                      shortName: awayClub ? awayClub.shortName : (away.team?.shortName || away.team?.club?.shortName || away.team?.name || ''),
                      score: typeof away.score === 'number' ? away.score : undefined,
                      halfTimeScore: typeof away.halfTimeScore === 'number' ? away.halfTimeScore : undefined,
                      badgeUrl: awayClub ? awayClub.badgeUrl : getVerifiedBadgeUrl(awayId || away.team?.name)
                    }
                  };
                });
              }
            } catch (_) {}
          }
        }
      }

      const responsePayload = {
        success: true,
        targetUrl: canonicalUrl,
        scrapedAt: new Date().toISOString(),
        seasonId: seasonInfo.slug,
        seasonLabel: seasonInfo.label,
        compSeasonId: seasonInfo.compSeasonId,
        matchweekId,
        maxMatchweeks: seasonInfo.maxMatchweeks,
        totalMatches: matches.length,
        htmlMeta: {
          title: `Premier League ${seasonInfo.label} Matchweek ${matchweekId} Fixtures & Results`,
          description: `Premier League fixtures, scores and results for season ${seasonInfo.label}, matchweek ${matchweekId}.`,
          canonicalUrl
        },
        matches,
        rawMatches
      };

      // Cache: 10 mins for current, 24 hours for past
      const ttl = seasonInfo.isCurrent ? 10 * 60 * 1000 : 24 * 60 * 60 * 1000;
      fixturesCache.set(cacheKey, { data: responsePayload, expiresAt: Date.now() + ttl });

      res.json(responsePayload);
    } catch (error: any) {
      console.error('Scraping error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to retrieve Premier League data'
      });
    }
  });

  // API Route: Premier League Tables / Standings (Till a matchweek or All matchweeks)
  app.get('/api/tables', async (req, res) => {
    try {
      const targetUrl = (req.query.url as string) || '';
      const seasonQuery = req.query.season as string;
      const mwQuery = req.query.matchweek as string;

      let isAllMatchweeks = false;
      let matchweekNum = 3;

      if (targetUrl) {
        try {
          const urlObj = new URL(targetUrl);
          const parts = urlObj.pathname.split('/').filter(Boolean);
          if (parts.includes('all-matchweeks')) {
            isAllMatchweeks = true;
          } else {
            const mwPart = parts.find(p => p.startsWith('matchweek-'));
            if (mwPart) {
              const parsed = parseInt(mwPart.replace('matchweek-', ''), 10);
              if (!isNaN(parsed) && parsed > 0) matchweekNum = parsed;
            }
          }
        } catch (_) {}
      }

      if (mwQuery) {
        if (mwQuery === 'all' || mwQuery === 'all-matchweeks') {
          isAllMatchweeks = true;
        } else {
          const parsed = parseInt(mwQuery, 10);
          if (!isNaN(parsed) && parsed > 0) {
            matchweekNum = parsed;
            isAllMatchweeks = false;
          }
        }
      }

      const seasonInfo = resolveSeason(seasonQuery, targetUrl);
      const cacheKey = `${seasonInfo.slug}_${isAllMatchweeks ? 'all' : matchweekNum}`;
      const cached = tablesCache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        return res.json(cached.data);
      }

      const canonicalUrl = isAllMatchweeks
        ? `https://www.premierleague.com/en/tables/premier-league/${seasonInfo.slug}/all-matchweeks`
        : `https://www.premierleague.com/en/tables/premier-league/${seasonInfo.slug}/matchweek-${matchweekNum}`;

      const headers = {
        'Origin': 'https://www.premierleague.com',
        'Referer': 'https://www.premierleague.com/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      };

      let rawEntries: any[] = [];
      let deductions: Array<{ reason: string }> = [];
      let fetchedSuccessfully = false;

      // Case 1: SDP support (seasons 2016-17 to 2026-27)
      if (seasonInfo.startYear >= 2016) {
        try {
          const sdpUrl = isAllMatchweeks
            ? `https://sdp-prem-prod.premier-league-prod.pulselive.com/api/v5/competitions/8/seasons/${seasonInfo.startYear}/standings`
            : `https://sdp-prem-prod.premier-league-prod.pulselive.com/api/v5/competitions/8/seasons/${seasonInfo.startYear}/matchweeks/${matchweekNum}/standings`;

          const sdpRes = await fetchWithTimeout(sdpUrl, { headers }, 5000);
          if (sdpRes.ok) {
            const sdpData = await sdpRes.json();
            if (Array.isArray(sdpData.tables) && sdpData.tables[0]?.entries?.length > 0) {
              rawEntries = sdpData.tables[0].entries;
              if (Array.isArray(sdpData.deductions)) {
                deductions = sdpData.deductions;
              }
              fetchedSuccessfully = true;
            }
          }
        } catch (sdpErr) {
          console.warn('SDP tables fetch error:', sdpErr);
        }
      }

      // Case 2: FootballAPI fallback (all 35 seasons from 1992-93 to date)
      if (!fetchedSuccessfully) {
        try {
          const fbRes = await fetchWithTimeout(`https://footballapi.pulselive.com/football/standings?compSeasons=${seasonInfo.compSeasonId}`, { headers }, 5000);
          if (fbRes.ok) {
            const fbData = await fbRes.json();
            if (Array.isArray(fbData.tables) && fbData.tables[0]?.entries?.length > 0) {
              rawEntries = fbData.tables[0].entries;
              fetchedSuccessfully = true;
            }
          }
        } catch (fbErr) {
          console.warn('FootballAPI tables fetch error:', fbErr);
        }
      }

      // Case 3: Guaranteed canonical fallback if external APIs failed or returned 0 entries
      if (!fetchedSuccessfully || rawEntries.length === 0) {
        const fallback = getFallbackStandings(seasonInfo.slug, isAllMatchweeks ? 'all' : matchweekNum);
        const ttl = seasonInfo.isCurrent ? 10 * 60 * 1000 : 24 * 60 * 60 * 1000;
        tablesCache.set(cacheKey, { data: fallback, expiresAt: Date.now() + ttl });
        return res.json(fallback);
      }

      // Normalize entries to consistent StandingsEntry[]
      const entries = rawEntries.map((e: any, idx: number) => {
        const teamObj = e.team || {};
        const teamId = String(teamObj.id || teamObj.club?.id || '');
        const teamName = teamObj.name || teamObj.club?.name || 'Unknown Team';
        const shortName = teamObj.shortName || teamObj.club?.shortName || teamName;
        const abbr = teamObj.abbr || teamObj.club?.abbr || (shortName.substring(0, 3).toUpperCase());

        const pos = e.overall?.position ?? e.position ?? (idx + 1);
        const startPos = e.overall?.startingPosition ?? e.startingPosition ?? pos;
        let movement: 'up' | 'down' | 'same' = 'same';
        if (startPos > pos) movement = 'up';
        else if (startPos < pos) movement = 'down';

        const overallPlayed = Number(e.overall?.played ?? 0);
        const overallWon = Number(e.overall?.won ?? 0);
        const overallDrawn = Number(e.overall?.drawn ?? 0);
        const overallLost = Number(e.overall?.lost ?? 0);
        const overallGf = Number(e.overall?.goalsFor ?? 0);
        const overallGa = Number(e.overall?.goalsAgainst ?? 0);
        const overallGd = typeof e.overall?.goalsDifference === 'number'
          ? e.overall.goalsDifference
          : typeof e.overall?.goalDifference === 'number'
          ? e.overall.goalDifference
          : (overallGf - overallGa);
        const overallPts = Number(e.overall?.points ?? 0);

        const homePlayed = Number(e.home?.played ?? 0);
        const homeWon = Number(e.home?.won ?? 0);
        const homeDrawn = Number(e.home?.drawn ?? 0);
        const homeLost = Number(e.home?.lost ?? 0);
        const homeGf = Number(e.home?.goalsFor ?? 0);
        const homeGa = Number(e.home?.goalsAgainst ?? 0);
        const homeGd = typeof e.home?.goalsDifference === 'number'
          ? e.home.goalsDifference
          : (homeGf - homeGa);
        const homePts = Number(e.home?.points ?? 0);

        const awayPlayed = Number(e.away?.played ?? 0);
        const awayWon = Number(e.away?.won ?? 0);
        const awayDrawn = Number(e.away?.drawn ?? 0);
        const awayLost = Number(e.away?.lost ?? 0);
        const awayGf = Number(e.away?.goalsFor ?? 0);
        const awayGa = Number(e.away?.goalsAgainst ?? 0);
        const awayGd = typeof e.away?.goalsDifference === 'number'
          ? e.away.goalsDifference
          : (awayGf - awayGa);
        const awayPts = Number(e.away?.points ?? 0);

        let formPills: string[] = [];
        if (Array.isArray(e.form)) {
          formPills = e.form.map((f: any) => (typeof f === 'string' ? f : f.outcome || ''));
        }

        const resolvedClub = resolveClub(teamId || teamName || shortName);

        return {
          position: pos,
          startingPosition: startPos,
          movement,
          team: {
            id: resolvedClub ? resolvedClub.id : teamId,
            name: resolvedClub ? resolvedClub.name : teamName,
            shortName: resolvedClub ? resolvedClub.shortName : shortName,
            abbr: resolvedClub ? resolvedClub.abbr : abbr,
            badgeUrl: resolvedClub ? resolvedClub.badgeUrl : getVerifiedBadgeUrl(teamId || teamName)
          },
          overall: {
            played: overallPlayed,
            won: overallWon,
            drawn: overallDrawn,
            lost: overallLost,
            goalsFor: overallGf,
            goalsAgainst: overallGa,
            goalDifference: overallGd,
            points: overallPts
          },
          home: {
            played: homePlayed,
            won: homeWon,
            drawn: homeDrawn,
            lost: homeLost,
            goalsFor: homeGf,
            goalsAgainst: homeGa,
            goalDifference: homeGd,
            points: homePts
          },
          away: {
            played: awayPlayed,
            won: awayWon,
            drawn: awayDrawn,
            lost: awayLost,
            goalsFor: awayGf,
            goalsAgainst: awayGa,
            goalDifference: awayGd,
            points: awayPts
          },
          form: formPills,
          annotations: e.annotations
        };
      });

      const responsePayload = {
        success: true,
        targetUrl: canonicalUrl,
        scrapedAt: new Date().toISOString(),
        seasonId: seasonInfo.slug,
        seasonLabel: seasonInfo.label,
        compSeasonId: seasonInfo.compSeasonId,
        matchweekId: isAllMatchweeks ? 'all' : matchweekNum,
        isAllMatchweeks,
        maxMatchweeks: seasonInfo.maxMatchweeks,
        deductions,
        entries,
        totalTeams: entries.length
      };

      const ttl = seasonInfo.isCurrent ? 10 * 60 * 1000 : 24 * 60 * 60 * 1000;
      tablesCache.set(cacheKey, { data: responsePayload, expiresAt: Date.now() + ttl });

      res.json(responsePayload);
    } catch (error: any) {
      console.error('Tables error:', error);
      // Even on error, return fallback response rather than 500 crash
      const seasonInfo = resolveSeason(req.query.season as string);
      const fallback = getFallbackStandings(seasonInfo.slug, req.query.matchweek === 'all' ? 'all' : 3);
      res.json(fallback);
    }
  });

  // API Route: Official Premier League Stats Leaderboards
  app.get('/api/stats', async (req, res) => {
    try {
      const seasonQuery = req.query.season as string;
      const urlQuery = req.query.url as string;
      const categoryQuery = req.query.category as string;
      const typeQuery = (req.query.type as string) || 'all'; // 'player' | 'team' | 'all'
      const pageSize = parseInt(req.query.pageSize as string, 10) || 10;

      let seasonSlug = seasonQuery || '2026-27';
      if (urlQuery) {
        const seasonMatch = urlQuery.match(/(\d{4}-\d{2})/);
        if (seasonMatch) {
          seasonSlug = seasonMatch[1];
        }
      }

      const seasonInfo = resolveSeason(seasonSlug, urlQuery);
      const compSeasonId = seasonInfo.compSeasonId;

      const cacheKey = `${seasonInfo.slug}_${categoryQuery || 'all'}_${typeQuery}_${pageSize}`;
      const cached = statsCache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        return res.json(cached.data);
      }

      const headers = {
        'Origin': 'https://www.premierleague.com',
        'Referer': 'https://www.premierleague.com/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      };

      const playerCategoryConfigs: Record<string, { label: string; unit: string }> = {
        goals: { label: 'Goals (Golden Boot)', unit: 'goals' },
        goal_assist: { label: 'Assists (Playmaker)', unit: 'assists' },
        clean_sheet: { label: 'Clean Sheets (Golden Glove)', unit: 'clean sheets' },
        total_pass: { label: 'Passes', unit: 'passes' },
        total_tackle: { label: 'Tackles', unit: 'tackles' },
        saves: { label: 'Saves', unit: 'saves' },
        yellow_card: { label: 'Yellow Cards', unit: 'yellow cards' },
        red_card: { label: 'Red Cards', unit: 'red cards' }
      };

      const teamCategoryConfigs: Record<string, { label: string; unit: string }> = {
        goals: { label: 'Goals Scored', unit: 'goals' },
        clean_sheet: { label: 'Clean Sheets', unit: 'clean sheets' },
        total_pass: { label: 'Passes', unit: 'passes' },
        total_tackle: { label: 'Tackles', unit: 'tackles' },
        yellow_card: { label: 'Yellow Cards', unit: 'yellow cards' },
        red_card: { label: 'Red Cards', unit: 'red cards' }
      };

      const targetPlayerCats = categoryQuery && playerCategoryConfigs[categoryQuery]
        ? [categoryQuery]
        : Object.keys(playerCategoryConfigs);

      const targetTeamCats = categoryQuery && teamCategoryConfigs[categoryQuery]
        ? [categoryQuery]
        : Object.keys(teamCategoryConfigs);

      const playerCategories: Record<string, any> = {};
      const teamCategories: Record<string, any> = {};

      // Fetch player stats
      if (typeQuery === 'all' || typeQuery === 'player') {
        await Promise.allSettled(
          targetPlayerCats.map(async (catKey) => {
            try {
              const url = `https://footballapi.pulselive.com/football/stats/ranked/players/${catKey}?compSeasons=${compSeasonId}&comps=1&pageSize=${pageSize}`;
              const resp = await fetchWithTimeout(url, { headers }, 4500);
              if (resp.ok) {
                const json: any = await resp.json();
                const content = json?.stats?.content || [];
                if (content.length > 0) {
                  const entries = content.map((item: any, idx: number) => {
                    const owner = item.owner || {};
                    const rawClub = owner.currentTeam?.club || owner.currentTeam || {};
                    const rawClubId = rawClub.id || owner.currentTeam?.id || '';
                    const rawClubName = rawClub.name || owner.currentTeam?.name || '';
                    const playerName = owner.name?.display || `${owner.name?.first || ''} ${owner.name?.last || ''}`.trim() || 'Unknown Player';

                    const resolvedClub = resolvePlayerClub(playerName, rawClubName, rawClubId, seasonInfo.startYear);

                    return {
                      rank: item.rank || idx + 1,
                      playerId: String(owner.playerId || owner.id || idx),
                      name: playerName,
                      position: owner.info?.position || owner.info?.positionInfo || '',
                      shirtNum: owner.info?.shirtNum,
                      nationality: {
                        country: owner.nationalTeam?.country || owner.birth?.country?.country || '',
                        isoCode: owner.nationalTeam?.isoCode || owner.birth?.country?.isoCode || ''
                      },
                      club: {
                        id: String(resolvedClub.id || rawClubId),
                        name: resolvedClub.name || rawClubName || 'Unknown Club',
                        shortName: resolvedClub.shortName || rawClubName || 'Unknown Club',
                        abbr: resolvedClub.abbr || '',
                        badgeUrl: resolvedClub.badgeUrl || getVerifiedBadgeUrl(rawClubId || rawClubName)
                      },
                      value: item.value || 0
                    };
                  });

                  playerCategories[catKey] = {
                    category: catKey,
                    categoryLabel: playerCategoryConfigs[catKey].label,
                    unit: playerCategoryConfigs[catKey].unit,
                    entries
                  };
                }
              }
            } catch (err) {
              console.warn(`Error fetching player stat ${catKey}:`, err);
            }
          })
        );
      }

      // Fetch team stats
      if (typeQuery === 'all' || typeQuery === 'team') {
        await Promise.allSettled(
          targetTeamCats.map(async (catKey) => {
            try {
              const url = `https://footballapi.pulselive.com/football/stats/ranked/teams/${catKey}?compSeasons=${compSeasonId}&comps=1&pageSize=${pageSize}`;
              const resp = await fetchWithTimeout(url, { headers }, 4500);
              if (resp.ok) {
                const json: any = await resp.json();
                const content = json?.stats?.content || [];
                if (content.length > 0) {
                  const entries = content.map((item: any, idx: number) => {
                    const owner = item.owner || {};
                    const club = owner.club || owner;
                    const clubId = club.id || owner.id || '';
                    const clubName = club.name || owner.name || '';
                    const resolvedClub = resolveClub(clubId || clubName);
                    const ground = (owner.grounds && owner.grounds[0]?.name) || '';
                    return {
                      rank: item.rank || idx + 1,
                      club: {
                        id: String(resolvedClub ? resolvedClub.id : clubId),
                        name: resolvedClub ? resolvedClub.name : clubName,
                        shortName: resolvedClub ? resolvedClub.shortName : (club.shortName || owner.shortName || clubName),
                        abbr: resolvedClub ? resolvedClub.abbr : (club.abbr || ''),
                        badgeUrl: resolvedClub ? resolvedClub.badgeUrl : getVerifiedBadgeUrl(clubId || clubName),
                        stadium: ground
                      },
                      value: item.value || 0
                    };
                  });

                  teamCategories[catKey] = {
                    category: catKey,
                    categoryLabel: teamCategoryConfigs[catKey].label,
                    unit: teamCategoryConfigs[catKey].unit,
                    entries
                  };
                }
              }
            } catch (err) {
              console.warn(`Error fetching team stat ${catKey}:`, err);
            }
          })
        );
      }

      // If stats returned empty, supplement with canonical historical leaders
      if (Object.keys(playerCategories).length === 0 && Object.keys(teamCategories).length === 0) {
        const fallback = getFallbackStatsOverview(seasonInfo.slug);
        const ttl = seasonInfo.isCurrent ? 10 * 60 * 1000 : 24 * 60 * 60 * 1000;
        statsCache.set(cacheKey, { data: fallback, expiresAt: Date.now() + ttl });
        return res.json(fallback);
      }

      const responsePayload = {
        success: true,
        targetUrl: `https://www.premierleague.com/en/stats?season=${seasonSlug}`,
        seasonId: seasonInfo.slug,
        seasonLabel: seasonInfo.label,
        compSeasonId,
        playerCategories,
        teamCategories
      };

      const ttl = seasonInfo.isCurrent ? 10 * 60 * 1000 : 24 * 60 * 60 * 1000;
      statsCache.set(cacheKey, { data: responsePayload, expiresAt: Date.now() + ttl });

      res.json(responsePayload);
    } catch (error: any) {
      console.error('Stats error:', error);
      const seasonInfo = resolveSeason(req.query.season as string);
      const fallback = getFallbackStatsOverview(seasonInfo.slug);
      res.json(fallback);
    }
  });

  // API Route: Match Preview, Events, and Lineups
  app.get('/api/match-preview', async (req, res) => {
    try {
      const matchId = req.query.matchId as string;
      if (!matchId) {
        return res.status(400).json({ error: 'matchId is required' });
      }

      const headers = {
        'Origin': 'https://www.premierleague.com',
        'Referer': 'https://www.premierleague.com/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      };

      const [previewRes, eventsRes, lineupsRes] = await Promise.all([
        fetch(`https://sdp-prem-prod.premier-league-prod.pulselive.com/api/v1/matches/${matchId}/preview`, { headers }),
        fetch(`https://sdp-prem-prod.premier-league-prod.pulselive.com/api/v1/matches/${matchId}/events`, { headers }),
        fetch(`https://sdp-prem-prod.premier-league-prod.pulselive.com/api/v1/matches/${matchId}/lineups`, { headers })
      ]);

      let previousMeetings = [];
      if (previewRes.ok) {
        const previewData = await previewRes.json();
        previousMeetings = previewData.previousMeetings || [];
      }

      // Build player map for name resolution
      const playerMap: Record<string, string> = {};
      if (lineupsRes.ok) {
        const lineupsData = await lineupsRes.json();
        if (Array.isArray(lineupsData)) {
          for (const teamLineup of lineupsData) {
            if (teamLineup.players) {
              for (const p of teamLineup.players) {
                const fullName = `${p.firstName ? p.firstName + ' ' : ''}${p.lastName || ''}`.trim();
                playerMap[p.id] = fullName || `Player #${p.id}`;
              }
            }
          }
        }
      }

      let homeGoals: any[] = [];
      let awayGoals: any[] = [];
      let homeCards: any[] = [];
      let awayCards: any[] = [];

      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        
        // Home goals
        if (Array.isArray(eventsData.homeTeam?.goals)) {
          homeGoals = eventsData.homeTeam.goals.map((g: any) => ({
            playerId: g.playerId,
            playerName: playerMap[g.playerId] || `Player #${g.playerId}`,
            time: g.time,
            period: g.period,
            goalType: g.goalType,
            assistPlayerName: g.assistPlayerId ? playerMap[g.assistPlayerId] : undefined
          }));
        }

        // Away goals
        if (Array.isArray(eventsData.awayTeam?.goals)) {
          awayGoals = eventsData.awayTeam.goals.map((g: any) => ({
            playerId: g.playerId,
            playerName: playerMap[g.playerId] || `Player #${g.playerId}`,
            time: g.time,
            period: g.period,
            goalType: g.goalType,
            assistPlayerName: g.assistPlayerId ? playerMap[g.assistPlayerId] : undefined
          }));
        }

        // Cards
        if (Array.isArray(eventsData.homeTeam?.cards)) {
          homeCards = eventsData.homeTeam.cards.map((c: any) => ({
            playerId: c.playerId,
            playerName: playerMap[c.playerId] || `Player #${c.playerId}`,
            time: c.time,
            period: c.period,
            type: c.type
          }));
        }

        if (Array.isArray(eventsData.awayTeam?.cards)) {
          awayCards = eventsData.awayTeam.cards.map((c: any) => ({
            playerId: c.playerId,
            playerName: playerMap[c.playerId] || `Player #${c.playerId}`,
            time: c.time,
            period: c.period,
            type: c.type
          }));
        }
      }

      // If no goals/cards found via SDP (e.g. historical matches), fetch from footballapi
      if (homeGoals.length === 0 && awayGoals.length === 0) {
        try {
          const fbRes = await fetch(`https://footballapi.pulselive.com/football/fixtures/${matchId}`, { headers });
          if (fbRes.ok) {
            const fbData = await fbRes.json();
            // Parse events from footballapi
            if (Array.isArray(fbData.events)) {
              for (const ev of fbData.events) {
                // Goal events
                if (ev.type === 'G' || ev.type === 'OG' || ev.type === 'PG') {
                  const goalObj = {
                    playerId: String(ev.personId || ''),
                    playerName: ev.personId ? `Player #${ev.personId}` : 'Goal',
                    time: ev.clock?.label || '',
                    period: ev.phase === '1' ? 'FirstHalf' : 'SecondHalf',
                    goalType: ev.type === 'OG' ? 'Own Goal' : ev.type === 'PG' ? 'Penalty' : 'Goal'
                  };
                  if (ev.teamId === fbData.teams?.[0]?.team?.id) {
                    homeGoals.push(goalObj);
                  } else {
                    awayGoals.push(goalObj);
                  }
                }
              }
            }
          }
        } catch (_) {}
      }

      res.json({
        matchId,
        previousMeetings,
        homeGoals,
        awayGoals,
        homeCards,
        awayCards
      });
    } catch (error: any) {
      console.error('Error fetching match details:', error);
      res.status(500).json({ error: error.message || 'Error fetching match preview and details' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
