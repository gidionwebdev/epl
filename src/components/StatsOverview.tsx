import React from 'react';
import { Calendar, Shield, MapPin, Trophy, CheckCircle, Goal, Award } from 'lucide-react';
import { ScrapeResponse } from '../types';

interface StatsOverviewProps {
  data: ScrapeResponse;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ data }) => {
  const uniqueClubs = new Set<string>();
  const uniqueVenues = new Set<string>();
  let totalGoals = 0;
  let playedCount = 0;
  let homeWins = 0;
  let awayWins = 0;
  let draws = 0;

  data.matches.forEach((m) => {
    uniqueClubs.add(m.homeTeam.name);
    uniqueClubs.add(m.awayTeam.name);
    uniqueVenues.add(m.ground);

    if (typeof m.homeTeam.score === 'number' && typeof m.awayTeam.score === 'number') {
      playedCount++;
      totalGoals += m.homeTeam.score + m.awayTeam.score;
      if (m.homeTeam.score > m.awayTeam.score) homeWins++;
      else if (m.awayTeam.score > m.homeTeam.score) awayWins++;
      else draws++;
    }
  });

  const avgGoals = playedCount > 0 ? (totalGoals / playedCount).toFixed(1) : '0';

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
      {/* Stat 1: Matchweek Round */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center text-[#38003c] shrink-0">
          <Trophy className="w-5 h-5 text-[#38003c]" />
        </div>
        <div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Round</span>
          <p className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
            Matchweek {data.matchweekId}
          </p>
          <span className="text-[11px] text-purple-700 font-medium">{data.seasonLabel}</span>
        </div>
      </div>

      {/* Stat 2: Played / Total Fixtures */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
          {playedCount > 0 ? <CheckCircle className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
        </div>
        <div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            {playedCount > 0 ? 'Results Status' : 'Scheduled Fixtures'}
          </span>
          <p className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
            {playedCount > 0 ? `${playedCount} / ${data.totalMatches} Played` : `${data.totalMatches} Matches`}
          </p>
          <span className="text-[11px] text-emerald-600 font-medium">
            {playedCount === data.totalMatches && data.totalMatches > 0 ? 'Full Round Completed' : `${data.totalMatches - playedCount} Upcoming`}
          </span>
        </div>
      </div>

      {/* Stat 3: Goals Scored or Clubs */}
      {playedCount > 0 ? (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
            <Goal className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Goals Scored</span>
            <p className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
              {totalGoals} Goals
            </p>
            <span className="text-[11px] text-amber-600 font-medium">
              {avgGoals} goals / match
            </span>
          </div>
        </div>
      ) : (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Clubs Involved</span>
            <p className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
              {uniqueClubs.size} Clubs
            </p>
            <span className="text-[11px] text-slate-500 font-medium">All 20 Premier League</span>
          </div>
        </div>
      )}

      {/* Stat 4: Match Outcomes or Venues */}
      {playedCount > 0 ? (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Outcomes</span>
            <p className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
              {homeWins}H • {draws}D • {awayWins}A
            </p>
            <span className="text-[11px] text-slate-500 font-medium">Home vs Draw vs Away</span>
          </div>
        </div>
      ) : (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Stadiums</span>
            <p className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
              {uniqueVenues.size} Grounds
            </p>
            <span className="text-[11px] text-slate-500 font-medium">Across the UK</span>
          </div>
        </div>
      )}
    </div>
  );
};
