import React from 'react';
import { MapPin, Clock, History, Calendar, Shield, Users, Trophy } from 'lucide-react';
import { MatchFixture } from '../types';
import { ClubBadge } from './ClubBadge';

interface MatchCardProps {
  match: MatchFixture;
  index: number;
  onSelectMatch: (match: MatchFixture) => void;
}

export const MatchCard: React.FC<MatchCardProps> = ({ match, index, onSelectMatch }) => {
  const hasScore = typeof match.homeTeam.score === 'number' && typeof match.awayTeam.score === 'number';
  const isFinished = match.period === 'FullTime' || hasScore;
  const isHomeWinner = hasScore && (match.homeTeam.score as number) > (match.awayTeam.score as number);
  const isAwayWinner = hasScore && (match.awayTeam.score as number) > (match.homeTeam.score as number);
  const isDraw = hasScore && (match.homeTeam.score as number) === (match.awayTeam.score as number);

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

        <button
          id={`btn-view-h2h-${match.matchId}`}
          type="button"
          onClick={() => onSelectMatch(match)}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white hover:bg-[#38003c] text-[#38003c] hover:text-white font-semibold text-xs border border-slate-200 hover:border-[#38003c] transition shadow-2xs cursor-pointer"
        >
          <History className="w-3.5 h-3.5 text-emerald-600 group-hover:text-[#00ff85]" />
          <span>{isFinished ? 'Match Details & H2H' : 'Head-to-Head'}</span>
        </button>
      </div>
    </div>
  );
};
