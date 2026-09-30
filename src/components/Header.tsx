import React from 'react';
import { Trophy, RefreshCw, Calendar, Table2, BarChart3, ChevronDown, ArrowLeftRight, Home } from 'lucide-react';
import { ScrapeResponse, StandingsResponse, StatsOverviewResponse } from '../types';

interface HeaderProps {
  onRefresh: () => void;
  loading: boolean;
  scrapeData: ScrapeResponse | null;
  tableData: StandingsResponse | null;
  statsData?: StatsOverviewResponse | null;
  activeTab: 'fixtures' | 'table' | 'stats';
  onTabChange: (tab: 'fixtures' | 'table' | 'stats') => void;
  currentLeague?: 'epl' | 'primeira-liga';
  onLeagueChange?: (league: 'epl' | 'primeira-liga') => void;
  onOpenHomeScreen?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onRefresh,
  loading,
  scrapeData,
  tableData,
  statsData,
  activeTab,
  onTabChange,
  currentLeague = 'epl',
  onLeagueChange,
  onOpenHomeScreen
}) => {
  const isPrimeira = currentLeague === 'primeira-liga';

  return (
    <header className={`${isPrimeira ? 'bg-[#093529] border-[#0c4334]' : 'bg-[#38003c] border-[#4d0b52]'} text-white border-b shadow-md sticky top-0 z-30 transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
          {/* Brand & League Switcher */}
          <div className="flex items-center justify-between md:justify-start gap-3">
            <div className="flex items-center gap-2.5 sm:gap-3.5">
              <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${isPrimeira ? 'bg-emerald-400 text-[#093529]' : 'bg-gradient-to-br from-[#00ff85] to-[#00cc6a] text-[#38003c]'} flex items-center justify-center shadow-md shrink-0`}>
                <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <h1 className="text-lg sm:text-2xl font-black tracking-tight text-white leading-tight">
                    {isPrimeira ? 'Primeira Liga' : 'Premier League'}
                  </h1>
                  <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-bold bg-white/10 text-emerald-100">
                    {isPrimeira ? 'Portugal • BBC Sport Sync' : '1992-93 to Date'}
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-white/75 line-clamp-1">
                  {isPrimeira
                    ? 'Live scores, fixtures, standings & Gemini AI analysis from BBC Sport'
                    : 'Official fixtures, scores, results, tables & player stats'}
                </p>
              </div>
            </div>

            {/* League Switcher & Mobile Refresh */}
            <div className="flex items-center gap-2">
              {onLeagueChange && (
                <div className="flex items-center p-1 rounded-xl bg-black/25 border border-white/15">
                  <button
                    type="button"
                    onClick={() => onLeagueChange('epl')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                      currentLeague === 'epl'
                        ? 'bg-white text-[#38003c] shadow-xs'
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`}
                    title="Switch to Premier League"
                  >
                    <span>🏴󠁧󠁢󠁥󠁮󠁧󠁿</span>
                    <span className="hidden sm:inline">EPL</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onLeagueChange('primeira-liga')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                      currentLeague === 'primeira-liga'
                        ? 'bg-[#00ff85] text-[#093529] shadow-xs'
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`}
                    title="Switch to Primeira Liga"
                  >
                    <span>🇵🇹</span>
                    <span className="hidden sm:inline">Liga Portugal</span>
                  </button>

                  {onOpenHomeScreen && (
                    <button
                      type="button"
                      onClick={onOpenHomeScreen}
                      className="px-2 py-1 rounded-lg text-xs font-bold text-white/80 hover:text-white hover:bg-white/10 transition flex items-center gap-1 cursor-pointer ml-1 border-l border-white/15 pl-2"
                      title="Choose competition home"
                    >
                      <Home className="w-3.5 h-3.5" />
                      <span className="hidden md:inline">Hub</span>
                    </button>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={onRefresh}
                disabled={loading}
                title="Refresh data"
                aria-label="Refresh data"
                className="md:hidden p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white disabled:opacity-50 transition cursor-pointer flex items-center justify-center min-w-[36px] min-h-[36px]"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Center Navigation Switcher: Fixtures vs Tables vs Stats */}
          <div className="flex items-center justify-center overflow-x-auto pb-1 md:pb-0 no-scrollbar">
            <div className="inline-flex items-center p-1 rounded-xl bg-black/30 border border-white/10 w-full sm:w-auto justify-between sm:justify-start">
              <button
                type="button"
                onClick={() => onTabChange('fixtures')}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap min-h-[36px] ${
                  activeTab === 'fixtures'
                    ? 'bg-[#00ff85] text-[#093529] shadow-sm font-black'
                    : 'text-white/80 hover:text-white hover:bg-white/5'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>{isPrimeira ? 'Jornadas & Fixtures' : 'Fixtures & Scores'}</span>
              </button>

              <button
                type="button"
                onClick={() => onTabChange('table')}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap min-h-[36px] ${
                  activeTab === 'table'
                    ? 'bg-[#00ff85] text-[#093529] shadow-sm font-black'
                    : 'text-white/80 hover:text-white hover:bg-white/5'
                }`}
              >
                <Table2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Standings Table</span>
              </button>

              <button
                type="button"
                onClick={() => onTabChange('stats')}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap min-h-[36px] ${
                  activeTab === 'stats'
                    ? 'bg-[#00ff85] text-[#093529] shadow-sm font-black'
                    : 'text-white/80 hover:text-white hover:bg-white/5'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>{isPrimeira ? 'Top Scorers' : 'Player & Team Stats'}</span>
              </button>
            </div>

            {/* Desktop Refresh Button */}
            <div className="hidden md:flex items-center ml-3">
              <button
                type="button"
                onClick={onRefresh}
                disabled={loading}
                title="Refresh live data"
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white disabled:opacity-50 transition cursor-pointer flex items-center justify-center"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
