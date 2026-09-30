import { ScrapeResponse, MatchPreview, StandingsResponse, StatsOverviewResponse, MatchFullDetailsResponse, SeasonScheduleResponse } from '../types';
import { ALL_SEASONS, findSeasonBySlug } from '../data/seasons';
import { getFallbackStandings, getFallbackStatsOverview } from '../data/canonicalStats';

export async function fetchSeasonMatchweeks(seasonSlug: string): Promise<SeasonScheduleResponse> {
  try {
    const res = await fetch(`/api/season-matchweeks?season=${encodeURIComponent(seasonSlug)}`);
    if (res.ok) {
      const data: SeasonScheduleResponse = await res.json();
      if (data && data.success && Array.isArray(data.matchweeks) && data.matchweeks.length > 0) {
        return data;
      }
    }
  } catch (err) {
    console.warn('Backend /api/season-matchweeks request failed:', err);
  }

  // Fallback client generation
  const season = findSeasonBySlug(seasonSlug);
  const maxMws = season.maxMatchweeks || 38;
  const matchweeks = Array.from({ length: maxMws }, (_, i) => {
    const mw = i + 1;
    const isPlayed = !season.isCurrent || mw <= 5;
    return {
      matchweek: mw,
      status: isPlayed ? ('played' as const) : ('upcoming' as const),
      dateRange: `MW ${mw}`,
      fullDateRange: `Matchweek ${mw}`,
      matchesCount: 10,
      isPlayed,
      isUpcoming: !isPlayed,
      isToday: false
    };
  });

  const lastPlayed = matchweeks.filter((m) => m.isPlayed).pop();

  return {
    success: true,
    seasonSlug,
    seasonLabel: season.label,
    recommendedMatchweek: lastPlayed ? lastPlayed.matchweek : 1,
    hasMatchToday: false,
    todayMatchweek: null,
    lastPlayedMatchweek: lastPlayed ? lastPlayed.matchweek : null,
    matchweeks
  };
}

export async function fetchStatsOverview(seasonSlug: string, category?: string, type?: 'player' | 'team' | 'all'): Promise<StatsOverviewResponse> {
  const params = new URLSearchParams();
  params.set('season', seasonSlug);
  if (category) params.set('category', category);
  if (type) params.set('type', type);

  try {
    const res = await fetch(`/api/stats?${params.toString()}`);
    if (res.ok) {
      const data: StatsOverviewResponse = await res.json();
      if (data && (Object.keys(data.playerCategories || {}).length > 0 || Object.keys(data.teamCategories || {}).length > 0)) {
        return data;
      }
    }
  } catch (err) {
    console.warn('Backend /api/stats request failed:', err);
  }

  // Client-side guaranteed fallback
  return getFallbackStatsOverview(seasonSlug);
}

export async function fetchStatsByUrl(targetUrl: string): Promise<StatsOverviewResponse> {
  try {
    const res = await fetch(`/api/stats?url=${encodeURIComponent(targetUrl)}`);
    if (res.ok) {
      const data: StatsOverviewResponse = await res.json();
      return data;
    }
  } catch (err) {
    console.warn('Backend /api/stats by url failed:', err);
  }

  return getFallbackStatsOverview('2024-25');
}

export async function fetchLeagueTable(seasonSlug: string, matchweek: number | 'all'): Promise<StandingsResponse> {
  const mwParam = matchweek === 'all' ? 'all' : matchweek;
  
  try {
    const res = await fetch(`/api/tables?season=${encodeURIComponent(seasonSlug)}&matchweek=${mwParam}`);
    if (res.ok) {
      const data: StandingsResponse = await res.json();
      if (data && Array.isArray(data.entries) && data.entries.length > 0) {
        return data;
      }
    }
  } catch (err) {
    console.warn('Backend /api/tables request failed:', err);
  }

  // Client-side guaranteed fallback
  return getFallbackStandings(seasonSlug, matchweek);
}

export async function fetchTableByUrl(targetUrl: string): Promise<StandingsResponse> {
  try {
    const res = await fetch(`/api/tables?url=${encodeURIComponent(targetUrl)}`);
    if (res.ok) {
      const data: StandingsResponse = await res.json();
      if (data && Array.isArray(data.entries) && data.entries.length > 0) {
        return data;
      }
    }
  } catch (err) {
    console.warn('Backend /api/tables by url failed:', err);
  }

  return getFallbackStandings('2024-25', 'all');
}

