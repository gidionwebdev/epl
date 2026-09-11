export interface Team {
  id: string;
  name: string;
  shortName: string;
  badgeUrl: string;
  score?: number;
  halfTimeScore?: number;
  redCards?: number;
}

export interface MatchGoal {
  playerId: string;
  playerName: string;
  time: string;
  period: string;
  goalType?: string;
  assistPlayerName?: string;
}

export interface MatchCardEvent {
  playerId: string;
  playerName: string;
  time: string;
  period: string;
  type: 'Yellow' | 'Red' | string;
}

export interface MatchFixture {
  matchId: string;
  competition: string;
  period: string;
  kickoff: string;
  kickoffTimezone: string;
  ground: string;
  homeTeam: Team;
  awayTeam: Team;
  clock?: string;
  attendance?: number;
  resultType?: string;
  tbc?: number;
}

export interface PreviousMeeting {
  kickoff: string;
  kickoffTimezone?: string;
  ground?: string;
  homeTeam: {
    score: number;
    team: {
      id: string;
      name: string;
      shortName: string;
      abbr?: string;
    };
  };
  awayTeam: {
    score: number;
    team: {
      id: string;
      name: string;
      shortName: string;
      abbr?: string;
    };
  };
}

export interface MatchDetailsData {
  matchId: string;
  previousMeetings: PreviousMeeting[];
  homeGoals?: MatchGoal[];
  awayGoals?: MatchGoal[];
  homeCards?: MatchCardEvent[];
  awayCards?: MatchCardEvent[];
  attendance?: number;
  halfTimeScore?: {
    home: number;
    away: number;
  };
}

export type MatchPreview = MatchDetailsData;

export interface HtmlMeta {
  title: string;
  description: string;
  canonicalUrl: string;
  ogTitle?: string;
  ogDescription?: string;
  resourcesVersion?: string;
  activeMatchweekId?: string;
  activeSeasonId?: string;
}

export interface ScrapeResponse {
  success: boolean;
  targetUrl: string;
  scrapedAt: string;
  seasonId: string;
  seasonLabel: string;
  compSeasonId?: number;
  matchweekId: number;
  maxMatchweeks?: number;
  totalMatches: number;
  htmlMeta: HtmlMeta;
  matches: MatchFixture[];
  rawMatches?: any[];
  error?: string;
}

export interface StandingsRecord {
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  position?: number;
}

export interface StandingsTeam {
  id: string;
  name: string;
  shortName: string;
  abbr: string;
  badgeUrl: string;
}

export interface StandingsEntry {
  position: number;
  startingPosition?: number;
  movement?: 'up' | 'down' | 'same';
  team: StandingsTeam;
  overall: StandingsRecord;
  home: StandingsRecord;
  away: StandingsRecord;
  form?: string[];
  annotations?: Array<{ type: string; destination?: string }>;
}

export interface StandingsResponse {
  success: boolean;
  targetUrl: string;
  scrapedAt: string;
  seasonId: string;
  seasonLabel: string;
  compSeasonId: number;
  matchweekId: number | 'all';
  isAllMatchweeks: boolean;
  maxMatchweeks: number;
  deductions?: Array<{ reason: string }>;
  entries: StandingsEntry[];
  totalTeams: number;
  error?: string;
}

export interface RankedPlayerStat {
  rank: number;
  playerId: string;
  name: string;
  position?: string;
  shirtNum?: number;
  nationality?: {
    country: string;
    isoCode?: string;
  };
  club: {
    id: string;
    name: string;
    shortName: string;
    abbr: string;
    badgeUrl: string;
  };
  value: number;
}

export interface RankedTeamStat {
  rank: number;
  club: {
    id: string;
    name: string;
    shortName: string;
    abbr: string;
    badgeUrl: string;
    stadium?: string;
  };
  value: number;
}

export interface StatCategoryData<T> {
  category: string;
  categoryLabel: string;
  unit: string;
  entries: T[];
}

export interface StatsOverviewResponse {
  success: boolean;
  targetUrl: string;
  seasonId: string;
  seasonLabel: string;
  compSeasonId: number;
  playerCategories: Record<string, StatCategoryData<RankedPlayerStat>>;
  teamCategories: Record<string, StatCategoryData<RankedTeamStat>>;
  error?: string;
}
