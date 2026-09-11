import React from 'react';
import { Calendar, ChevronLeft, ChevronRight, CheckCircle2, Clock, Trophy } from 'lucide-react';
import { ALL_SEASONS, SeasonInfo, findSeasonBySlug } from '../data/seasons';

interface MatchweekSelectorProps {
  currentMatchweek: number;
  currentSeasonSlug: string;
  onMatchweekChange: (matchweek: number) => void;
  onSeasonChange: (seasonSlug: string) => void;
  totalMatches: number;
  playedMatchesCount: number;
  maxMatchweeks?: number;
  loading: boolean;
}

export const MatchweekSelector: React.FC<MatchweekSelectorProps> = ({
  currentMatchweek,
  currentSeasonSlug,
  onMatchweekChange,
  onSeasonChange,
  totalMatches,
  playedMatchesCount,
  maxMatchweeks = 38,
  loading
}) => {
  const currentSeason = findSeasonBySlug(currentSeasonSlug);
  const effectiveMaxMw = maxMatchweeks || currentSeason.maxMatchweeks || 38;

  const isAllPlayed = playedMatchesCount === totalMatches && totalMatches > 0;
  const isPartiallyPlayed = playedMatchesCount > 0 && playedMatchesCount < totalMatches;
  const isUpcoming = playedMatchesCount === 0 && totalMatches > 0;

  // Generate matchweeks 1 through effectiveMaxMw
  const matchweeks = Array.from({ length: effectiveMaxMw }, (_, i) => i + 1);

  const handlePrev = () => {
    if (currentMatchweek > 1 && !loading) {
      onMatchweekChange(currentMatchweek - 1);
    }
  };

  const handleNext = () => {
    if (currentMatchweek < effectiveMaxMw && !loading) {
      onMatchweekChange(currentMatchweek + 1);
    }
  };

  // Jump targets
  const jumpWeeks = [
    { mw: 1, label: 'MW 1' },
    { mw: Math.round(effectiveMaxMw * 0.25), label: `MW ${Math.round(effectiveMaxMw * 0.25)}` },
    { mw: Math.round(effectiveMaxMw * 0.5), label: `MW ${Math.round(effectiveMaxMw * 0.5)}` },
    { mw: Math.round(effectiveMaxMw * 0.75), label: `MW ${Math.round(effectiveMaxMw * 0.75)}` },
    { mw: effectiveMaxMw, label: `MW ${effectiveMaxMw} (Finale)` }
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 mb-6 transition">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Left: Season & Matchweek Selectors */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Season Selector - All seasons 1992-93 to date */}
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-[#38003c]/5 text-[#38003c] flex items-center justify-center shrink-0">
              <Trophy className="w-4 h-4 text-[#38003c]" />
            </div>
            <div>
              <label htmlFor="season-select" className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Season
              </label>
              <select
                id="season-select"
                name="season"
                value={currentSeasonSlug}
                onChange={(e) => onSeasonChange(e.target.value)}
                disabled={loading}
                className="mt-0.5 bg-slate-50 hover:bg-slate-100 text-slate-900 font-bold text-xs sm:text-sm rounded-lg px-3 py-1.5 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#38003c] cursor-pointer shadow-2xs transition"
              >
                {ALL_SEASONS.map((season) => (
                  <option key={season.slug} value={season.slug}>
                    {season.label} {season.isCurrent ? '• Current Season' : season.slug === '1992-93' ? '• Inaugural Season' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="hidden sm:block h-9 w-px bg-slate-200"></div>

          {/* Matchweek Select & Step controls */}
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-purple-50 text-[#38003c] flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4 text-[#38003c]" />
            </div>
            <div>
              <label htmlFor="matchweek-select" className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Matchweek
              </label>
              <div className="flex items-center gap-1 mt-0.5">
                {/* Prev button */}
                <button
                  id="prev-matchweek-btn"
                  type="button"
                  onClick={handlePrev}
                  disabled={currentMatchweek <= 1 || loading}
                  className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 disabled:opacity-35 disabled:cursor-not-allowed transition cursor-pointer"
                  title="Previous Matchweek"
                  aria-label="Previous Matchweek"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Matchweek dropdown */}
                <select
                  id="matchweek-select"
                  name="matchweek"
                  value={currentMatchweek}
                  onChange={(e) => onMatchweekChange(parseInt(e.target.value, 10))}
                  disabled={loading}
                  className="bg-slate-50 hover:bg-slate-100 text-slate-900 font-bold text-xs sm:text-sm rounded-lg px-3 py-1.5 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#38003c] cursor-pointer shadow-2xs transition"
                >
                  {matchweeks.map((mw) => {
                    const isHistorical = !currentSeason.isCurrent;
                    const isPlayedMw = isHistorical || mw <= 3;

                    return (
                      <option key={mw} value={mw}>
                        Matchweek {mw} {isPlayedMw ? '(Results)' : mw === effectiveMaxMw ? '(Season Finale)' : '(Upcoming)'}
                      </option>
                    );
                  })}
                </select>

                {/* Next button */}
                <button
                  id="next-matchweek-btn"
                  type="button"
                  onClick={handleNext}
                  disabled={currentMatchweek >= effectiveMaxMw || loading}
                  className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 disabled:opacity-35 disabled:cursor-not-allowed transition cursor-pointer"
                  title="Next Matchweek"
                  aria-label="Next Matchweek"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Matchweek Status Badge & Quick Jump */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Badge */}
          {isAllPlayed && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Full Round Completed ({playedMatchesCount} Results)</span>
            </span>
          )}

          {isPartiallyPlayed && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
              <Trophy className="w-3.5 h-3.5 text-[#38003c]" />
              <span>{playedMatchesCount} Played • {totalMatches - playedMatchesCount} Upcoming</span>
            </span>
          )}

          {isUpcoming && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Upcoming Round ({totalMatches} Fixtures)</span>
            </span>
          )}

          {/* Jump to specific round */}
          <div className="flex items-center gap-1 ml-auto lg:ml-2">
            <span className="text-[11px] text-slate-400 font-medium mr-1 hidden sm:inline">Jump:</span>
            {jumpWeeks.map((jump) => (
              <button
                key={jump.mw}
                type="button"
                onClick={() => onMatchweekChange(jump.mw)}
                disabled={loading}
                className={`px-2 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                  currentMatchweek === jump.mw
                    ? 'bg-[#38003c] text-white shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {jump.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
