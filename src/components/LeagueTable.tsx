import React, { useState } from 'react';
import { 
  Trophy, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  AlertCircle, 
  ArrowUp, 
  ArrowDown, 
  Minus,
  RefreshCw,
  Layers,
  Home,
  Plane
} from 'lucide-react';
import { StandingsResponse, StandingsEntry } from '../types';
import { ALL_SEASONS, findSeasonBySlug } from '../data/seasons';
import { ClubBadge } from './ClubBadge';

interface LeagueTableProps {
  tableData: StandingsResponse | null;
  loading: boolean;
  selectedSeasonSlug: string;
  selectedMatchweek: number | 'all';
  onSeasonChange: (seasonSlug: string) => void;
  onMatchweekChange: (matchweek: number | 'all') => void;
  onRefresh: () => void;
}

export const LeagueTable: React.FC<LeagueTableProps> = ({
  tableData,
  loading,
  selectedSeasonSlug,
  selectedMatchweek,
  onSeasonChange,
  onMatchweekChange,
  onRefresh
}) => {
  const [recordTab, setRecordTab] = useState<'overall' | 'home' | 'away'>('overall');
  const [searchTerm, setSearchTerm] = useState('');

  const currentSeason = findSeasonBySlug(selectedSeasonSlug);
  const maxMw = tableData?.maxMatchweeks || currentSeason.maxMatchweeks || 38;
  const isAllMatchweeks = selectedMatchweek === 'all';
  const currentMwNum = isAllMatchweeks ? 3 : (typeof selectedMatchweek === 'number' ? selectedMatchweek : 3);

  const matchweeks = Array.from({ length: maxMw }, (_, i) => i + 1);

  // Filter entries by search
  const filteredEntries = (tableData?.entries || []).filter((entry) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      entry.team.name.toLowerCase().includes(term) ||
      entry.team.shortName.toLowerCase().includes(term) ||
      entry.team.abbr.toLowerCase().includes(term)
    );
  });

  const getPositionStyle = (position: number, totalTeams: number) => {
    // Standard Premier League qualification zones
    if (position <= 4) {
      return {
        bar: 'bg-blue-600',
        badge: 'bg-blue-50 text-blue-700 border-blue-200',
        zone: 'Champions League'
      };
    }
    if (position === 5) {
      return {
        bar: 'bg-amber-500',
        badge: 'bg-amber-50 text-amber-700 border-amber-200',
        zone: 'Europa League'
      };
    }
    // Relegation zone: bottom 3
    if (position > totalTeams - 3) {
      return {
        bar: 'bg-red-600',
        badge: 'bg-red-50 text-red-700 border-red-200',
        zone: 'Relegation'
      };
    }
    return {
      bar: 'bg-transparent',
      badge: 'bg-slate-100 text-slate-700 border-slate-200',
      zone: ''
    };
  };

  return (
    <div className="space-y-6">
      {/* Table Control Header */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Season & Matchweek Selectors */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Season dropdown */}
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-[#38003c]/5 text-[#38003c] flex items-center justify-center shrink-0">
                <Trophy className="w-4 h-4 text-[#38003c]" />
              </div>
              <div>
                <label htmlFor="table-season-select" className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Season
                </label>
                <select
                  id="table-season-select"
                  value={selectedSeasonSlug}
                  onChange={(e) => onSeasonChange(e.target.value)}
                  disabled={loading}
                  className="mt-0.5 bg-slate-50 hover:bg-slate-100 text-slate-900 font-bold text-xs sm:text-sm rounded-lg px-3 py-1.5 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#38003c] cursor-pointer shadow-2xs transition"
                >
                  {ALL_SEASONS.map((season) => (
                    <option key={season.slug} value={season.slug}>
                      {season.label} {season.isCurrent ? '• Current' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="hidden sm:block h-9 w-px bg-slate-200" />

            {/* Scope: All Matchweeks vs Till Matchweek */}
            <div className="flex flex-col">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                Table Scope
              </span>
              <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-100 border border-slate-200">
                <button
                  type="button"
                  onClick={() => onMatchweekChange('all')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
                    isAllMatchweeks
                      ? 'bg-[#38003c] text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All Matchweeks
                </button>
                <button
                  type="button"
                  onClick={() => onMatchweekChange(currentMwNum || 3)}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
                    !isAllMatchweeks
                      ? 'bg-[#38003c] text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Till Matchweek
                </button>
              </div>
            </div>

            {/* If Till Matchweek is selected, show Matchweek Stepper & Select */}
            {!isAllMatchweeks && (
              <div className="flex items-center gap-1.5 self-end">
                <button
                  type="button"
                  onClick={() => onMatchweekChange(Math.max(1, currentMwNum - 1))}
                  disabled={currentMwNum <= 1 || loading}
                  className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 disabled:opacity-35 disabled:cursor-not-allowed transition cursor-pointer"
                  title="Previous Matchweek"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <select
                  id="table-mw-select"
                  aria-label="Matchweek"
                  value={currentMwNum}
                  onChange={(e) => onMatchweekChange(parseInt(e.target.value, 10))}
                  disabled={loading}
                  className="bg-slate-50 hover:bg-slate-100 text-slate-900 font-bold text-xs sm:text-sm rounded-lg px-2.5 py-1.5 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#38003c] cursor-pointer shadow-2xs transition"
                >
                  {matchweeks.map((mw) => (
                    <option key={mw} value={mw}>
                      Matchweek {mw}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => onMatchweekChange(Math.min(maxMw, currentMwNum + 1))}
                  disabled={currentMwNum >= maxMw || loading}
                  className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 disabled:opacity-35 disabled:cursor-not-allowed transition cursor-pointer"
                  title="Next Matchweek"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Right: Record Type (Overall, Home, Away) and Search */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Record type filter */}
            <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-100 border border-slate-200">
              <button
                type="button"
                onClick={() => setRecordTab('overall')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
                  recordTab === 'overall'
                    ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Overall</span>
              </button>
              <button
                type="button"
                onClick={() => setRecordTab('home')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
                  recordTab === 'home'
                    ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Home className="w-3.5 h-3.5" />
                <span>Home</span>
              </button>
              <button
                type="button"
                onClick={() => setRecordTab('away')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
                  recordTab === 'away'
                    ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Plane className="w-3.5 h-3.5" />
                <span>Away</span>
              </button>
            </div>

            {/* Club search input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search club..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#38003c] w-36 sm:w-44 transition"
              />
            </div>

            {/* Refresh */}
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              title="Refresh table"
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-50 transition cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Standings Status Bar */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="font-semibold text-slate-700">
              {tableData?.seasonLabel || `Season ${selectedSeasonSlug}`} Standings
            </span>
          </div>
          <div>
            <span>
              {isAllMatchweeks
                ? `Complete Table • All ${maxMw} Matchweeks`
                : `Standings after Matchweek ${currentMwNum} of ${maxMw}`}
            </span>
          </div>
        </div>
      </div>

      {/* Point Deductions Notice if any */}
      {tableData?.deductions && tableData.deductions.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-900">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <h4 className="font-bold text-sm text-amber-950">Premier League Point Deductions Notice</h4>
              {tableData.deductions.map((d, i) => (
                <p key={i} className="text-amber-900/90 leading-relaxed">• {d.reason}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Standings Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th scope="col" className="py-3 px-3 w-14 text-center">Pos</th>
                <th scope="col" className="py-3 px-3 w-10 text-center hidden sm:table-cell">Move</th>
                <th scope="col" className="py-3 px-4 min-w-[160px] sm:min-w-[200px]">Club</th>
                <th scope="col" className="py-3 px-2 text-center w-12" title="Played">Pl</th>
                <th scope="col" className="py-3 px-2 text-center w-12" title="Won">W</th>
                <th scope="col" className="py-3 px-2 text-center w-12" title="Drawn">D</th>
                <th scope="col" className="py-3 px-2 text-center w-12" title="Lost">L</th>
                <th scope="col" className="py-3 px-2 text-center w-12 hidden md:table-cell" title="Goals For">GF</th>
                <th scope="col" className="py-3 px-2 text-center w-12 hidden md:table-cell" title="Goals Against">GA</th>
                <th scope="col" className="py-3 px-2 text-center w-14" title="Goal Difference">GD</th>
                <th scope="col" className="py-3 px-4 text-center w-16 bg-purple-50/50 text-[#38003c] font-black" title="Points">Pts</th>
                {tableData?.entries?.[0]?.form && tableData.entries[0].form.length > 0 && (
                  <th scope="col" className="py-3 px-4 text-center hidden lg:table-cell">Form</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={12} className="py-16 text-center text-slate-500">
                    <div className="inline-flex items-center gap-3">
                      <RefreshCw className="w-5 h-5 text-[#38003c] animate-spin" />
                      <span className="font-semibold text-sm">Loading Premier League standings...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-500 text-sm">
                    No clubs matching &quot;{searchTerm}&quot; found.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => {
                  const record = recordTab === 'home' ? entry.home : recordTab === 'away' ? entry.away : entry.overall;
                  const posStyle = getPositionStyle(entry.position, tableData?.totalTeams || 20);

                  const gdSign = record.goalDifference > 0 ? `+${record.goalDifference}` : `${record.goalDifference}`;
                  const gdColor = record.goalDifference > 0 ? 'text-emerald-700 font-semibold' : record.goalDifference < 0 ? 'text-rose-600 font-semibold' : 'text-slate-600';

                  return (
                    <tr 
                      key={entry.team.id || entry.team.name}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Position with qualification bar */}
                      <td className="py-3.5 px-3 text-center relative">
                        <span className={`absolute left-0 top-1 bottom-1 w-1 rounded-r ${posStyle.bar}`}></span>
                        <span className="font-bold text-slate-800 text-xs sm:text-sm">
                          {entry.position}
                        </span>
                      </td>

                      {/* Movement */}
                      <td className="py-3.5 px-3 text-center hidden sm:table-cell">
                        {entry.movement === 'up' ? (
                          <span className="inline-flex items-center text-emerald-600" title="Moved up">
                            <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
                          </span>
                        ) : entry.movement === 'down' ? (
                          <span className="inline-flex items-center text-rose-600" title="Moved down">
                            <ArrowDown className="w-3.5 h-3.5 stroke-[2.5]" />
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-slate-300" title="No change">
                            <Minus className="w-3 h-3" />
                          </span>
                        )}
                      </td>

                      {/* Club Name & Badge */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <ClubBadge
                            name={entry.team.name}
                            id={entry.team.id}
                            badgeUrl={entry.team.badgeUrl}
                            size="md"
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 truncate text-xs sm:text-sm group-hover:text-[#38003c] transition-colors">
                              {entry.team.name}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono sm:hidden">
                              {entry.team.abbr}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Pl, W, D, L */}
                      <td className="py-3.5 px-2 text-center text-slate-700 font-medium text-xs sm:text-sm">{record.played}</td>
                      <td className="py-3.5 px-2 text-center text-slate-700 font-medium text-xs sm:text-sm">{record.won}</td>
                      <td className="py-3.5 px-2 text-center text-slate-700 font-medium text-xs sm:text-sm">{record.drawn}</td>
                      <td className="py-3.5 px-2 text-center text-slate-700 font-medium text-xs sm:text-sm">{record.lost}</td>

                      {/* GF, GA */}
                      <td className="py-3.5 px-2 text-center text-slate-500 text-xs sm:text-sm hidden md:table-cell">{record.goalsFor}</td>
                      <td className="py-3.5 px-2 text-center text-slate-500 text-xs sm:text-sm hidden md:table-cell">{record.goalsAgainst}</td>

                      {/* GD */}
                      <td className={`py-3.5 px-2 text-center text-xs sm:text-sm ${gdColor}`}>
                        {gdSign}
                      </td>

                      {/* Points */}
                      <td className="py-3.5 px-4 text-center font-black text-xs sm:text-sm bg-purple-50/40 text-[#38003c]">
                        {record.points}
                      </td>

                      {/* Form pills if available */}
                      {entry.form && entry.form.length > 0 && (
                        <td className="py-3.5 px-4 text-center hidden lg:table-cell">
                          <div className="flex items-center justify-center gap-1">
                            {entry.form.slice(-5).map((outcome, fIdx) => (
                              <span
                                key={fIdx}
                                className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center text-white ${
                                  outcome === 'W'
                                    ? 'bg-emerald-600'
                                    : outcome === 'D'
                                    ? 'bg-slate-400'
                                    : 'bg-rose-600'
                                }`}
                                title={outcome === 'W' ? 'Win' : outcome === 'D' ? 'Draw' : 'Loss'}
                              >
                                {outcome}
                              </span>
                            ))}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Qualification Key Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-xs bg-blue-600 shrink-0"></span>
              <span className="font-semibold text-slate-700">UEFA Champions League</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-xs bg-amber-500 shrink-0"></span>
              <span className="font-semibold text-slate-700">UEFA Europa League</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-xs bg-red-600 shrink-0"></span>
              <span className="font-semibold text-slate-700">Relegation Zone</span>
            </div>
          </div>
          <div className="text-[11px] text-slate-400">
            Official Premier League Standings • {tableData?.totalTeams || 20} Clubs
          </div>
        </div>
      </div>
    </div>
  );
};
