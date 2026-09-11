import { ScrapeResponse, MatchPreview, StandingsResponse, StatsOverviewResponse } from '../types';
import { ALL_SEASONS, findSeasonBySlug } from '../data/seasons';

export async function fetchStatsOverview(seasonSlug: string, category?: string, type?: 'player' | 'team' | 'all'): Promise<StatsOverviewResponse> {
  const params = new URLSearchParams();
  params.set('season', seasonSlug);
  if (category) params.set('category', category);
  if (type) params.set('type', type);

  try {
    const res = await fetch(`/api/stats?${params.toString()}`);
    if (res.ok) {
      const data: StatsOverviewResponse = await res.json();
      return data;
    }
  } catch (err) {
    console.warn('Backend /api/stats request failed:', err);
  }

  throw new Error('Unable to retrieve stats data.');
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

  throw new Error('Unable to retrieve stats data for this URL.');
}

export async function fetchLeagueTable(seasonSlug: string, matchweek: number | 'all'): Promise<StandingsResponse> {
  const mwParam = matchweek === 'all' ? 'all' : matchweek;
  const targetUrl = `https://www.premierleague.com/en/tables/premier-league/${seasonSlug}/${matchweek === 'all' ? 'all-matchweeks' : `matchweek-${matchweek}`}`;
  
  try {
    const res = await fetch(`/api/tables?season=${encodeURIComponent(seasonSlug)}&matchweek=${mwParam}`);
    if (res.ok) {
      const data: StandingsResponse = await res.json();
      return data;
    }
  } catch (err) {
    console.warn('Backend /api/tables request failed:', err);
  }

  // Fallback direct request
  return fetchTableByUrl(targetUrl);
}

export async function fetchTableByUrl(targetUrl: string): Promise<StandingsResponse> {
  try {
    const res = await fetch(`/api/tables?url=${encodeURIComponent(targetUrl)}`);
    if (res.ok) {
      const data: StandingsResponse = await res.json();
      return data;
    }
  } catch (err) {
    console.warn('Backend /api/tables by url failed:', err);
  }

  throw new Error('Unable to retrieve table standings data.');
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
