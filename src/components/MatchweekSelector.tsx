import React, { useRef, useEffect } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  Trophy,
  Sparkles,
  Zap
} from 'lucide-react';
import { ALL_SEASONS, findSeasonBySlug } from '../data/seasons';
import { MatchweekScheduleInfo } from '../types';

interface MatchweekSelectorProps {
  currentMatchweek: number;
  currentSeasonSlug: string;
  onMatchweekChange: (matchweek: number) => void;
  onSeasonChange: (seasonSlug: string) => void;
  totalMatches: number;
  playedMatchesCount: number;
  maxMatchweeks?: number;
  loading: boolean;
  scheduleInfo?: MatchweekScheduleInfo[];
  recommendedMatchweek?: number;
  hasMatchToday?: boolean;
  lastPlayedMatchweek?: number | null;
  league?: 'epl' | 'primeira-liga';
}

export const MatchweekSelector: React.FC<MatchweekSelectorProps> = ({
  currentMatchweek,
  currentSeasonSlug,
  onMatchweekChange,
  onSeasonChange,
  totalMatches,
  playedMatchesCount,
  maxMatchweeks = 38,
  loading,
  scheduleInfo = [],
  recommendedMatchweek,
  hasMatchToday = false,
  lastPlayedMatchweek,
  league = 'epl'
}) => {
  const isPrimeira = league === 'primeira-liga';
  const roundWord = isPrimeira ? 'Jornada' : 'Matchweek';
  const roundShort = isPrimeira ? 'J' : 'MW';
  const currentSeason = findSeasonBySlug(currentSeasonSlug);
  const effectiveMaxMw = maxMatchweeks || (isPrimeira ? 34 : currentSeason.maxMatchweeks || 38);
  const pillStripRef = useRef<HTMLDivElement>(null);

  // Generate matchweeks 1 through effectiveMaxMw
  const matchweeks = Array.from({ length: effectiveMaxMw }, (_, i) => i + 1);

  // Current matchweek schedule info
  const currentMwInfo = scheduleInfo.find((s) => s.matchweek === currentMatchweek);

  // Determine played vs upcoming based on API schedule or match count
  const isAllPlayed = currentMwInfo
    ? currentMwInfo.isPlayed
    : playedMatchesCount === totalMatches && totalMatches > 0;
  const isUpcoming = currentMwInfo
    ? currentMwInfo.isUpcoming
    : playedMatchesCount === 0 && totalMatches > 0;
  const isMatchToday = currentMwInfo ? currentMwInfo.isToday : false;

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

  // Auto-scroll pill strip to keep selected matchweek centered
  useEffect(() => {
    if (pillStripRef.current) {
      const activePill = pillStripRef.current.querySelector(`[data-mw="${currentMatchweek}"]`) as HTMLElement;
      if (activePill) {
        const container = pillStripRef.current;
        const scrollLeft = activePill.offsetLeft - container.offsetWidth / 2 + activePill.offsetWidth / 2;
        container.scrollTo({ left: Math.max(0, scrollLeft), behavior: 'smooth' });
      }
    }
  }, [currentMatchweek]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs mb-6 overflow-hidden transition">
      {/* Top Bar: Season, Matchweek Controls & Status */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Left: Selectors */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Season Selector */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-[#38003c]/5 text-[#38003c] flex items-center justify-center shrink-0">
              <Trophy className="w-4 h-4 text-[#38003c]" />
            </div>
            <div>
              <label htmlFor="season-select" className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
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

          <div className="hidden sm:block h-10 w-px bg-slate-200"></div>

          {/* Matchweek Select & Step controls */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#38003c] flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4 text-[#38003c]" />
            </div>
            <div>
              <label htmlFor="matchweek-select" className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                {roundWord} & Dates
              </label>
              <div className="flex items-center gap-1.5 mt-0.5">
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

                {/* Matchweek dropdown with Dates and Status */}
                <select
                  id="matchweek-select"
                  name="matchweek"
                  value={currentMatchweek}
                  onChange={(e) => onMatchweekChange(parseInt(e.target.value, 10))}
                  disabled={loading}
                  className="bg-slate-50 hover:bg-slate-100 text-slate-900 font-bold text-xs sm:text-sm rounded-lg px-3 py-1.5 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#38003c] cursor-pointer shadow-2xs transition max-w-[280px] sm:max-w-none truncate"
                >
                  {matchweeks.map((mw) => {
                    const info = scheduleInfo.find((s) => s.matchweek === mw);
                    const isHistorical = !currentSeason.isCurrent;
                    const isPlayedMw = info ? info.isPlayed : isHistorical || mw <= 5;
                    const isTodayMw = info ? info.isToday : false;

                    let statusLabel = '';
                    if (isTodayMw) {
                      statusLabel = '• TODAY • MATCHDAY';
                    } else if (isPlayedMw) {
                      statusLabel = info?.dateRange ? `• ${info.dateRange} (Played)` : '(Played)';
                    } else {
                      statusLabel = info?.dateRange ? `• ${info.dateRange} (Upcoming)` : '(Upcoming)';
                    }

                    return (
                      <option key={mw} value={mw}>
                        {roundWord} {mw} {statusLabel}
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
                  title="Next Round"
                  aria-label="Next Round"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Selected Matchweek Details & Quick Jump */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Badge */}
          {isMatchToday && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-emerald-500 text-white shadow-xs animate-pulse">
              <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
              <span>Matchday Active Today</span>
            </span>
          )}

          {!isMatchToday && isAllPlayed && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Full Round Played ({totalMatches} Results)</span>
            </span>
          )}

          {!isMatchToday && isUpcoming && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>
                Upcoming Round {currentMwInfo?.dateRange ? `• ${currentMwInfo.dateRange}` : `(${totalMatches} Fixtures)`}
              </span>
            </span>
          )}

          {/* Quick jump to Latest Played or Today if not currently selected */}
          {recommendedMatchweek && recommendedMatchweek !== currentMatchweek && (
            <button
              type="button"
              onClick={() => onMatchweekChange(recommendedMatchweek)}
              disabled={loading}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-bold transition shadow-xs cursor-pointer ml-auto lg:ml-2 ${
                isPrimeira ? 'bg-[#093529] hover:bg-[#0c4334]' : 'bg-[#38003c] hover:bg-[#4a014f]'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-[#00ff85]" />
              <span>
                {hasMatchToday
                  ? `Jump to Today (${roundShort} ${recommendedMatchweek})`
                  : `Jump to Latest Played (${roundShort} ${recommendedMatchweek})`}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Date Banner for Selected Matchweek */}
      {currentMwInfo && (
        <div className="bg-purple-50/50 px-4 py-2.5 border-b border-purple-100/60 flex flex-wrap items-center justify-between gap-2 text-xs text-purple-950">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-500">Fixture Dates:</span>
            <span className={`font-bold bg-white px-2.5 py-0.5 rounded-md border border-purple-200/60 shadow-2xs ${isPrimeira ? 'text-[#093529]' : 'text-[#38003c]'}`}>
              {currentMwInfo.fullDateRange || currentMwInfo.dateRange || `${roundWord} ${currentMatchweek}`}
            </span>
            {currentMwInfo.fromLabel && (
              <span className="text-[11px] text-slate-500 hidden md:inline">
                ({currentMwInfo.fromLabel.split(',')[0]} – {currentMwInfo.untilLabel?.split(',')[0]})
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-slate-400">Status:</span>
            <span
              className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wide ${
                currentMwInfo.isToday
                  ? 'bg-emerald-600 text-white'
                  : currentMwInfo.isPlayed
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {currentMwInfo.isToday ? 'Today • Matchday' : currentMwInfo.isPlayed ? 'Played / Results' : 'Upcoming'}
            </span>
          </div>
        </div>
      )}

      {/* Interactive Matchweek Carousel / Pill Strip */}
      <div className="p-3 bg-slate-50/80">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            All Season Rounds ({matchweeks.length} {roundWord}s):
          </span>
          <span className="text-[10px] text-slate-400">
            Scroll or click to view round
          </span>
        </div>

        <div
          ref={pillStripRef}
          className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-slate-300"
        >
          {matchweeks.map((mw) => {
            const info = scheduleInfo.find((s) => s.matchweek === mw);
            const isSelected = mw === currentMatchweek;
            const isPlayed = info ? info.isPlayed : mw <= 7;
            const isUpcomingMw = info ? info.isUpcoming : !isPlayed;
            const isTodayMw = info ? info.isToday : false;

            return (
              <button
                key={mw}
                type="button"
                data-mw={mw}
                onClick={() => onMatchweekChange(mw)}
                disabled={loading}
                className={`flex flex-col items-center justify-center min-w-[76px] py-1.5 px-2 rounded-xl transition cursor-pointer shrink-0 border text-center ${
                  isSelected
                    ? isPrimeira
                      ? 'bg-[#093529] text-white border-[#00ff85] shadow-sm ring-1 ring-[#00ff85]'
                      : 'bg-[#38003c] text-white border-[#00ff85] shadow-sm ring-1 ring-[#00ff85]'
                    : isTodayMw
                    ? 'bg-emerald-50 text-emerald-950 border-emerald-300 hover:bg-emerald-100'
                    : isPlayed
                    ? 'bg-white text-slate-800 border-slate-200 hover:bg-purple-50/50 hover:border-purple-200'
                    : 'bg-white/70 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {/* Top: Matchweek label and icon */}
                <div className="flex items-center gap-1">
                  <span className={`text-xs font-black ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                    {roundShort} {mw}
                  </span>
                  {isTodayMw ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                  ) : isPlayed ? (
                    <span className={`text-[10px] font-bold ${isSelected ? 'text-[#00ff85]' : 'text-emerald-600'}`}>
                      ✓
                    </span>
                  ) : (
                    <span className={`text-[9px] ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                      ⏱
                    </span>
                  )}
                </div>

                {/* Bottom: Date Range or Status */}
                <span
                  className={`text-[10px] font-semibold mt-0.5 truncate max-w-[70px] ${
                    isSelected
                      ? 'text-white/80'
                      : isPlayed
                      ? 'text-slate-500'
                      : 'text-purple-700 font-bold'
                  }`}
                  title={info?.fullDateRange || info?.dateRange || (isPlayed ? 'Played' : 'Upcoming')}
                >
                  {info?.dateRange ? info.dateRange : isPlayed ? 'Played' : 'Upcoming'}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
