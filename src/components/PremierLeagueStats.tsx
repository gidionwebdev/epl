import React, { useState } from 'react';
import {
  Trophy,
  Flame,
  Award,
  ShieldCheck,
  Search,
  ChevronRight,
  TrendingUp,
  BarChart2,
  Users,
  Building2,
  Sparkles,
  Medal,
  RefreshCw
} from 'lucide-react';
import { StatsOverviewResponse, RankedPlayerStat, RankedTeamStat, StatCategoryData } from '../types';
import { ALL_SEASONS, findSeasonBySlug } from '../data/seasons';
import { ClubBadge } from './ClubBadge';

interface PremierLeagueStatsProps {
  statsData: StatsOverviewResponse | null;
  loading: boolean;
  selectedSeasonSlug: string;
  onSeasonChange: (seasonSlug: string) => void;
  onRefresh: () => void;
}

export const PremierLeagueStats: React.FC<PremierLeagueStatsProps> = ({
  statsData,
  loading,
  selectedSeasonSlug,
  onSeasonChange,
  onRefresh
}) => {
  const [scope, setScope] = useState<'players' | 'clubs'>('players');
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const seasonInfo = findSeasonBySlug(selectedSeasonSlug);

  const playerCats = statsData?.playerCategories || {};
  const teamCats = statsData?.teamCategories || {};

  const playerCatKeys = Object.keys(playerCats);
  const teamCatKeys = Object.keys(teamCats);

  const getCategoryIcon = (key: string) => {
    switch (key) {
      case 'goals':
        return <Flame className="w-4 h-4 text-amber-500" />;
      case 'goal_assist':
        return <Sparkles className="w-4 h-4 text-emerald-500" />;
      case 'clean_sheet':
        return <ShieldCheck className="w-4 h-4 text-blue-500" />;
      case 'total_pass':
        return <TrendingUp className="w-4 h-4 text-purple-500" />;
      case 'total_tackle':
        return <Award className="w-4 h-4 text-orange-500" />;
      case 'saves':
        return <ShieldCheck className="w-4 h-4 text-cyan-500" />;
      default:
        return <BarChart2 className="w-4 h-4 text-slate-500" />;
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <span className="w-6 h-6 rounded-full bg-amber-400 text-amber-950 font-black text-xs flex items-center justify-center shadow-xs">
          1
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="w-6 h-6 rounded-full bg-slate-300 text-slate-800 font-bold text-xs flex items-center justify-center">
          2
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="w-6 h-6 rounded-full bg-amber-700/30 text-amber-900 font-bold text-xs flex items-center justify-center">
          3
        </span>
      );
    }
    return (
      <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 font-semibold text-xs flex items-center justify-center">
        {rank}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#38003c] text-[#00ff85] uppercase tracking-wider">
                Official Leaderboards
              </span>
              <span className="text-xs font-semibold text-slate-500">
                Season {seasonInfo.label}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Premier League Stats & Leaderboards
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
              Official player & club rankings for Golden Boot, playmakers, clean sheets, passing, and discipline from 1992-93 to date.
            </p>
          </div>

          {/* Season Selector */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <label htmlFor="stats-season-select" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Select Season
              </label>
              <select
                id="stats-season-select"
                value={selectedSeasonSlug}
                onChange={(e) => onSeasonChange(e.target.value)}
                className="bg-slate-50 text-slate-900 border border-slate-300 font-bold text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#38003c] shadow-2xs cursor-pointer min-w-[160px]"
              >
                {ALL_SEASONS.map((s) => (
                  <option key={s.slug} value={s.slug}>
                    {s.label} {s.slug === '2026-27' ? '(Current)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="mt-5 p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer flex items-center justify-center shrink-0 border border-slate-200"
              title="Refresh Stats"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Scope Switcher: Player Leaders vs Club Leaders */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Main Tab Switches */}
        <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl w-full sm:w-auto">
          <button
            type="button"
            onClick={() => {
              setScope('players');
              setSelectedCategoryKey('all');
            }}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition cursor-pointer min-h-[40px] ${
              scope === 'players'
                ? 'bg-white text-[#38003c] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4 text-emerald-600" />
            <span>Player Leaderboards</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setScope('clubs');
              setSelectedCategoryKey('all');
            }}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition cursor-pointer min-h-[40px] ${
              scope === 'clubs'
                ? 'bg-white text-[#38003c] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4 text-[#38003c]" />
            <span>Club Leaderboards</span>
          </button>
        </div>

        {/* Quick Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Filter ${scope === 'players' ? 'player' : 'club'} name...`}
            className="w-full bg-slate-50 text-slate-800 placeholder-slate-400 text-xs rounded-xl pl-9 pr-4 py-2 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#38003c]"
          />
        </div>
      </div>

      {/* Category Pills Slider (Adaptive for mobile and desktop) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
        <button
          type="button"
          onClick={() => setSelectedCategoryKey('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer shrink-0 min-h-[36px] flex items-center gap-1.5 ${
            selectedCategoryKey === 'all'
              ? 'bg-[#38003c] text-white shadow-xs'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Trophy className="w-3.5 h-3.5 text-[#00ff85]" />
          <span>All Categories Overview</span>
        </button>

        {(scope === 'players' ? playerCatKeys : teamCatKeys).map((catKey) => {
          const cat = scope === 'players' ? playerCats[catKey] : teamCats[catKey];
          if (!cat) return null;
          const isSelected = selectedCategoryKey === catKey;

          return (
            <button
              key={catKey}
              type="button"
              onClick={() => setSelectedCategoryKey(catKey)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer shrink-0 min-h-[36px] flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-[#38003c] text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {getCategoryIcon(catKey)}
              <span>{cat.categoryLabel}</span>
            </button>
          );
        })}
      </div>

      {/* Loading Skeleton */}
      {loading && !statsData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-slate-200 h-80 rounded-2xl"></div>
          ))}
        </div>
      )}

      {/* Content Display */}
      {statsData && (
        <>
          {/* VIEW MODE: ALL CATEGORIES GRID (Bento Grid) */}
          {selectedCategoryKey === 'all' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-5">
              {(scope === 'players' ? playerCatKeys : teamCatKeys).map((catKey) => {
                const catData = scope === 'players' ? playerCats[catKey] : teamCats[catKey];
                if (!catData || !catData.entries || catData.entries.length === 0) return null;

                const topEntry = catData.entries[0] as any;
                const otherEntries = catData.entries.slice(1, 5) as any[];

                // Filter check if searching
                if (searchQuery.trim()) {
                  const q = searchQuery.toLowerCase();
                  const matches = catData.entries.some((entry: any) => {
                    const name = scope === 'players' ? entry.name : entry.club?.name;
                    const club = entry.club?.name || '';
                    return name.toLowerCase().includes(q) || club.toLowerCase().includes(q);
                  });
                  if (!matches) return null;
                }

                return (
                  <div
                    key={catKey}
                    className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition flex flex-col overflow-hidden group"
                  >
                    {/* Card Header */}
                    <div className="p-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
                          {getCategoryIcon(catKey)}
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-slate-900 leading-snug">
                            {catData.categoryLabel}
                          </h3>
                          <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                            Top 5 • {seasonInfo.label}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedCategoryKey(catKey)}
                        className="text-xs font-bold text-[#38003c] hover:text-purple-700 flex items-center gap-0.5 cursor-pointer"
                      >
                        <span>Full List</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Spotlight Leader (#1) */}
                    {topEntry && (
                      <div className="p-4 bg-gradient-to-br from-purple-50/50 to-emerald-50/20 border-b border-slate-100 relative">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            {/* Gold Badge */}
                            <div className="relative shrink-0">
                              <div className="w-10 h-10 rounded-xl bg-amber-400 text-amber-950 font-black text-sm flex items-center justify-center shadow-xs">
                                #1
                              </div>
                              <Medal className="w-4 h-4 text-amber-600 absolute -top-1.5 -right-1.5" />
                            </div>

                            {/* Player/Club Info */}
                            <div>
                              <h4 className="font-extrabold text-sm sm:text-base text-slate-900 leading-tight">
                                {scope === 'players' ? topEntry.name : topEntry.club?.name}
                              </h4>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <ClubBadge
                                  name={topEntry.club?.name}
                                  id={topEntry.club?.id}
                                  badgeUrl={topEntry.club?.badgeUrl}
                                  size="xs"
                                />
                                <span className="text-xs font-semibold text-slate-600">
                                  {topEntry.club?.shortName || topEntry.club?.name}
                                </span>
                                {scope === 'players' && topEntry.position && (
                                  <>
                                    <span className="text-slate-300">•</span>
                                    <span className="text-[11px] font-bold text-purple-800 bg-purple-100 px-1.5 py-0.2 rounded">
                                      {topEntry.position}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Leader Big Stat Number */}
                          <div className="text-right shrink-0">
                            <span className="text-2xl sm:text-3xl font-black text-[#38003c] font-mono leading-none">
                              {topEntry.value}
                            </span>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                              {catData.unit}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Runners Up List (Ranks 2-5) */}
                    <div className="p-3 space-y-2 flex-1 divide-y divide-slate-100">
                      {otherEntries.map((entry, idx) => (
                        <div
                          key={scope === 'players' ? entry.playerId || idx : entry.club?.id || idx}
                          className="pt-2 first:pt-0 flex items-center justify-between text-xs hover:bg-slate-50/75 p-1 rounded-lg transition"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 pr-2">
                            {getRankBadge(entry.rank || idx + 2)}

                            <ClubBadge
                              name={entry.club?.name}
                              id={entry.club?.id}
                              badgeUrl={entry.club?.badgeUrl}
                              size="xs"
                            />

                            <div className="truncate">
                              <span className="font-bold text-slate-800 truncate block">
                                {scope === 'players' ? entry.name : entry.club?.name}
                              </span>
                              <span className="text-[11px] text-slate-500 font-medium truncate block">
                                {entry.club?.shortName || entry.club?.name}
                              </span>
                            </div>
                          </div>

                          <div className="font-mono font-bold text-slate-900 text-sm shrink-0">
                            {entry.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* VIEW MODE: SINGLE CATEGORY EXPANDED LEADERBOARD */}
          {selectedCategoryKey !== 'all' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              {(() => {
                const activeCat =
                  scope === 'players'
                    ? playerCats[selectedCategoryKey]
                    : teamCats[selectedCategoryKey];

                if (!activeCat) {
                  return (
                    <div className="p-12 text-center text-slate-500">
                      Category not found for this season.
                    </div>
                  );
                }

                const filteredEntries = (activeCat.entries as any[]).filter((entry) => {
                  if (!searchQuery.trim()) return true;
                  const q = searchQuery.toLowerCase();
                  const name = scope === 'players' ? entry.name : entry.club?.name;
                  const club = entry.club?.name || '';
                  return name.toLowerCase().includes(q) || club.toLowerCase().includes(q);
                });

                const maxValue = activeCat.entries[0]?.value || 1;

                return (
                  <div>
                    {/* Leaderboard Header */}
                    <div className="p-4 sm:p-6 bg-gradient-to-r from-purple-900 to-[#38003c] text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-[#00ff85] shrink-0">
                          <Trophy className="w-6 h-6" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-[#00ff85] uppercase tracking-wider">
                            Full Leaderboard
                          </span>
                          <h3 className="text-xl sm:text-2xl font-black text-white">
                            {activeCat.categoryLabel}
                          </h3>
                          <p className="text-xs text-purple-200/80 mt-0.5">
                            Season {seasonInfo.label} • {activeCat.entries.length} Ranked {scope === 'players' ? 'Players' : 'Clubs'}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedCategoryKey('all')}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition cursor-pointer self-start sm:self-auto"
                      >
                        Back to All Categories
                      </button>
                    </div>

                    {/* Table of Rankings */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs sm:text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px] tracking-wider">
                          <tr>
                            <th className="py-3.5 px-4 text-center w-14">Rank</th>
                            <th className="py-3.5 px-4">{scope === 'players' ? 'Player' : 'Club'}</th>
                            <th className="py-3.5 px-4 hidden sm:table-cell">Club</th>
                            {scope === 'players' && (
                              <>
                                <th className="py-3.5 px-4 hidden md:table-cell">Position</th>
                                <th className="py-3.5 px-4 hidden lg:table-cell">Nationality</th>
                              </>
                            )}
                            <th className="py-3.5 px-4 text-right">{activeCat.unit.toUpperCase()}</th>
                            <th className="py-3.5 px-4 hidden md:table-cell w-44">Distribution</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredEntries.length === 0 ? (
                            <tr>
                              <td colSpan={scope === 'players' ? 6 : 4} className="py-12 text-center text-slate-500 text-sm">
                                {searchQuery.trim() ? (
                                  <div className="flex flex-col items-center justify-center gap-2">
                                    <span>No entries matching &quot;{searchQuery}&quot; in this leaderboard.</span>
                                    <button
                                      type="button"
                                      onClick={() => setSearchQuery('')}
                                      className="text-xs text-[#38003c] font-bold hover:underline cursor-pointer"
                                    >
                                      Clear search filter
                                    </button>
                                  </div>
                                ) : (
                                  <span>No statistics recorded in this category.</span>
                                )}
                              </td>
                            </tr>
                          ) : (
                            filteredEntries.map((entry, idx) => {
                            const pct = Math.round(((entry.value || 0) / maxValue) * 100);

                            return (
                              <tr
                                key={scope === 'players' ? entry.playerId || idx : entry.club?.id || idx}
                                className="hover:bg-purple-50/40 transition"
                              >
                                <td className="py-3 px-4 text-center">
                                  {getRankBadge(entry.rank || idx + 1)}
                                </td>

                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-3">
                                    <ClubBadge
                                      name={entry.club?.name}
                                      id={entry.club?.id}
                                      badgeUrl={entry.club?.badgeUrl}
                                      size="sm"
                                    />
                                    <div>
                                      <span className="font-black text-slate-900 block leading-tight">
                                        {scope === 'players' ? entry.name : entry.club?.name}
                                      </span>
                                      <span className="sm:hidden text-xs text-slate-500 font-medium">
                                        {entry.club?.shortName || entry.club?.name}
                                      </span>
                                    </div>
                                  </div>
                                </td>

                                <td className="py-3 px-4 hidden sm:table-cell font-semibold text-slate-700">
                                  {entry.club?.name}
                                </td>

                                {scope === 'players' && (
                                  <>
                                    <td className="py-3 px-4 hidden md:table-cell">
                                      {entry.position ? (
                                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700">
                                          {entry.position}
                                        </span>
                                      ) : (
                                        '-'
                                      )}
                                    </td>
                                    <td className="py-3 px-4 hidden lg:table-cell text-slate-600 font-medium">
                                      {entry.nationality?.country || '-'}
                                    </td>
                                  </>
                                )}

                                <td className="py-3 px-4 text-right">
                                  <span className="font-mono font-black text-base sm:text-lg text-[#38003c]">
                                    {entry.value}
                                  </span>
                                </td>

                                <td className="py-3 px-4 hidden md:table-cell">
                                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                    <div
                                      className="bg-gradient-to-r from-[#38003c] to-[#00ff85] h-full rounded-full transition-all duration-500"
                                      style={{ width: `${pct}%` }}
                                    ></div>
                                  </div>
                                </td>
                              </tr>
                            );
                          }))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </>
      )}
    </div>
  );
};
