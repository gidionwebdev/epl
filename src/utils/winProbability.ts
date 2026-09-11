import { PreviousMeeting, Team } from '../types';

export interface WinProbabilityResult {
  homeWins: number;
  awayWins: number;
  draws: number;
  totalMeetings: number;
  homeProb: number;
  drawProb: number;
  awayProb: number;
  source: 'h2h' | 'model';
}

/**
 * Calculates win probability from historical head-to-head meetings between two clubs.
 */
export function calculateWinProbability(
  homeTeam: Team,
  awayTeam: Team,
  previousMeetings: PreviousMeeting[] = []
): WinProbabilityResult {
  let homeWins = 0;
  let awayWins = 0;
  let draws = 0;

  const normalize = (name: string) =>
    (name || '')
      .toLowerCase()
      .replace(/fc|afc|&|the/g, '')
      .replace(/[^a-z0-9]/g, '')
      .trim();

  const homeNorm = normalize(homeTeam.name);
  const awayNorm = normalize(awayTeam.name);

  if (Array.isArray(previousMeetings) && previousMeetings.length > 0) {
    for (const meeting of previousMeetings) {
      if (!meeting.homeTeam || !meeting.awayTeam) continue;

      const meetingHomeName = normalize(meeting.homeTeam.team?.name || '');
      const meetingAwayName = normalize(meeting.awayTeam.team?.name || '');
      const meetingHomeId = String(meeting.homeTeam.team?.id || '');
      const meetingAwayId = String(meeting.awayTeam.team?.id || '');

      const currentHomeId = String(homeTeam.id || '');
      const currentAwayId = String(awayTeam.id || '');

      const isHomeInPastHome =
        (currentHomeId && meetingHomeId === currentHomeId) ||
        (homeNorm && meetingHomeName.includes(homeNorm)) ||
        (homeNorm && homeNorm.includes(meetingHomeName));

      const isHomeInPastAway =
        (currentHomeId && meetingAwayId === currentHomeId) ||
        (homeNorm && meetingAwayName.includes(homeNorm)) ||
        (homeNorm && homeNorm.includes(meetingAwayName));

      const hScore = Number(meeting.homeTeam.score || 0);
      const aScore = Number(meeting.awayTeam.score || 0);

      if (isHomeInPastHome) {
        if (hScore > aScore) homeWins++;
        else if (aScore > hScore) awayWins++;
        else draws++;
      } else if (isHomeInPastAway) {
        if (aScore > hScore) homeWins++;
        else if (hScore > aScore) awayWins++;
        else draws++;
      } else {
        // Fallback by checking away team's position
        const isAwayInPastAway =
          (currentAwayId && meetingAwayId === currentAwayId) ||
          (awayNorm && meetingAwayName.includes(awayNorm));

        if (isAwayInPastAway) {
          if (aScore > hScore) awayWins++;
          else if (hScore > aScore) homeWins++;
          else draws++;
        } else {
          // If match was recorded
          if (hScore > aScore) homeWins++;
          else if (aScore > hScore) awayWins++;
          else draws++;
        }
      }
    }
  }

  const total = homeWins + awayWins + draws;

  if (total > 0) {
    // Smoothed empirical Bayesian probability model with home advantage factor
    const smoothedHome = (homeWins + 1.2) / (total + 3);
    const smoothedDraw = (draws + 0.9) / (total + 3);
    const smoothedAway = (awayWins + 0.9) / (total + 3);
    const sum = smoothedHome + smoothedDraw + smoothedAway;

    let homeProb = Math.round((smoothedHome / sum) * 100);
    let drawProb = Math.round((smoothedDraw / sum) * 100);
    let awayProb = 100 - homeProb - drawProb;

    // Minimum boundary clamps for visual readability
    if (homeProb < 8) {
      const diff = 8 - homeProb;
      homeProb = 8;
      awayProb -= diff;
    }
    if (awayProb < 8) {
      const diff = 8 - awayProb;
      awayProb = 8;
      homeProb -= diff;
    }
    if (drawProb < 10) {
      const diff = 10 - drawProb;
      drawProb = 10;
      if (homeProb > awayProb) homeProb -= diff;
      else awayProb -= diff;
    }

    return {
      homeWins,
      awayWins,
      draws,
      totalMeetings: total,
      homeProb,
      drawProb,
      awayProb,
      source: 'h2h'
    };
  }

  // Baseline statistical distribution with standard Premier League home pitch advantage (~44% H, 27% D, 29% A)
  return {
    homeWins: 0,
    awayWins: 0,
    draws: 0,
    totalMeetings: 0,
    homeProb: 44,
    drawProb: 27,
    awayProb: 29,
    source: 'model'
  };
}