export async function fetchMatchweekMatches(seasonSlug: string, matchweek: number): Promise<ScrapeResponse> {
  const targetUrl = `https://www.premierleague.com/en/matches/premier-league/${seasonSlug}/matchweek-${matchweek}`;
  try {
    const res = await fetch(`/api/scrape?season=${encodeURIComponent(seasonSlug)}&matchweek=${matchweek}`);
    if (res.ok) {
      const data: ScrapeResponse = await res.json();
      return data;
    }
  } catch (err) {
    console.warn('Backend /api/scrape request failed, falling back to direct API fetch:', err);
  }

  // Fallback direct extraction
  return scrapePremierLeagueUrl(targetUrl);
}

export async function scrapePremierLeagueUrl(targetUrl: string): Promise<ScrapeResponse> {
  try {
    const encodedUrl = encodeURIComponent(targetUrl);
    const res = await fetch(`/api/scrape?url=${encodedUrl}`);
    if (res.ok) {
      const data: ScrapeResponse = await res.json();
      return data;
    }
  } catch (err) {
    console.warn('Backend /api/scrape request failed, falling back to direct API fetch:', err);
  }

  // Fallback direct extraction
  let seasonSlug = '2026-27';
  let matchweekId = 1;

  try {
    const urlObj = new URL(targetUrl);
    const parts = urlObj.pathname.split('/').filter(Boolean);
    const mwPart = parts.find(p => p.startsWith('matchweek-'));
    if (mwPart) {
      const mwNum = parseInt(mwPart.replace('matchweek-', ''), 10);
      if (!isNaN(mwNum)) matchweekId = mwNum;
    }
    const seasonPart = parts.find(p => /^\d{4}-\d{2}$/.test(p));
    if (seasonPart) {
      seasonSlug = seasonPart;
    }
  } catch (e) {
    console.error('URL parse error:', e);
  }

  const seasonInfo = findSeasonBySlug(seasonSlug);

  // If modern season, fetch SDP
  if (seasonInfo.startYear >= 2008) {
    const directApiUrl = `https://sdp-prem-prod.premier-league-prod.pulselive.com/api/v1/competitions/8/seasons/${seasonInfo.startYear}/matchweeks/${matchweekId}/matches`;
    try {
      const directRes = await fetch(directApiUrl, {
        headers: {
          'Origin': 'https://www.premierleague.com',
          'Referer': 'https://www.premierleague.com/'
        }
      });

      if (directRes.ok) {
        const json = await directRes.json();
        const rawMatches = json.data || [];

        const matches = rawMatches.map((m: any) => ({
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
            id: m.homeTeam?.id ? String(m.homeTeam.id) : '',
            name: m.homeTeam?.name || 'Unknown Home',
            shortName: m.homeTeam?.shortName || m.homeTeam?.name || '',
            score: typeof m.homeTeam?.score === 'number' ? m.homeTeam.score : undefined,
            halfTimeScore: typeof m.homeTeam?.halfTimeScore === 'number' ? m.homeTeam.halfTimeScore : undefined,
            redCards: m.homeTeam?.redCards,
            badgeUrl: m.homeTeam?.id ? `https://resources.premierleague.com/premierleague/badges/70/t${m.homeTeam.id}.png` : ''
          },
          awayTeam: {
            id: m.awayTeam?.id ? String(m.awayTeam.id) : '',
            name: m.awayTeam?.name || 'Unknown Away',
            shortName: m.awayTeam?.shortName || m.awayTeam?.name || '',
            score: typeof m.awayTeam?.score === 'number' ? m.awayTeam.score : undefined,
            halfTimeScore: typeof m.awayTeam?.halfTimeScore === 'number' ? m.awayTeam.halfTimeScore : undefined,
            redCards: m.awayTeam?.redCards,
            badgeUrl: m.awayTeam?.id ? `https://resources.premierleague.com/premierleague/badges/70/t${m.awayTeam.id}.png` : ''
          }
        }));

        return {
          success: true,
          targetUrl,
          scrapedAt: new Date().toISOString(),
          seasonId: seasonInfo.slug,
          seasonLabel: seasonInfo.label,
          matchweekId,
          totalMatches: matches.length,
          htmlMeta: {
            title: `Premier League Fixtures Season ${seasonInfo.label}`,
            description: `View Premier League fixtures for season ${seasonInfo.label}, matchweek ${matchweekId}.`,
            canonicalUrl: targetUrl
          },
          matches,
          rawMatches
        };
      }
    } catch (_) {}
  }

  // Fallback to footballapi
  const gwRes = await fetch(`https://footballapi.pulselive.com/football/compseasons/${seasonInfo.compSeasonId}/gameweeks`, {
    headers: { 'Origin': 'https://www.premierleague.com' }
  });
  const gwData = await gwRes.json();
  const gameweeksList = gwData.gameweeks || [];
  const targetGw = gameweeksList.find((g: any) => g.gameweek === matchweekId) || gameweeksList[matchweekId - 1] || gameweeksList[0];

  const fRes = await fetch(`https://footballapi.pulselive.com/football/fixtures?comps=1&compSeasons=${seasonInfo.compSeasonId}&gameweeks=${targetGw.id}&pageSize=50`, {
    headers: { 'Origin': 'https://www.premierleague.com' }
  });
  const fData = await fRes.json();
  const rawMatches = fData.content || [];

  const matches = rawMatches.map((m: any) => {
    const home = m.teams?.[0] || {};
    const away = m.teams?.[1] || {};
    const isPlayed = m.status === 'C';
    const homeId = home.team?.id ? String(home.team.id) : '';
    const awayId = away.team?.id ? String(away.team.id) : '';

    return {
      matchId: String(m.id || ''),
      competition: 'Premier League',
      period: isPlayed ? 'FullTime' : m.status === 'L' ? 'Live' : 'PreMatch',
      kickoff: m.kickoff?.millis ? new Date(m.kickoff.millis).toISOString() : '',
      kickoffLabel: m.kickoff?.label || '',
      kickoffTimezone: 'BST',
      ground: m.ground?.name || '',
      attendance: m.attendance,
      resultType: isPlayed ? 'Normal' : undefined,
      homeTeam: {
        id: homeId,
        name: home.team?.name || 'Unknown Home',
        shortName: home.team?.shortName || home.team?.name || '',
        score: typeof home.score === 'number' ? home.score : undefined,
        halfTimeScore: typeof home.halfTimeScore === 'number' ? home.halfTimeScore : undefined,
        badgeUrl: homeId ? `https://resources.premierleague.com/premierleague/badges/70/t${homeId}.png` : ''
      },
      awayTeam: {
        id: awayId,
        name: away.team?.name || 'Unknown Away',
        shortName: away.team?.shortName || away.team?.name || '',
        score: typeof away.score === 'number' ? away.score : undefined,
        halfTimeScore: typeof away.halfTimeScore === 'number' ? away.halfTimeScore : undefined,
        badgeUrl: awayId ? `https://resources.premierleague.com/premierleague/badges/70/t${awayId}.png` : ''
      }
    };
  });

  return {
    success: true,
    targetUrl,
    scrapedAt: new Date().toISOString(),
    seasonId: seasonInfo.slug,
    seasonLabel: seasonInfo.label,
    matchweekId,
    totalMatches: matches.length,
    htmlMeta: {
      title: `Premier League Fixtures Season ${seasonInfo.label}`,
      description: `View Premier League fixtures for season ${seasonInfo.label}, matchweek ${matchweekId}.`,
      canonicalUrl: targetUrl
    },
    matches,
    rawMatches
  };
}

