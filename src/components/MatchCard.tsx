import React, { useState, useEffect } from 'react';
import { MapPin, Clock, History, Calendar, Users, Trophy, TrendingUp, Sparkles } from 'lucide-react';
import { MatchFixture, PreviousMeeting } from '../types';
import { ClubBadge } from './ClubBadge';
import { fetchMatchPreview } from '../services/scraper';
import { calculateWinProbability, WinProbabilityResult } from '../utils/winProbability';

interface MatchCardProps {
  match: MatchFixture;
  index: number;
  onSelectMatch: (match: MatchFixture) => void;
}

// Module-level in-memory cache for fast H2H retrieval across renders
const h2hPreviewCache = new Map<string, PreviousMeeting[]>();

export const MatchCard: React.FC<MatchCardProps> = ({ match, index, onSelectMatch }) => {
  const hasScore = typeof match.homeTeam.score === 'number' && typeof match.awayTeam.score === 'number';
  const isFinished = match.period === 'FullTime' || hasScore;
  const isHomeWinner = hasScore && (match.homeTeam.score as number) > (match.awayTeam.score as number);
  const isAwayWinner = hasScore && (match.awayTeam.score as number) > (match.homeTeam.score as number);
  const isDraw = hasScore && (match.homeTeam.score as number) === (match.awayTeam.score as number);

  // Win Probability calculation state for upcoming fixtures
  const [winProb, setWinProb] = useState<WinProbabilityResult>(() =>
    calculateWinProbability(
      match.homeTeam,
      match.awayTeam,
      h2hPreviewCache.get(match.matchId) || []
    )
  );
  const [loadingH2H, setLoadingH2H] = useState<boolean>(false);

  useEffect(() => {
    if (isFinished) return;

    // If already in cache, calculate and return
    if (h2hPreviewCache.has(match.matchId)) {
      const cached = h2hPreviewCache.get(match.matchId)!;
      setWinProb(calculateWinProbability(match.homeTeam, match.awayTeam, cached));
      return;
    }

    let isMounted = true;
    setLoadingH2H(true);

    fetchMatchPreview(match.matchId)
      .then((data) => {
        if (!isMounted) return;
        const meetings = data?.previousMeetings || [];
        h2hPreviewCache.set(match.matchId, meetings);
        setWinProb(calculateWinProbability(match.homeTeam, match.awayTeam, meetings));
        setLoadingH2H(false);
      })
      .catch((err) => {
        console.warn('H2H win probability preview failed for match', match.matchId, err);
        if (isMounted) {
          setWinProb(calculateWinProbability(match.homeTeam, match.awayTeam, []));
          setLoadingH2H(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [match.matchId, match.homeTeam, match.awayTeam, isFinished]);

  // Format kick-off date
  const formatKickoff = (dateStr: string, tz: string) => {
    try {
      const d = new Date(dateStr.replace(' ', 'T') + 'Z');
      const dateFormatted = d.toLocaleDateString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
      const timeFormatted = d.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      return { date: dateFormatted, time: `${timeFormatted} ${tz}` };
    } catch {
      return { date: dateStr, time: tz };
    }
  };

  const { date, time } = formatKickoff(match.kickoff, match.kickoffTimezone);

  return (
    <div
      id={`match-card-${match.matchId}`}
      className={`bg-white rounded-xl border transition duration-200 flex flex-col justify-between overflow-hidden group shadow-2xs hover:shadow-md ${
        isFinished
          ? 'border-slate-200 hover:border-purple-300'
          : 'border-slate-200 hover:border-emerald-300'
      }`}
    >
      {/* Card Header: Match number, status, date */}
      <div className="bg-slate-50/80 px-4 py-2.5 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-1.5 font-medium text-slate-700">
          <Calendar className="w-3.5 h-3.5 text-[#38003c]" />
          <span>{date}</span>
          <span className="text-slate-300">•</span>
          <span className="font-semibold text-[#38003c] flex items-center gap-1">
            <Clock className="w-3 h-3 text-emerald-600" />
            {time}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {isFinished ? (
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              FT Result
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-[#38003c] border border-purple-200/60">
              Fixture #{index + 1}
            </span>
          )}
        </div>
      </div>

      {/* Main Clash / Results Area */}
      <div className="p-5">
        <div className="grid grid-cols-5 items-center gap-2">
          {/* Home Team */}
          <div className="col-span-2 flex flex-col items-center text-center">
            <div className={`w-16 h-16 sm:w-18 sm:h-18 p-2 rounded-xl border flex items-center justify-center transition group-hover:scale-105 relative ${
              isHomeWinner
                ? 'bg-emerald-50/60 border-emerald-200 ring-2 ring-emerald-500/20'
                : 'bg-slate-50 border-slate-100'
            }`}>
              <ClubBadge
                name={match.homeTeam.name}
                id={match.homeTeam.id}
                badgeUrl={match.homeTeam.badgeUrl}
                size="xl"
              />

              {/* Home Winner Crown */}
              {isHomeWinner && (
                <div className="absolute -top-2 -right-1 bg-emerald-600 text-white p-1 rounded-full shadow-xs">
                  <Trophy className="w-3 h-3" />
                </div>
              )}
            </div>

            <h3 className={`mt-2.5 text-sm sm:text-base leading-tight ${
              isHomeWinner ? 'font-black text-slate-900' : 'font-semibold text-slate-700'
            }`}>
              {match.homeTeam.name}
            </h3>

            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-xs font-medium text-slate-400">
                Home ({match.homeTeam.shortName})
              </span>
              {typeof match.homeTeam.redCards === 'number' && match.homeTeam.redCards > 0 && (
                <span className="inline-block w-2.5 h-3.5 bg-red-600 rounded-2xs" title={`${match.homeTeam.redCards} Red Card(s)`}></span>
              )}
            </div>
          </div>

          {/* Center: Scorebox or VS pill */}
          <div className="col-span-1 flex flex-col items-center justify-center">
            {hasScore ? (
              <div className="flex flex-col items-center">
                {/* Large score display */}
                <div className="flex items-center justify-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200/90 shadow-2xs">
                  <span className={`text-xl sm:text-2xl font-black ${isHomeWinner ? 'text-[#38003c]' : 'text-slate-700'}`}>
                    {match.homeTeam.score}
                  </span>
                  <span className="text-slate-300 font-bold text-base">-</span>
                  <span className={`text-xl sm:text-2xl font-black ${isAwayWinner ? 'text-[#38003c]' : 'text-slate-700'}`}>
                    {match.awayTeam.score}
                  </span>
                </div>

                {/* Status tag */}
                <span className="mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#38003c] text-[#00ff85]">
                  Full Time
                </span>

                {/* Half time score if available */}
                {typeof match.homeTeam.halfTimeScore === 'number' && typeof match.awayTeam.halfTimeScore === 'number' && (
                  <span className="text-[10px] text-slate-400 font-medium mt-1">
                    HT {match.homeTeam.halfTimeScore} - {match.awayTeam.halfTimeScore}
                  </span>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center">
                <span className="w-9 h-9 rounded-full bg-[#38003c] text-[#00ff85] font-black text-xs flex items-center justify-center shadow-xs">
                  VS
                </span>
                <span className="text-[10px] font-medium text-slate-400 mt-1 uppercase tracking-wider">
                  Upcoming
                </span>
              </div>
            )}
          </div>

          {/* Away Team */}
          <div className="col-span-2 flex flex-col items-center text-center">
            <div className={`w-16 h-16 sm:w-18 sm:h-18 p-2 rounded-xl border flex items-center justify-center transition group-hover:scale-105 relative ${
              isAwayWinner
                ? 'bg-emerald-50/60 border-emerald-200 ring-2 ring-emerald-500/20'
                : 'bg-slate-50 border-slate-100'
            }`}>
              <ClubBadge
                name={match.awayTeam.name}
                id={match.awayTeam.id}
                badgeUrl={match.awayTeam.badgeUrl}
                size="xl"
              />

              {/* Away Winner Crown */}
              {isAwayWinner && (
                <div className="absolute -top-2 -right-1 bg-emerald-600 text-white p-1 rounded-full shadow-xs">
                  <Trophy className="w-3 h-3" />
                </div>
              )}
            </div>

            <h3 className={`mt-2.5 text-sm sm:text-base leading-tight ${
              isAwayWinner ? 'font-black text-slate-900' : 'font-semibold text-slate-700'
            }`}>
              {match.awayTeam.name}
            </h3>

            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-xs font-medium text-slate-400">
                Away ({match.awayTeam.shortName})
              </span>
              {typeof match.awayTeam.redCards === 'number' && match.awayTeam.redCards > 0 && (
                <span className="inline-block w-2.5 h-3.5 bg-red-600 rounded-2xs" title={`${match.awayTeam.redCards} Red Card(s)`}></span>
              )}
            </div>
          </div>
        </div>

        {/* Win Probability Visualizer (Upcoming Matches) */}
        {!isFinished && (
          <div className="mt-4 pt-3 border-t border-slate-100">
            {/* Probability Percentages & Labels */}
            <div className="flex items-center justify-between text-xs font-bold mb-1.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2 h-2 rounded-full bg-[#38003c] shrink-0"></span>
                <span className="text-slate-800 truncate max-w-[85px] sm:max-w-[105px]">
                  {match.homeTeam.shortName || match.homeTeam.name}
                </span>
                <span className="font-mono text-xs text-[#38003c] font-black">
                  {winProb.homeProb}%
                </span>
              </div>

              <div className="flex items-center gap-1 px-1.5 shrink-0 text-slate-500 font-semibold text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                <span>Draw</span>
                <span className="font-mono">{winProb.drawProb}%</span>
              </div>

              <div className="flex items-center gap-1.5 min-w-0 justify-end">
                <span className="font-mono text-xs text-emerald-700 font-black">
                  {winProb.awayProb}%
                </span>
                <span className="text-slate-800 truncate max-w-[85px] sm:max-w-[105px] text-right">
                  {match.awayTeam.shortName || match.awayTeam.name}
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
              </div>
            </div>

            {/* Segmented Progress Bar */}
            <div
              className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex shadow-2xs border border-slate-200/80"
              title={`Win Probability: ${match.homeTeam.name} ${winProb.homeProb}% | Draw ${winProb.drawProb}% | ${match.awayTeam.name} ${winProb.awayProb}%`}
            >
              <div
                className="bg-[#38003c] h-full transition-all duration-500 first:rounded-l-full"
                style={{ width: `${winProb.homeProb}%` }}
              />
              <div
                className="bg-slate-300 h-full transition-all duration-500 border-x border-white/60"
                style={{ width: `${winProb.drawProb}%` }}
              />
              <div
                className="bg-emerald-500 h-full transition-all duration-500 last:rounded-r-full"
                style={{ width: `${winProb.awayProb}%` }}
              />
            </div>

            {/* Subtext info */}
            <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 font-medium">
              <span className="flex items-center gap-1 text-[#38003c] font-semibold">
                <TrendingUp className="w-3 h-3 text-[#38003c]" />
                <span>Win Probability</span>
              </span>
              <span className="truncate max-w-[180px] sm:max-w-[210px] text-right text-slate-500">
                {loadingH2H
                  ? 'Calculating H2H...'
                  : winProb.totalMeetings > 0
                  ? `${winProb.totalMeetings} past meetings (${winProb.homeWins}W · ${winProb.draws}D · ${winProb.awayWins}L)`
                  : 'Historical matchup model'}
              </span>
            </div>
          </div>
        )}

        {/* Stadium & Location */}
        <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-1 truncate">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="font-medium truncate">{match.ground}</span>
          </div>

          {match.attendance ? (
            <div className="flex items-center gap-1 text-slate-400 shrink-0 text-[11px] font-medium ml-2">
              <Users className="w-3.5 h-3.5" />
              <span>{match.attendance.toLocaleString()}</span>
            </div>
          ) : null}
        </div>
      </div>

      {/* Card Footer: Match ID and Action */}
      <div className="bg-slate-50/90 px-4 py-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <span className="font-mono text-[11px] text-slate-400">
          ID: {match.matchId}
        </span>

        <a
          id={`btn-view-h2h-${match.matchId}`}
          href={`/match/${match.matchId}`}
          onClick={(e) => {
            // Allow middle click / ctrl+click to open new tab, otherwise use client-side navigation
            if (!e.ctrlKey && !e.metaKey && e.button === 0) {
              e.preventDefault();
              onSelectMatch(match);
            }
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-[#38003c] text-[#38003c] hover:text-white font-semibold text-xs border border-slate-200 hover:border-[#38003c] transition shadow-2xs cursor-pointer group/btn"
        >
          <History className="w-3.5 h-3.5 text-emerald-600 group-hover/btn:text-[#00ff85]" />
          <span>{isFinished ? 'Match Details & H2H' : 'Head-to-Head'}</span>
        </a>
      </div>
    </div>
  );
};
