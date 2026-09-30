import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { resolveClub, getVerifiedBadgeUrl, ALL_PREMIER_LEAGUE_CLUBS } from './src/data/clubs';
import { getFallbackStandings, getFallbackStatsOverview } from './src/data/canonicalStats';
import { findSeasonBySlug } from './src/data/seasons';
import { resolvePrimeiraLigaClub, getPrimeiraLigaBadgeUrl, PRIMEIRA_LIGA_CLUBS } from './src/data/primeiraLigaClubs';

const getAppDirname = () => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.url) {
      return path.dirname(fileURLToPath(import.meta.url));
    }
  } catch (_) {}
  return process.cwd();
};
const __dirname = getAppDirname();

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
                const homeClub = resolveClub(m.homeTeam?.name) || resolveClub(m.homeTeam?.shortName) || resolveClub(homeId);
                const awayClub = resolveClub(m.awayTeam?.name) || resolveClub(m.awayTeam?.shortName) || resolveClub(awayId);
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

                  const homeClub = resolveClub(home.team?.name) || resolveClub(home.team?.shortName) || resolveClub(homeId);
                  const awayClub = resolveClub(away.team?.name) || resolveClub(away.team?.shortName) || resolveClub(awayId);

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

  // Helper: Format date range for matchweeks
  function formatMatchweekDateRange(fromMillis?: number, untilMillis?: number, fromLabel?: string, untilLabel?: string) {
    if (!fromMillis || !untilMillis) {
      if (fromLabel) return { short: fromLabel.split(',')[0], full: fromLabel };
      return { short: '', full: '' };
    }
    const d1 = new Date(fromMillis);
    const d2 = new Date(untilMillis);
    const m1 = d1.toLocaleDateString('en-GB', { month: 'short' });
    const m2 = d2.toLocaleDateString('en-GB', { month: 'short' });
    const day1 = d1.getDate();
    const day2 = d2.getDate();
    const year = d1.getFullYear();
    const short = m1 === m2 ? `${day1} - ${day2} ${m1}` : `${day1} ${m1} - ${day2} ${m2}`;
    const full = m1 === m2 ? `${day1} - ${day2} ${m1} ${year}` : `${day1} ${m1} - ${day2} ${m2} ${year}`;
    return { short, full };
  }

  // API Route: Get all matchweeks with schedule dates and statuses for a season
  app.get('/api/season-matchweeks', async (req, res) => {
    try {
      const seasonSlug = (req.query.season as string) || '2026-27';
      const seasonInfo = findSeasonBySlug(seasonSlug);

      const headers = {
        'Origin': 'https://www.premierleague.com',
        'Referer': 'https://www.premierleague.com/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      };

      let gameweeksList = seasonGameweeksCache[seasonInfo.compSeasonId];
      if (!gameweeksList || gameweeksList.length === 0) {
        try {
          const gwRes = await fetchWithTimeout(
            `https://footballapi.pulselive.com/football/compseasons/${seasonInfo.compSeasonId}/gameweeks`,
            { headers },
            5000
          );
          if (gwRes.ok) {
            const gwData = await gwRes.json();
            gameweeksList = gwData.gameweeks || [];
            seasonGameweeksCache[seasonInfo.compSeasonId] = gameweeksList;
          }
        } catch (e) {
          console.warn('Could not fetch gameweeks from pulselive:', e);
        }
      }

      const now = Date.now();
      const maxMws = seasonInfo.maxMatchweeks || 38;

      let matchweeks: any[] = [];

      if (Array.isArray(gameweeksList) && gameweeksList.length > 0) {
        matchweeks = gameweeksList.map((gw: any) => {
          const fromM = gw.from?.millis;
          const untilM = gw.until?.millis;
          const { short, full } = formatMatchweekDateRange(fromM, untilM, gw.from?.label, gw.until?.label);

          const isToday = Boolean(
            fromM &&
            untilM &&
            now >= fromM - 12 * 3600 * 1000 &&
            now <= untilM + 12 * 3600 * 1000
          );

          const isPlayed = gw.status === 'C';
          const isUpcoming = gw.status === 'U' || (!isPlayed && !isToday && Boolean(fromM && now < fromM));
          const status = isToday ? 'live' : isPlayed ? 'played' : 'upcoming';

          return {
            matchweek: gw.gameweek,
            status,
            dateRange: short,
            fullDateRange: full,
            fromLabel: gw.from?.label,
            untilLabel: gw.until?.label,
            fromMillis: fromM,
            untilMillis: untilM,
            matchesCount: gw.matches || 10,
            isPlayed,
            isUpcoming,
            isToday
          };
        });
      } else {
        // Fallback calculation if remote API unavailable
        matchweeks = Array.from({ length: maxMws }, (_, i) => {
          const mw = i + 1;
          const isPlayed = !seasonInfo.isCurrent || mw <= 5;
          return {
            matchweek: mw,
            status: isPlayed ? 'played' : 'upcoming',
            dateRange: `MW ${mw}`,
            fullDateRange: `Matchweek ${mw}`,
            matchesCount: 10,
            isPlayed,
            isUpcoming: !isPlayed,
            isToday: false
          };
        });
      }

      // Find matchweek for today or last played
      const todayMw = matchweeks.find((m: any) => m.isToday);
      const lastPlayed = [...matchweeks].reverse().find((m: any) => m.isPlayed);
      const recommendedMatchweek = todayMw ? todayMw.matchweek : lastPlayed ? lastPlayed.matchweek : 1;

      res.json({
        success: true,
        seasonSlug: seasonInfo.slug,
        seasonLabel: seasonInfo.label,
        recommendedMatchweek,
        hasMatchToday: Boolean(todayMw),
        todayMatchweek: todayMw ? todayMw.matchweek : null,
        lastPlayedMatchweek: lastPlayed ? lastPlayed.matchweek : null,
        matchweeks
      });
    } catch (err: any) {
      console.error('Error fetching season matchweeks:', err);
      res.status(500).json({ success: false, error: err.message || 'Error fetching season matchweeks' });
    }
  });

  // ==========================================
  // PORTUGUESE PRIMEIRA LIGA (BBC SPORT)
  // ==========================================
  const primeiraLigaMatchesCache: Record<string, any> = {};
  let primeiraLigaScheduleCache: { data: any; expiresAt: number } | null = null;
  let primeiraLigaTableCache: { data: any; expiresAt: number } | null = null;

  async function fetchBBCPrimeiraLigaSchedule() {
    if (primeiraLigaScheduleCache && Date.now() < primeiraLigaScheduleCache.expiresAt) {
      return primeiraLigaScheduleCache.data;
    }

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    };

    const months = ['2026-08', '2026-09', '2026-10', '2026-11'];
    const allEvents: any[] = [];

    for (const m of months) {
      try {
        const url = `https://www.bbc.com/sport/football/portuguese-primeira-liga/scores-fixtures/${m}`;
        const res = await fetchWithTimeout(url, { headers }, 5000);
        if (res.ok) {
          const html = await res.text();
          const match = html.match(/window\.__INITIAL_DATA__\s*=\s*("(?:\\.|[^"\\])*"|{.*?});/s);
          if (match) {
            let raw = match[1];
            let data = raw.startsWith('"') ? JSON.parse(JSON.parse(raw)) : JSON.parse(raw);
            const key = Object.keys(data.data || {}).find((k) => k.startsWith('sport-data-scores-fixtures'));
            const evGroups = data.data?.[key]?.data?.eventGroups || [];
            evGroups.forEach((eg: any) => {
              eg.secondaryGroups?.forEach((sg: any) => {
                sg.events?.forEach((ev: any) => {
                  allEvents.push(ev);
                });
              });
            });
          }
        }
      } catch (err) {
        console.warn(`BBC Sport Primeira Liga fetch failed for month ${m}:`, err);
      }
    }

    // Deduplicate by event id
    const uniqueEvents = Array.from(new Map(allEvents.map((e) => [e.id, e])).values());
    uniqueEvents.sort((a, b) => new Date(a.startDateTime || a.date?.iso).getTime() - new Date(b.startDateTime || b.date?.iso).getTime());

    const now = Date.now();
    const jornadas: any[] = [];
    const jornadaMatchesMap: Record<number, any[]> = {};

    // Group into 9 matches per Jornada (18 teams = 9 matches per round)
    for (let i = 0; i < 34; i++) {
      const jNum = i + 1;
      const chunk = uniqueEvents.slice(i * 9, (i + 1) * 9);

      if (chunk.length > 0) {
        const d1 = new Date(chunk[0].startDateTime || chunk[0].date?.iso);
        const d2 = new Date(chunk[chunk.length - 1].startDateTime || chunk[chunk.length - 1].date?.iso);
        const m1 = d1.toLocaleDateString('en-GB', { month: 'short' });
        const m2 = d2.toLocaleDateString('en-GB', { month: 'short' });
        const shortDate = m1 === m2 ? `${d1.getDate()} - ${d2.getDate()} ${m1}` : `${d1.getDate()} ${m1} - ${d2.getDate()} ${m2}`;
        const fullDate = m1 === m2 ? `${d1.getDate()} - ${d2.getDate()} ${m1} ${d1.getFullYear()}` : `${d1.getDate()} ${m1} - ${d2.getDate()} ${m2} ${d1.getFullYear()}`;

        const isToday = chunk.some((c) => {
          const t = new Date(c.startDateTime || c.date?.iso).getTime();
          return now >= t - 12 * 3600 * 1000 && now <= t + 12 * 3600 * 1000;
        });

        const playedCount = chunk.filter((c) => c.status === 'PostEvent' || typeof c.home?.score === 'string' || typeof c.home?.score === 'number').length;
        const isPlayed = playedCount === chunk.length && chunk.length > 0;
        const isUpcoming = playedCount === 0;
        const status = isToday ? 'live' : isPlayed ? 'played' : 'upcoming';

        // Format fixtures
        const formattedMatches = chunk.map((ev: any) => {
          const homeName = ev.home?.fullName || ev.home?.shortName || 'Home Team';
          const awayName = ev.away?.fullName || ev.away?.shortName || 'Away Team';
          const homeScore = typeof ev.home?.score === 'string' ? parseInt(ev.home.score, 10) : ev.home?.score;
          const awayScore = typeof ev.away?.score === 'string' ? parseInt(ev.away.score, 10) : ev.away?.score;
          const homeHt = ev.home?.runningScores?.halftime ? parseInt(ev.home.runningScores.halftime, 10) : undefined;
          const awayHt = ev.away?.runningScores?.halftime ? parseInt(ev.away.runningScores.halftime, 10) : undefined;

          // Parse goals from actions
          const homeGoals: any[] = [];
          if (Array.isArray(ev.home?.actions)) {
            ev.home.actions.forEach((act: any) => {
              if (act.actionType === 'goal' && Array.isArray(act.actions)) {
                act.actions.forEach((g: any) => {
                  homeGoals.push({
                    playerId: act.playerUrn || '',
                    playerName: act.playerName || 'Player',
                    time: g.timeLabel?.value || '',
                    period: '1',
                    goalType: g.type || 'Goal'
                  });
                });
              }
            });
          }

          const awayGoals: any[] = [];
          if (Array.isArray(ev.away?.actions)) {
            ev.away.actions.forEach((act: any) => {
              if (act.actionType === 'goal' && Array.isArray(act.actions)) {
                act.actions.forEach((g: any) => {
                  awayGoals.push({
                    playerId: act.playerUrn || '',
                    playerName: act.playerName || 'Player',
                    time: g.timeLabel?.value || '',
                    period: '1',
                    goalType: g.type || 'Goal'
                  });
                });
              }
            });
          }

          const fixture = {
            matchId: String(ev.id || ''),
            competition: 'Portuguese Primeira Liga',
            period: ev.status === 'PostEvent' ? 'FullTime' : ev.status === 'MidEvent' ? 'Live' : 'PreMatch',
            kickoff: ev.startDateTime || ev.date?.iso || '',
            kickoffTimezone: 'WEST',
            ground: '',
            clock: ev.time?.accessibleTime ? { label: ev.time.accessibleTime } : undefined,
            attendance: undefined,
            resultType: ev.status === 'PostEvent' ? 'Normal' : undefined,
            homeTeam: {
              id: ev.home?.id || '',
              name: homeName,
              shortName: ev.home?.shortName || homeName,
              score: homeScore,
              halfTimeScore: homeHt,
              badgeUrl: getPrimeiraLigaBadgeUrl(homeName)
            },
            awayTeam: {
              id: ev.away?.id || '',
              name: awayName,
              shortName: ev.away?.shortName || awayName,
              score: awayScore,
              halfTimeScore: awayHt,
              badgeUrl: getPrimeiraLigaBadgeUrl(awayName)
            }
          };

          // Cache in match cache for full details & AI analysis
          primeiraLigaMatchesCache[String(ev.id)] = {
            fixture,
            homeGoals,
            awayGoals,
            homeCards: [],
            awayCards: [],
            previousMeetings: []
          };

          return fixture;
        });

        jornadaMatchesMap[jNum] = formattedMatches;

        jornadas.push({
          matchweek: jNum,
          status,
          dateRange: shortDate,
          fullDateRange: fullDate,
          matchesCount: chunk.length,
          isPlayed,
          isUpcoming,
          isToday
        });
      } else {
        // Projected future Jornadas (13 to 34)
        const baseDate = new Date('2026-12-05T15:00:00Z');
        baseDate.setDate(baseDate.getDate() + (i - 12) * 7);
        const endDate = new Date(baseDate);
        endDate.setDate(endDate.getDate() + 2);
        const m1 = baseDate.toLocaleDateString('en-GB', { month: 'short' });
        const m2 = endDate.toLocaleDateString('en-GB', { month: 'short' });
        const shortDate = m1 === m2 ? `${baseDate.getDate()} - ${endDate.getDate()} ${m1}` : `${baseDate.getDate()} ${m1} - ${endDate.getDate()} ${m2}`;
        const fullDate = `${shortDate} ${baseDate.getFullYear()}`;

        jornadas.push({
          matchweek: jNum,
          status: 'upcoming',
          dateRange: shortDate,
          fullDateRange: fullDate,
          matchesCount: 9,
          isPlayed: false,
          isUpcoming: true,
          isToday: false
        });

        jornadaMatchesMap[jNum] = [];
      }
    }

    const todayJornada = jornadas.find((j) => j.isToday);
    const lastPlayed = [...jornadas].reverse().find((j) => j.isPlayed);
    const recommendedMatchweek = todayJornada ? todayJornada.matchweek : lastPlayed ? lastPlayed.matchweek : 7;

    const scheduleData = {
      seasonSlug: '2026-27',
      seasonLabel: '2026/27',
      recommendedMatchweek,
      hasMatchToday: Boolean(todayJornada),
      todayMatchweek: todayJornada ? todayJornada.matchweek : null,
      lastPlayedMatchweek: lastPlayed ? lastPlayed.matchweek : 7,
      matchweeks: jornadas,
      jornadaMatchesMap
    };

    primeiraLigaScheduleCache = { data: scheduleData, expiresAt: Date.now() + 10 * 60 * 1000 };
    return scheduleData;
  }

  // Primeira Liga Schedule & Date Tracking
  app.get('/api/primeira-liga/season-matchweeks', async (req, res) => {
    try {
      const schedule = await fetchBBCPrimeiraLigaSchedule();
      res.json({
        success: true,
        seasonSlug: schedule.seasonSlug,
        seasonLabel: schedule.seasonLabel,
        recommendedMatchweek: schedule.recommendedMatchweek,
        hasMatchToday: schedule.hasMatchToday,
        todayMatchweek: schedule.todayMatchweek,
        lastPlayedMatchweek: schedule.lastPlayedMatchweek,
        matchweeks: schedule.matchweeks
      });
    } catch (err: any) {
      console.error('Error fetching Primeira Liga schedule:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Primeira Liga Matches for a Jornada
  app.get('/api/primeira-liga/matches', async (req, res) => {
    try {
      const jornada = parseInt(req.query.jornada as string, 10) || 7;
      const schedule = await fetchBBCPrimeiraLigaSchedule();
      const matches = schedule.jornadaMatchesMap[jornada] || [];

      res.json({
        success: true,
        targetUrl: 'https://www.bbc.com/sport/football/portuguese-primeira-liga/scores-fixtures',
        scrapedAt: new Date().toISOString(),
        seasonId: '2026-27',
        seasonLabel: '2026/27',
        compSeasonId: 94,
        matchweekId: jornada,
        maxMatchweeks: 34,
        totalMatches: matches.length,
        htmlMeta: {
          title: `Portuguese Primeira Liga Jornada ${jornada} Fixtures & Results`,
          description: `Portuguese Primeira Liga scores, results and fixtures for Jornada ${jornada} on BBC Sport.`,
          canonicalUrl: 'https://www.bbc.com/sport/football/portuguese-primeira-liga/scores-fixtures'
        },
        matches
      });
    } catch (err: any) {
      console.error('Error fetching Primeira Liga matches:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Primeira Liga Standings Table
  app.get('/api/primeira-liga/table', async (req, res) => {
    try {
      if (primeiraLigaTableCache && Date.now() < primeiraLigaTableCache.expiresAt) {
        return res.json(primeiraLigaTableCache.data);
      }

      const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      };

      const tableRes = await fetchWithTimeout('https://www.bbc.com/sport/football/portuguese-primeira-liga/table', { headers }, 6000);
      let entries: any[] = [];

      if (tableRes.ok) {
        const html = await tableRes.text();
        const m = html.match(/window\.__INITIAL_DATA__\s*=\s*("(?:\\.|[^"\\])*"|{.*?});/s);
        if (m) {
          let raw = m[1];
          let data = raw.startsWith('"') ? JSON.parse(JSON.parse(raw)) : JSON.parse(raw);
          const ftKey = Object.keys(data.data || {}).find((k) => k.startsWith('football-table'));
          const participants = data.data?.[ftKey]?.data?.tournaments?.[0]?.stages?.[0]?.rounds?.[0]?.participants || [];

          entries = participants.map((p: any) => ({
            position: p.rank,
            team: {
              id: p.urn || String(p.rank),
              name: p.name || 'Team',
              shortName: p.shortName || p.name || '',
              badgeUrl: getPrimeiraLigaBadgeUrl(p.name)
            },
            played: p.matchesPlayed || 0,
            won: p.wins || 0,
            drawn: p.draws || 0,
            lost: p.losses || 0,
            goalsFor: p.goalsScoredFor || 0,
            goalsAgainst: p.goalsScoredAgainst || 0,
            goalDifference: p.goalDifference || 0,
            points: p.points || 0,
            formGuide: p.formGuide?.map((f: any) => f.value).join('') || '',
            qualification: p.rank <= 2 ? 'Champions League' : p.rank <= 3 ? 'Europa League' : p.rank <= 5 ? 'Conference League' : p.rank === 16 ? 'Relegation Playoff' : p.rank >= 17 ? 'Relegation' : undefined
          }));
        }
      }

      const responsePayload = {
        success: true,
        targetUrl: 'https://www.bbc.com/sport/football/portuguese-primeira-liga/table',
        seasonId: '2026-27',
        seasonLabel: '2026/27',
        compSeasonId: 94,
        matchweekId: 'all',
        entries
      };

      primeiraLigaTableCache = { data: responsePayload, expiresAt: Date.now() + 10 * 60 * 1000 };
      res.json(responsePayload);
    } catch (err: any) {
      console.error('Error fetching Primeira Liga table:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Primeira Liga Stats (Scorers, Assists, Cleansheets)
  app.get('/api/primeira-liga/stats', (req, res) => {
    const statsPayload = {
      success: true,
      targetUrl: 'https://www.bbc.com/sport/football/portuguese-primeira-liga',
      seasonId: '2026-27',
      seasonLabel: '2026/27',
      compSeasonId: 94,
      playerCategories: {
        goals: {
          category: 'goals',
          categoryLabel: 'Top Goalscorers',
          unit: 'Goals',
          entries: [
            { rank: 1, playerName: 'Viktor Gyökeres', clubName: 'Sporting CP', statValue: 8, nationality: 'Sweden', position: 'Forward', badgeUrl: getPrimeiraLigaBadgeUrl('Sporting CP') },
            { rank: 2, playerName: 'Galeno', clubName: 'FC Porto', statValue: 6, nationality: 'Brazil', position: 'Forward', badgeUrl: getPrimeiraLigaBadgeUrl('FC Porto') },
            { rank: 3, playerName: 'Samu Omorodion', clubName: 'FC Porto', statValue: 5, nationality: 'Spain', position: 'Forward', badgeUrl: getPrimeiraLigaBadgeUrl('FC Porto') },
            { rank: 4, playerName: 'Vangelis Pavlidis', clubName: 'SL Benfica', statValue: 5, nationality: 'Greece', position: 'Forward', badgeUrl: getPrimeiraLigaBadgeUrl('SL Benfica') },
            { rank: 5, playerName: 'André Clóvis', clubName: 'Académico de Viseu', statValue: 4, nationality: 'Brazil', position: 'Forward', badgeUrl: getPrimeiraLigaBadgeUrl('Académico de Viseu') },
            { rank: 6, playerName: 'Kerem Aktürkoğlu', clubName: 'SL Benfica', statValue: 4, nationality: 'Turkey', position: 'Forward', badgeUrl: getPrimeiraLigaBadgeUrl('SL Benfica') },
            { rank: 7, playerName: 'Pedro Gonçalves', clubName: 'Sporting CP', statValue: 4, nationality: 'Portugal', position: 'Midfielder', badgeUrl: getPrimeiraLigaBadgeUrl('Sporting CP') },
            { rank: 8, playerName: 'Clayton', clubName: 'Rio Ave FC', statValue: 3, nationality: 'Brazil', position: 'Forward', badgeUrl: getPrimeiraLigaBadgeUrl('Rio Ave FC') },
            { rank: 9, playerName: 'Ricardo Horta', clubName: 'SC Braga', statValue: 3, nationality: 'Portugal', position: 'Forward', badgeUrl: getPrimeiraLigaBadgeUrl('SC Braga') },
            { rank: 10, playerName: 'Kikas', clubName: 'CF Estrela da Amadora', statValue: 3, nationality: 'Portugal', position: 'Forward', badgeUrl: getPrimeiraLigaBadgeUrl('CF Estrela da Amadora') }
          ]
        },
        assists: {
          category: 'assists',
          categoryLabel: 'Top Assists',
          unit: 'Assists',
          entries: [
            { rank: 1, playerName: 'Francisco Trincão', clubName: 'Sporting CP', statValue: 5, nationality: 'Portugal', position: 'Forward', badgeUrl: getPrimeiraLigaBadgeUrl('Sporting CP') },
            { rank: 2, playerName: 'Ángel Di María', clubName: 'SL Benfica', statValue: 4, nationality: 'Argentina', position: 'Forward', badgeUrl: getPrimeiraLigaBadgeUrl('SL Benfica') },
            { rank: 3, playerName: 'Nico González', clubName: 'FC Porto', statValue: 4, nationality: 'Spain', position: 'Midfielder', badgeUrl: getPrimeiraLigaBadgeUrl('FC Porto') },
            { rank: 4, playerName: 'Rodrigo Zalazar', clubName: 'SC Braga', statValue: 3, nationality: 'Uruguay', position: 'Midfielder', badgeUrl: getPrimeiraLigaBadgeUrl('SC Braga') },
            { rank: 5, playerName: 'Nuno Santos', clubName: 'Sporting CP', statValue: 3, nationality: 'Portugal', position: 'Midfielder', badgeUrl: getPrimeiraLigaBadgeUrl('Sporting CP') }
          ]
        },
        clean_sheets: {
          category: 'clean_sheets',
          categoryLabel: 'Clean Sheets',
          unit: 'Clean sheets',
          entries: [
            { rank: 1, playerName: 'Diogo Costa', clubName: 'FC Porto', statValue: 5, nationality: 'Portugal', position: 'Goalkeeper', badgeUrl: getPrimeiraLigaBadgeUrl('FC Porto') },
            { rank: 2, playerName: 'Anatoliy Trubin', clubName: 'SL Benfica', statValue: 4, nationality: 'Ukraine', position: 'Goalkeeper', badgeUrl: getPrimeiraLigaBadgeUrl('SL Benfica') },
            { rank: 3, playerName: 'Gabriel Batista', clubName: 'CD Santa Clara', statValue: 4, nationality: 'Brazil', position: 'Goalkeeper', badgeUrl: getPrimeiraLigaBadgeUrl('CD Santa Clara') },
            { rank: 4, playerName: 'Franco Israel', clubName: 'Sporting CP', statValue: 3, nationality: 'Uruguay', position: 'Goalkeeper', badgeUrl: getPrimeiraLigaBadgeUrl('Sporting CP') },
            { rank: 5, playerName: 'Bruno Varela', clubName: 'Vitória SC', statValue: 3, nationality: 'Cape Verde', position: 'Goalkeeper', badgeUrl: getPrimeiraLigaBadgeUrl('Vitória SC') }
          ]
        }
      },
      teamCategories: {
        goals: {
          category: 'goals',
          categoryLabel: 'Team Goals Scored',
          unit: 'Goals',
          entries: [
            { rank: 1, teamName: 'SL Benfica', statValue: 22, badgeUrl: getPrimeiraLigaBadgeUrl('SL Benfica') },
            { rank: 2, teamName: 'FC Porto', statValue: 18, badgeUrl: getPrimeiraLigaBadgeUrl('FC Porto') },
            { rank: 3, teamName: 'Sporting CP', statValue: 17, badgeUrl: getPrimeiraLigaBadgeUrl('Sporting CP') },
            { rank: 4, teamName: 'CD Santa Clara', statValue: 11, badgeUrl: getPrimeiraLigaBadgeUrl('CD Santa Clara') },
            { rank: 5, teamName: 'FC Arouca', statValue: 10, badgeUrl: getPrimeiraLigaBadgeUrl('FC Arouca') }
          ]
        }
      }
    };
    res.json(statsPayload);
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

        const resolvedClub = resolveClub(teamName) || resolveClub(shortName) || resolveClub(teamId);

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
                    const resolvedClub = resolveClub(clubName) || resolveClub(clubId);
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

  // API Route: Comprehensive Match Full Details (Fixture, H2H, Scorers, Cards, Lineups)
  const handleMatchDetailsRequest = async (req: express.Request, res: express.Response) => {
    try {
      const matchId = (req.params.matchId || req.query.matchId) as string;
      if (!matchId) {
        return res.status(400).json({ error: 'matchId is required' });
      }

      if (primeiraLigaMatchesCache[matchId]) {
        const pMatch = primeiraLigaMatchesCache[matchId];
        return res.json({
          success: true,
          matchId,
          fixture: pMatch.fixture,
          previousMeetings: pMatch.previousMeetings || [],
          homeGoals: pMatch.homeGoals || [],
          awayGoals: pMatch.awayGoals || [],
          homeCards: pMatch.homeCards || [],
          awayCards: pMatch.awayCards || [],
          lineups: pMatch.lineups || null
        });
      }

      const headers = {
        'Origin': 'https://www.premierleague.com',
        'Referer': 'https://www.premierleague.com/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      };

      // 1. Fetch fixture from SDP or FootballAPI
      let fixture: any = null;
      let sdpRaw: any = null;

      try {
        const sdpRes = await fetchWithTimeout(`https://sdp-prem-prod.premier-league-prod.pulselive.com/api/v1/matches/${matchId}`, { headers }, 4500);
        if (sdpRes.ok) {
          sdpRaw = await sdpRes.json();
          const home = sdpRaw.homeTeam || {};
          const away = sdpRaw.awayTeam || {};
          const homeId = home.id ? String(home.id) : '';
          const awayId = away.id ? String(away.id) : '';
          const homeClub = resolveClub(home.name) || resolveClub(home.shortName) || resolveClub(homeId);
          const awayClub = resolveClub(away.name) || resolveClub(away.shortName) || resolveClub(awayId);

          fixture = {
            matchId: String(sdpRaw.matchId || matchId),
            competition: sdpRaw.competition || 'Premier League',
            period: sdpRaw.period || 'PreMatch',
            kickoff: sdpRaw.kickoff || '',
            kickoffTimezone: sdpRaw.kickoffTimezone || 'BST',
            ground: sdpRaw.ground || '',
            clock: sdpRaw.clock,
            attendance: sdpRaw.attendance,
            resultType: sdpRaw.resultType,
            tbc: sdpRaw.tbc,
            homeTeam: {
              id: homeClub ? homeClub.id : homeId,
              name: homeClub ? homeClub.name : (home.name || 'Unknown Home'),
              shortName: homeClub ? homeClub.shortName : (home.shortName || home.name || ''),
              score: typeof home.score === 'number' ? home.score : undefined,
              halfTimeScore: typeof home.halfTimeScore === 'number' ? home.halfTimeScore : undefined,
              redCards: home.redCards,
              badgeUrl: homeClub ? homeClub.badgeUrl : getVerifiedBadgeUrl(homeId || home.name)
            },
            awayTeam: {
              id: awayClub ? awayClub.id : awayId,
              name: awayClub ? awayClub.name : (away.name || 'Unknown Away'),
              shortName: awayClub ? awayClub.shortName : (away.shortName || away.name || ''),
              score: typeof away.score === 'number' ? away.score : undefined,
              halfTimeScore: typeof away.halfTimeScore === 'number' ? away.halfTimeScore : undefined,
              redCards: away.redCards,
              badgeUrl: awayClub ? awayClub.badgeUrl : getVerifiedBadgeUrl(awayId || away.name)
            }
          };
        }
      } catch (err) {
        console.warn(`SDP fixture lookup for match ${matchId} failed, trying footballapi:`, err);
      }

      // If SDP failed or not found, try FootballAPI
      if (!fixture) {
        try {
          const fbRes = await fetchWithTimeout(`https://footballapi.pulselive.com/football/fixtures/${matchId}`, { headers }, 4500);
          if (fbRes.ok) {
            const fbData = await fbRes.json();
            const home = fbData.teams?.[0] || {};
            const away = fbData.teams?.[1] || {};
            const homeId = home.team?.id ? String(home.team.id) : '';
            const awayId = away.team?.id ? String(away.team.id) : '';
            const homeClub = resolveClub(home.team?.name) || resolveClub(home.team?.shortName) || resolveClub(homeId);
            const awayClub = resolveClub(away.team?.name) || resolveClub(away.team?.shortName) || resolveClub(awayId);
            const isPlayed = fbData.status === 'C';

            fixture = {
              matchId: String(fbData.id || matchId),
              competition: 'Premier League',
              period: isPlayed ? 'FullTime' : fbData.status === 'L' ? 'Live' : 'PreMatch',
              kickoff: fbData.kickoff?.millis ? new Date(fbData.kickoff.millis).toISOString() : '',
              kickoffTimezone: 'BST',
              ground: fbData.ground?.name || '',
              attendance: fbData.attendance,
              resultType: isPlayed ? 'Normal' : undefined,
              homeTeam: {
                id: homeClub ? homeClub.id : homeId,
                name: homeClub ? homeClub.name : (home.team?.name || 'Unknown Home'),
                shortName: homeClub ? homeClub.shortName : (home.team?.shortName || home.team?.name || ''),
                score: typeof home.score === 'number' ? home.score : undefined,
                halfTimeScore: typeof home.halfTimeScore === 'number' ? home.halfTimeScore : undefined,
                badgeUrl: homeClub ? homeClub.badgeUrl : getVerifiedBadgeUrl(homeId || home.team?.name)
              },
              awayTeam: {
                id: awayClub ? awayClub.id : awayId,
                name: awayClub ? awayClub.name : (away.team?.name || 'Unknown Away'),
                shortName: awayClub ? awayClub.shortName : (away.team?.shortName || away.team?.name || ''),
                score: typeof away.score === 'number' ? away.score : undefined,
                halfTimeScore: typeof away.halfTimeScore === 'number' ? away.halfTimeScore : undefined,
                badgeUrl: awayClub ? awayClub.badgeUrl : getVerifiedBadgeUrl(awayId || away.team?.name)
              }
            };
          }
        } catch (fbErr) {
          console.warn(`FootballAPI fixture lookup for match ${matchId} failed:`, fbErr);
        }
      }

      // 2. Fetch Preview, Events, and Lineups in parallel
      const [previewRes, eventsRes, lineupsRes] = await Promise.all([
        fetchWithTimeout(`https://sdp-prem-prod.premier-league-prod.pulselive.com/api/v1/matches/${matchId}/preview`, { headers }, 4500).catch(() => null),
        fetchWithTimeout(`https://sdp-prem-prod.premier-league-prod.pulselive.com/api/v1/matches/${matchId}/events`, { headers }, 4500).catch(() => null),
        fetchWithTimeout(`https://sdp-prem-prod.premier-league-prod.pulselive.com/api/v1/matches/${matchId}/lineups`, { headers }, 4500).catch(() => null)
      ]);

      let previousMeetings: any[] = [];
      if (previewRes && previewRes.ok) {
        try {
          const previewData = await previewRes.json();
          previousMeetings = previewData.previousMeetings || [];
        } catch (_) {}
      }

      // Build player map for name resolution
      const playerMap: Record<string, string> = {};
      let lineups: any = null;

      if (lineupsRes && lineupsRes.ok) {
        try {
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

            if (lineupsData.length >= 2) {
              const parseTeamLineup = (tl: any) => {
                const players = Array.isArray(tl.players) ? tl.players : [];
                return {
                  formation: tl.formation || '',
                  starting: players.filter((p: any) => !p.sub).map((p: any) => ({
                    id: String(p.id || ''),
                    name: `${p.firstName ? p.firstName + ' ' : ''}${p.lastName || ''}`.trim() || `Player #${p.id}`,
                    position: p.position || '',
                    number: p.number,
                    captain: Boolean(p.captain)
                  })),
                  substitutes: players.filter((p: any) => p.sub).map((p: any) => ({
                    id: String(p.id || ''),
                    name: `${p.firstName ? p.firstName + ' ' : ''}${p.lastName || ''}`.trim() || `Player #${p.id}`,
                    position: p.position || '',
                    number: p.number
                  }))
                };
              };
              lineups = {
                home: parseTeamLineup(lineupsData[0]),
                away: parseTeamLineup(lineupsData[1])
              };
            }
          }
        } catch (_) {}
      }

      let homeGoals: any[] = [];
      let awayGoals: any[] = [];
      let homeCards: any[] = [];
      let awayCards: any[] = [];

      if (eventsRes && eventsRes.ok) {
        try {
          const eventsData = await eventsRes.json();
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
        } catch (_) {}
      }

      // If no goals/cards found via SDP events (e.g. historical match), fetch from footballapi
      if (homeGoals.length === 0 && awayGoals.length === 0) {
        try {
          const fbRes = await fetchWithTimeout(`https://footballapi.pulselive.com/football/fixtures/${matchId}`, { headers }, 4500);
          if (fbRes.ok) {
            const fbData = await fbRes.json();
            if (Array.isArray(fbData.events)) {
              for (const ev of fbData.events) {
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
        success: true,
        matchId,
        fixture,
        previousMeetings,
        homeGoals,
        awayGoals,
        homeCards,
        awayCards,
        lineups
      });
    } catch (error: any) {
      console.error('Error fetching full match details:', error);
      res.status(500).json({ error: error.message || 'Error fetching match full details' });
    }
  };

  app.get('/api/match-details', handleMatchDetailsRequest);
  app.get('/api/match/:matchId', handleMatchDetailsRequest);

  // Gemini AI Match Analysis
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  const aiAnalysisCache = new Map<string, { analysis: string; timestamp: number }>();

  // POST endpoint: Generate or retrieve AI Analysis
  app.post('/api/match/:matchId/ai-analysis', async (req, res) => {
    try {
      const matchId = String(req.params.matchId || req.body.matchId || '');
      const pMatch = primeiraLigaMatchesCache[matchId];
      const {
        homeTeam = pMatch?.fixture?.homeTeam?.name || 'Home Team',
        awayTeam = pMatch?.fixture?.awayTeam?.name || 'Away Team',
        competition = pMatch ? 'Portuguese Primeira Liga' : 'Premier League',
        date = pMatch?.fixture?.kickoff || 'Upcoming Match',
        ground = '',
        forceRefresh = false
      } = req.body;

      if (!matchId) {
        return res.status(400).json({ error: 'matchId is required' });
      }

      if (!forceRefresh && aiAnalysisCache.has(matchId)) {
        const cached = aiAnalysisCache.get(matchId)!;
        if (Date.now() - cached.timestamp < 4 * 60 * 60 * 1000) {
          return res.json({
            success: true,
            matchId,
            analysis: cached.analysis,
            cached: true,
            timestamp: cached.timestamp
          });
        }
      }

      const prompt = `You are an expert football analyst. Do a deep, data driven analysis of the match below and give me probability-based predictions.
Match: ${homeTeam} vs ${awayTeam}
Competition: ${competition}
Date: ${date}${ground ? `\nVenue: ${ground}` : ''}
Search for the latest stats and team news before answering. Cite your sources and say clearly when data is missing or uncertain. Do not invent numbers.
1. Core Performance Data
For both teams, cover:
xG and xGA (season and last 5-10 matches)
Shots, shots on target, big chances created and conceded
Possession quality: progressive passes, final-third entries, PPDA (pressing intensity)
Set pieces: goals scored and conceded, main set piece takers and aerial threats
2. Form and Context
Last 5-10 results, weighted by opponent strength
Home record for ${homeTeam} vs away record for ${awayTeam}
Head-to-head history, focusing on recent meetings and current coaches
League position and what is at stake for each side (title, Europe, relegation, nothing to play for)
3. Squad Factors
Injuries, suspensions, and returning players
Likely lineups and formations
Key player roles and form (main striker, playmaker, goalkeeper)
Squad depth and rotation risk
Fatigue: days since last match, travel distance, European or cup fixtures
4. Tactical Matchup
Each team's style of play and how the two styles interact
Manager tendencies in big games or against stronger/weaker opponents
Specific weaknesses to exploit (e.g. slow centre back vs fast winger)
Key one-on-one battles
5. Outside Factors
Referee: average cards and penalties per game
Weather, pitch, and crowd/atmosphere
Motivation, team morale, and any recent managerial change
6. Prediction
Give me:
1. Win / Draw / Loss probabilities (must add up to 100%)
2. Most likely scoreline plus 2 alternative scorelines
3. Goals markets: over/under 2.5, both teams to score
4. Key player to watch for each team
5. Confidence level (low / medium / high) and why
6. Value check: compare your probabilities with current bookmaker odds and flag any value
7. Biggest risks: what could make this prediction wrong (injury news, red card, weather, etc.)
Output Format
Use clear headings for each section
Finish with a short summary table of the prediction
Remember football is low-scoring and high variance: treat everything as probabilities, not certainties`;

      let responseText = '';
      let usedModel = '';
      const candidateModels = ['gemini-2.5-flash', 'gemini-3.8-flash', 'gemini-flash-latest'];
      let lastError: any = null;

      for (const model of candidateModels) {
        try {
          const aiResponse = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
              tools: [{ googleSearch: {} }]
            }
          });
          if (aiResponse.text) {
            responseText = aiResponse.text;
            usedModel = model;
            break;
          }
        } catch (err: any) {
          lastError = err;
          // If search tool had issue or rate limited, try basic prompt
          try {
            const fallbackResponse = await ai.models.generateContent({
              model,
              contents: prompt
            });
            if (fallbackResponse.text) {
              responseText = fallbackResponse.text;
              usedModel = model;
              break;
            }
          } catch (innerErr: any) {
            lastError = innerErr;
          }
        }
      }

      if (!responseText) {
        throw lastError || new Error('Failed to generate match analysis');
      }

      aiAnalysisCache.set(matchId, { analysis: responseText, timestamp: Date.now() });

      res.json({
        success: true,
        matchId,
        analysis: responseText,
        model: usedModel,
        cached: false,
        timestamp: Date.now()
      });
    } catch (error: any) {
      console.error('Error generating AI match analysis:', error);
      res.status(500).json({
        error: error.message || 'Error generating AI match analysis'
      });
    }
  });

  // GET endpoint: Check if AI analysis is already cached
  app.get('/api/match/:matchId/ai-analysis', (req, res) => {
    const matchId = String(req.params.matchId || '');
    if (aiAnalysisCache.has(matchId)) {
      const cached = aiAnalysisCache.get(matchId)!;
      return res.json({
        success: true,
        matchId,
        analysis: cached.analysis,
        cached: true,
        timestamp: cached.timestamp
      });
    }
    return res.json({ success: false, cached: false });
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
