import React from 'react';
import { Trophy, RefreshCw, Calendar, Table2, BarChart3 } from 'lucide-react';
import { ScrapeResponse, StandingsResponse, StatsOverviewResponse } from '../types';

interface HeaderProps {
  onRefresh: () => void;
  loading: boolean;
  scrapeData: ScrapeResponse | null;
  tableData: StandingsResponse | null;
  statsData?: StatsOverviewResponse | null;
  activeTab: 'fixtures' | 'table' | 'stats';
  onTabChange: (tab: 'fixtures' | 'table' | 'stats') => void;
}

export const Header: React.FC<HeaderProps> = ({
  onRefresh,
  loading,
  scrapeData,
  tableData,
  statsData,
  activeTab,
  onTabChange
}) => {
  return (
    <header className="bg-[#38003c] text-white border-b border-[#4d0b52] shadow-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
          {/* Premier League Brand */}
          <div className="flex items-center justify-between md:justify-start gap-3">
            <div className="flex items-center gap-2.5 sm:gap-3.5">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#00ff85] to-[#00cc6a] flex items-center justify-center text-[#38003c] shadow-md shrink-0">
                <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-[#38003c]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <h1 className="text-lg sm:text-2xl font-black tracking-tight text-white leading-tight">
                    Premier League
                  </h1>
                  <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-bold bg-white/10 text-purple-200">
                    1992-93 to Date
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-purple-200/75 line-clamp-1">
                  Official fixtures, scores, results, tables & player stats
                </p>
              </div>
            </div>

            {/* Mobile quick refresh button */}
            <div className="flex md:hidden items-center gap-2">
              <button
                type="button"
                onClick={onRefresh}
                disabled={loading}
                title="Refresh data"
                aria-label="Refresh data"
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white disabled:opacity-50 transition cursor-pointer flex items-center justify-center min-w-[36px] min-h-[36px]"
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
                    ? 'bg-[#00ff85] text-[#38003c] shadow-sm'
                    : 'text-purple-200 hover:text-white hover:bg-white/5'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Fixtures</span>
              </button>

              <button
                type="button"
                onClick={() => onTabChange('table')}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap min-h-[36px] ${
                  activeTab === 'table'
                    ? 'bg-[#00ff85] text-[#38003c] shadow-sm'
                    : 'text-purple-200 hover:text-white hover:bg-white/5'
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
                    ? 'bg-[#00ff85] text-[#38003c] shadow-sm'
                    : 'text-purple-200 hover:text-white hover:bg-white/5'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Stats</span>
              </button>
            </div>
          </div>

          {/* Desktop Quick Info & Refresh */}
          <div className="hidden md:flex items-center gap-3">
            {activeTab === 'fixtures' && scrapeData && (
              <div className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/10 text-purple-100 border border-white/10 flex items-center gap-2">
                <span>{scrapeData.seasonLabel}</span>
                <span className="opacity-40">•</span>
                <span>MW {scrapeData.matchweekId}</span>
              </div>
            )}
            {activeTab === 'table' && tableData && (
              <div className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/10 text-purple-100 border border-white/10 flex items-center gap-2">
                <span>{tableData.seasonLabel}</span>
                <span className="opacity-40">•</span>
                <span>{tableData.isAllMatchweeks ? 'All MWs' : `MW ${tableData.matchweekId}`}</span>
              </div>
            )}
            {activeTab === 'stats' && statsData && (
              <div className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/10 text-purple-100 border border-white/10 flex items-center gap-2">
                <span>{statsData.seasonLabel}</span>
                <span className="opacity-40">•</span>
                <span>Season Leaders</span>
              </div>
            )}

            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              title="Refresh data"
              aria-label="Refresh data"
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white disabled:opacity-50 transition cursor-pointer flex items-center justify-center min-w-[40px] min-h-[40px]"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