export async function fetchMatchPreview(matchId: string): Promise<MatchPreview | null> {
  try {
    const res = await fetch(`/api/match-preview?matchId=${matchId}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend match preview failed, trying direct:', err);
  }

  try {
    const directRes = await fetch(`https://sdp-prem-prod.premier-league-prod.pulselive.com/api/v1/matches/${matchId}/preview`, {
      headers: {
        'Origin': 'https://www.premierleague.com',
        'Referer': 'https://www.premierleague.com/'
      }
    });
    if (directRes.ok) {
      const data = await directRes.json();
      return {
        matchId,
        previousMeetings: data.previousMeetings || []
      };
    }
  } catch (e) {
    console.error('Failed to fetch preview direct:', e);
  }

  return null;
}

export async function fetchMatchFullDetails(matchId: string): Promise<MatchFullDetailsResponse | null> {
  try {
    const res = await fetch(`/api/match-details?matchId=${matchId}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend match full details request failed:', err);
  }

  // Fallback: try match preview if full details endpoint failed
  try {
    const preview = await fetchMatchPreview(matchId);
    if (preview) {
      return {
        success: true,
        matchId,
        previousMeetings: preview.previousMeetings || [],
        homeGoals: preview.homeGoals || [],
        awayGoals: preview.awayGoals || [],
        homeCards: preview.homeCards || [],
        awayCards: preview.awayCards || []
      };
    }
  } catch (e) {
    console.error('Fallback preview failed:', e);
  }

  return null;
}

export async function fetchPrimeiraLigaMatchweeks(): Promise<SeasonScheduleResponse> {
  try {
    const res = await fetch('/api/primeira-liga/season-matchweeks');
    if (res.ok) {
      const data: SeasonScheduleResponse = await res.json();
      if (data && data.success && Array.isArray(data.matchweeks) && data.matchweeks.length > 0) {
        return data;
      }
    }
  } catch (err) {
    console.warn('Backend /api/primeira-liga/season-matchweeks failed:', err);
  }

  // Fallback
  const matchweeks = Array.from({ length: 34 }, (_, i) => {
    const mw = i + 1;
    const isPlayed = mw <= 7;
    return {
      matchweek: mw,
      status: isPlayed ? ('played' as const) : ('upcoming' as const),
      dateRange: `Jornada ${mw}`,
      fullDateRange: `Jornada ${mw}`,
      matchesCount: 9,
      isPlayed,
      isUpcoming: !isPlayed,
      isToday: false
    };
  });

  return {
    success: true,
    seasonSlug: '2026-27',
    seasonLabel: '2026/27',
    recommendedMatchweek: 7,
    hasMatchToday: false,
    todayMatchweek: null,
    lastPlayedMatchweek: 7,
    matchweeks
  };
}

export async function fetchPrimeiraLigaMatches(jornada: number): Promise<ScrapeResponse> {
  try {
    const res = await fetch(`/api/primeira-liga/matches?jornada=${jornada}`);
    if (res.ok) {
      const data: ScrapeResponse = await res.json();
      if (data && Array.isArray(data.matches)) {
        return data;
      }
    }
  } catch (err) {
    console.warn('Backend /api/primeira-liga/matches failed:', err);
  }

  return {
    success: true,
    targetUrl: 'https://www.bbc.com/sport/football/portuguese-primeira-liga/scores-fixtures',
    scrapedAt: new Date().toISOString(),
    seasonId: '2026-27',
    seasonLabel: '2026/27',
    compSeasonId: 94,
    matchweekId: jornada,
    maxMatchweeks: 34,
    totalMatches: 0,
    htmlMeta: {
      title: `Portuguese Primeira Liga Jornada ${jornada} Fixtures & Results`,
      description: `Primeira Liga scores and fixtures for Jornada ${jornada}`,
      canonicalUrl: 'https://www.bbc.com/sport/football/portuguese-primeira-liga/scores-fixtures'
    },
    matches: []
  };
}

export async function fetchPrimeiraLigaTable(): Promise<StandingsResponse> {
  try {
    const res = await fetch('/api/primeira-liga/table');
    if (res.ok) {
      const data: StandingsResponse = await res.json();
      if (data && Array.isArray(data.entries) && data.entries.length > 0) {
        return data;
      }
    }
  } catch (err) {
    console.warn('Backend /api/primeira-liga/table failed:', err);
  }

  return {
    success: true,
    targetUrl: 'https://www.bbc.com/sport/football/portuguese-primeira-liga/table',
    seasonId: '2026-27',
    seasonLabel: '2026/27',
    compSeasonId: 94,
    matchweekId: 'all',
    entries: []
  };
}

export async function fetchPrimeiraLigaStats(): Promise<StatsOverviewResponse> {
  try {
    const res = await fetch('/api/primeira-liga/stats');
    if (res.ok) {
      const data: StatsOverviewResponse = await res.json();
      if (data && Object.keys(data.playerCategories || {}).length > 0) {
        return data;
      }
    }
  } catch (err) {
    console.warn('Backend /api/primeira-liga/stats failed:', err);
  }

  return {
    success: true,
    targetUrl: 'https://www.bbc.com/sport/football/portuguese-primeira-liga',
    seasonId: '2026-27',
    seasonLabel: '2026/27',
    compSeasonId: 94,
    playerCategories: {},
    teamCategories: {}
  };
}
