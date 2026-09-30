import React, { useState, useEffect } from 'react';
import {
  Search,
  LayoutGrid,
  List,
  Calendar,
  AlertCircle,
  RefreshCw,
  Clock,
  CheckCircle2,
  Trophy,
  Filter
} from 'lucide-react';
import { Header } from './components/Header';
import { MatchCard } from './components/MatchCard';
import { StatsOverview } from './components/StatsOverview';
import { MatchweekSelector } from './components/MatchweekSelector';
import { LeagueTable } from './components/LeagueTable';
import { PremierLeagueStats } from './components/PremierLeagueStats';
import { MatchDetailsPage } from './components/MatchDetailsPage';
import { HomeScreen } from './components/HomeScreen';
import { MatchFixture, ScrapeResponse, StandingsResponse, StatsOverviewResponse, SeasonScheduleResponse } from './types';
import {
  fetchMatchweekMatches,
  fetchLeagueTable,
  fetchStatsOverview,
  fetchSeasonMatchweeks,
  fetchPrimeiraLigaMatchweeks,
  fetchPrimeiraLigaMatches,
  fetchPrimeiraLigaTable,
  fetchPrimeiraLigaStats
} from './services/scraper';
import { findSeasonBySlug } from './data/seasons';

function parseRoute(pathname: string): { view: 'home' | 'match'; matchId?: string } {
  const cleanPath = pathname.replace(/\/+$/, '') || '/';
  const matchPattern = cleanPath.match(/^\/(?:match|matches|h2h)\/([a-zA-Z0-9_-]+)/);
  if (matchPattern) {
    return { view: 'match', matchId: matchPattern[1] };
  }
  return { view: 'home' };
}

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<{ view: 'home' | 'match'; matchId?: string }>(() =>
    parseRoute(typeof window !== 'undefined' ? window.location.pathname : '/')
  );
  const [currentLeague, setCurrentLeague] = useState<'home' | 'epl' | 'primeira-liga'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const l = params.get('league');
      if (l === 'primeira-liga' || l === 'epl') return l;
    }
    return 'home';
  });

  const [activeTab, setActiveTab] = useState<'fixtures' | 'table' | 'stats'>('fixtures');
  const [selectedSeasonSlug, setSelectedSeasonSlug] = useState<string>('2026-27');
  const [selectedMatchweek, setSelectedMatchweek] = useState<number>(5);
  const [seasonSchedule, setSeasonSchedule] = useState<SeasonScheduleResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [scrapeData, setScrapeData] = useState<ScrapeResponse | null>(null);

  // Table State
  const [tableData, setTableData] = useState<StandingsResponse | null>(null);
  const [tableMatchweek, setTableMatchweek] = useState<number | 'all'>(5);
  const [tableLoading, setTableLoading] = useState<boolean>(false);
  const [tableError, setTableError] = useState<string | null>(null);

  // Stats State
  const [statsData, setStatsData] = useState<StatsOverviewResponse | null>(null);
  const [statsLoading, setStatsLoading] = useState<boolean>(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  // Filter and view state for fixtures
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'played' | 'upcoming'>('all');
  const [selectedMatch, setSelectedMatch] = useState<MatchFixture | null>(null);

  const loadMatches = async (seasonSlug: string, mwNumber: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMatchweekMatches(seasonSlug, mwNumber);
      setScrapeData(data);
      setSelectedSeasonSlug(data.seasonId || seasonSlug);
      setSelectedMatchweek(data.matchweekId || mwNumber);
    } catch (err: any) {
      console.error('Failed to load Premier League fixtures:', err);
      setError(err.message || 'Failed to load fixtures for the selected season and matchweek.');
    } finally {
      setLoading(false);
    }
  };

  const loadSeasonSchedule = async (seasonSlug: string, requestedMw?: number) => {
    setLoading(true);
    try {
      const schedule = await fetchSeasonMatchweeks(seasonSlug);
      setSeasonSchedule(schedule);

      const mwToLoad = requestedMw || schedule.recommendedMatchweek || 1;
      setSelectedMatchweek(mwToLoad);
      setTableMatchweek(mwToLoad);
      loadMatches(seasonSlug, mwToLoad);
    } catch (e) {
      console.warn('Failed to load season schedule:', e);
      const fallbackMw = requestedMw || 1;
      setSelectedMatchweek(fallbackMw);
      loadMatches(seasonSlug, fallbackMw);
    }
  };

  const loadTable = async (seasonSlug: string, mw: number | 'all') => {
    setTableLoading(true);
    setTableError(null);
    try {
      const data = await fetchLeagueTable(seasonSlug, mw);
      setTableData(data);
    } catch (err: any) {
      console.error('Failed to load table standings:', err);
      setTableError(err.message || 'Failed to load table standings.');
    } finally {
      setTableLoading(false);
    }
  };

  const loadStats = async (seasonSlug: string) => {
    setStatsLoading(true);
    setStatsError(null);
    try {
      const data = await fetchStatsOverview(seasonSlug);
      setStatsData(data);
    } catch (err: any) {
      console.error('Failed to load stats overview:', err);
      setStatsError(err.message || 'Failed to load Premier League statistics.');
    } finally {
      setStatsLoading(false);
    }
  };

  const loadPrimeiraLigaData = async (requestedJornada?: number) => {
    setLoading(true);
    setTableLoading(true);
    setStatsLoading(true);
    setError(null);
    setTableError(null);
    setStatsError(null);

    try {
      const schedule = await fetchPrimeiraLigaMatchweeks();
      setSeasonSchedule(schedule);
      const jToLoad = requestedJornada || schedule.recommendedMatchweek || 7;
      setSelectedMatchweek(jToLoad);
      setTableMatchweek(jToLoad);

      const [matchesRes, tableRes, statsRes] = await Promise.all([
        fetchPrimeiraLigaMatches(jToLoad),
        fetchPrimeiraLigaTable(),
        fetchPrimeiraLigaStats()
      ]);

      setScrapeData(matchesRes);
      setTableData(tableRes);
      setStatsData(statsRes);
    } catch (err: any) {
      console.error('Failed to load Primeira Liga data:', err);
      setError(err.message || 'Failed to load Portuguese Primeira Liga data.');
    } finally {
      setLoading(false);
      setTableLoading(false);
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const l = params.get('league');

    if (l === 'primeira-liga') {
      setCurrentLeague('primeira-liga');
      loadPrimeiraLigaData();
    } else if (l === 'epl') {
      setCurrentLeague('epl');
      loadSeasonSchedule(selectedSeasonSlug);
      loadTable(selectedSeasonSlug, tableMatchweek);
      loadStats(selectedSeasonSlug);
    }

    const handlePopState = () => {
      setCurrentRoute(parseRoute(window.location.pathname));
      const p2 = new URLSearchParams(window.location.search);
      const l2 = p2.get('league');
      if (l2 === 'primeira-liga' || l2 === 'epl') {
        setCurrentLeague(l2);
      } else if (!window.location.pathname.startsWith('/match')) {
        setCurrentLeague('home');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleSelectLeague = (league: 'epl' | 'primeira-liga') => {
    setCurrentLeague(league);
    const url = new URL(window.location.href);
    url.searchParams.set('league', league);
    window.history.pushState(null, '', url.toString());

    if (league === 'primeira-liga') {
      loadPrimeiraLigaData();
    } else {
      loadSeasonSchedule(selectedSeasonSlug);
      loadTable(selectedSeasonSlug, tableMatchweek);
      loadStats(selectedSeasonSlug);
    }
  };

  const handleOpenHomeScreen = () => {
    setCurrentLeague('home');
    const url = new URL(window.location.href);
    url.searchParams.delete('league');
    window.history.pushState(null, '', url.toString());
  };

  const handleSeasonChange = (newSeasonSlug: string) => {
    if (currentLeague === 'primeira-liga') return;
    setSelectedSeasonSlug(newSeasonSlug);
    loadSeasonSchedule(newSeasonSlug);
    loadTable(newSeasonSlug, 'all');
    loadStats(newSeasonSlug);
  };

  const handleMatchweekChange = (newMw: number) => {
    setSelectedMatchweek(newMw);
    setTableMatchweek(newMw);
    if (currentLeague === 'primeira-liga') {
      setLoading(true);
      fetchPrimeiraLigaMatches(newMw).then((data) => {
        setScrapeData(data);
        setLoading(false);
      });
    } else {
      loadMatches(selectedSeasonSlug, newMw);
    }
  };

  const navigateToMatch = (matchId: string, match?: MatchFixture) => {
    if (match) {
      setSelectedMatch(match);
    }
    const targetUrl = `/match/${matchId}`;
    if (window.location.pathname !== targetUrl) {
      window.history.pushState(null, '', targetUrl);
    }
    setCurrentRoute({ view: 'match', matchId });
  };

  const navigateToHome = (tab?: 'fixtures' | 'table' | 'stats') => {
    if (tab) {
      setActiveTab(tab);
    }
    if (window.location.pathname !== '/') {
      window.history.pushState(null, '', '/');
    }
    setCurrentRoute({ view: 'home' });
  };

  const handleTableMatchweekChange = (mw: number | 'all') => {
    setTableMatchweek(mw);
    loadTable(selectedSeasonSlug, mw);
  };

  const handleTabChange = (tab: 'fixtures' | 'table' | 'stats') => {
    if (currentRoute.view === 'match') {
      navigateToHome(tab);
    } else {
      setActiveTab(tab);
    }
    if (tab === 'table' && !tableData) {
      loadTable(selectedSeasonSlug, tableMatchweek);
    }
    if (tab === 'stats' && !statsData) {
      loadStats(selectedSeasonSlug);
    }
  };

  const allMatches = scrapeData?.matches || [];
  const playedCount = allMatches.filter(
    (m) => m.period === 'FullTime' || typeof m.homeTeam.score === 'number'
  ).length;
  const upcomingCount = allMatches.length - playedCount;

  const filteredMatches = allMatches.filter((m) => {
    const hasScore = typeof m.homeTeam.score === 'number' && typeof m.awayTeam.score === 'number';
    const isPlayed = m.period === 'FullTime' || hasScore;

    if (statusFilter === 'played' && !isPlayed) return false;
    if (statusFilter === 'upcoming' && isPlayed) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.homeTeam.name.toLowerCase().includes(q) ||
      m.awayTeam.name.toLowerCase().includes(q) ||
      m.homeTeam.shortName.toLowerCase().includes(q) ||
      m.awayTeam.shortName.toLowerCase().includes(q) ||
      m.ground.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-[#00ff85] selection:text-[#38003c]">
      {/* Header */}
      <Header
        onRefresh={() => {
          if (currentLeague === 'primeira-liga') {
            loadPrimeiraLigaData(selectedMatchweek);
          } else {
            if (activeTab === 'fixtures') {
              loadMatches(selectedSeasonSlug, selectedMatchweek);
            } else if (activeTab === 'table') {
              loadTable(selectedSeasonSlug, tableMatchweek);
            } else {
              loadStats(selectedSeasonSlug);
            }
          }
        }}
        loading={activeTab === 'fixtures' ? loading : activeTab === 'table' ? tableLoading : statsLoading}
        scrapeData={scrapeData}
        tableData={tableData}
        statsData={statsData}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        currentLeague={currentLeague === 'home' ? 'epl' : currentLeague}
        onLeagueChange={handleSelectLeague}
        onOpenHomeScreen={handleOpenHomeScreen}
      />

      {/* Main Content Area */}
      {currentRoute.view === 'match' && currentRoute.matchId ? (
        <MatchDetailsPage
          matchId={currentRoute.matchId}
          initialMatch={
            selectedMatch && selectedMatch.matchId === currentRoute.matchId
              ? selectedMatch
              : scrapeData?.matches?.find((m) => m.matchId === currentRoute.matchId) || null
          }
          onBack={() => navigateToHome('fixtures')}
          onNavigateMatch={(id) => navigateToMatch(id)}
        />
      ) : currentLeague === 'home' ? (
        <HomeScreen onSelectLeague={handleSelectLeague} />
      ) : (
        <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
          {/* TAB 1: STATS & LEADERBOARDS */}
        {activeTab === 'stats' && (
          <div>
            {statsError && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-start gap-3 shadow-xs">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-bold text-sm">Notice</h3>
                  <p className="text-xs text-red-700 mt-0.5">{statsError}</p>
                </div>
                <button
                  type="button"
                  onClick={() => loadStats(selectedSeasonSlug)}
                  className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-900 rounded-lg text-xs font-semibold cursor-pointer transition"
                >
                  Retry
                </button>
              </div>
            )}

            <PremierLeagueStats
              statsData={statsData}
              loading={statsLoading}
              selectedSeasonSlug={selectedSeasonSlug}
              onSeasonChange={handleSeasonChange}
              onRefresh={() => loadStats(selectedSeasonSlug)}
            />
          </div>
        )}

        {/* TAB 2: LEAGUE TABLE */}
        {activeTab === 'table' && (
          <div>
            {tableError && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-start gap-3 shadow-xs">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-bold text-sm">Notice</h3>
                  <p className="text-xs text-red-700 mt-0.5">{tableError}</p>
                </div>
                <button
                  type="button"
                  onClick={() => loadTable(selectedSeasonSlug, tableMatchweek)}
                  className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-900 rounded-lg text-xs font-semibold cursor-pointer transition"
                >
                  Retry
                </button>
              </div>
            )}

            <LeagueTable
              tableData={tableData}
              loading={tableLoading}
              selectedSeasonSlug={selectedSeasonSlug}
              selectedMatchweek={tableMatchweek}
              onSeasonChange={handleSeasonChange}
              onMatchweekChange={handleTableMatchweekChange}
              onRefresh={() => loadTable(selectedSeasonSlug, tableMatchweek)}
            />
          </div>
        )}

        {/* TAB 2: FIXTURES & RESULTS */}
        {activeTab === 'fixtures' && (
          <div>
            {/* Matchweek & Season Dropdown Selector */}
            <MatchweekSelector
              currentMatchweek={selectedMatchweek}
              currentSeasonSlug={selectedSeasonSlug}
              onMatchweekChange={handleMatchweekChange}
              onSeasonChange={handleSeasonChange}
              totalMatches={scrapeData?.totalMatches || 0}
              playedMatchesCount={playedCount}
              maxMatchweeks={scrapeData?.maxMatchweeks || findSeasonBySlug(selectedSeasonSlug).maxMatchweeks}
              loading={loading}
              scheduleInfo={seasonSchedule?.matchweeks || []}
              recommendedMatchweek={seasonSchedule?.recommendedMatchweek}
              hasMatchToday={seasonSchedule?.hasMatchToday}
              lastPlayedMatchweek={seasonSchedule?.lastPlayedMatchweek}
            />

            {/* Error notification */}
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-start gap-3 shadow-xs">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-bold text-sm">Notice</h3>
                  <p className="text-xs text-red-700 mt-0.5">{error}</p>
                </div>
                <button
                  type="button"
                  onClick={() => loadMatches(selectedSeasonSlug, selectedMatchweek)}
                  className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-900 rounded-lg text-xs font-semibold cursor-pointer transition"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Loading Skeleton */}
            {loading && !scrapeData && (
              <div className="space-y-6 animate-pulse">
                <div className="h-16 bg-slate-200 rounded-xl"></div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-20 bg-slate-200 rounded-xl"></div>
                  ))}
                </div>
                <div className="h-12 bg-slate-200 rounded-xl"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-56 bg-slate-200 rounded-xl"></div>
                  ))}
                </div>
              </div>
            )}

            {scrapeData && (
              <>
                {/* Stats Overview */}
                <StatsOverview data={scrapeData} />

                {/* Controls Bar: Search, Status Filter & View Toggles */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                  {/* Search input & Filter pills */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
                    {/* Search input */}
                    <div className="relative flex-1 max-w-sm">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Filter by club or stadium..."
                        className="w-full bg-slate-50 text-slate-800 placeholder-slate-400 text-xs rounded-lg pl-9 pr-4 py-2 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#38003c]"
                      />
                    </div>

                    {/* Status Filter Buttons */}
                    {allMatches.length > 0 && (
                      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                        <button
                          type="button"
                          onClick={() => setStatusFilter('all')}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
                            statusFilter === 'all'
                              ? 'bg-white text-slate-900 shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          All ({allMatches.length})
                        </button>

                        {playedCount > 0 && (
                          <button
                            type="button"
                            onClick={() => setStatusFilter('played')}
                            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition cursor-pointer flex items-center gap-1 ${
                              statusFilter === 'played'
                                ? 'bg-emerald-600 text-white shadow-2xs'
                                : 'text-slate-600 hover:text-emerald-700'
                            }`}
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Results ({playedCount})</span>
                          </button>
                        )}

                        {upcomingCount > 0 && (
                          <button
                            type="button"
                            onClick={() => setStatusFilter('upcoming')}
                            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition cursor-pointer flex items-center gap-1 ${
                              statusFilter === 'upcoming'
                                ? 'bg-[#38003c] text-white shadow-2xs'
                                : 'text-slate-600 hover:text-purple-900'
                            }`}
                          >
                            <Clock className="w-3 h-3" />
                            <span>Fixtures ({upcomingCount})</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* View switches */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg self-start lg:self-auto">
                    <button
                      type="button"
                      onClick={() => setViewMode('grid')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                        viewMode === 'grid'
                          ? 'bg-white text-[#38003c] shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      <span>Grid Cards</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setViewMode('table')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                        viewMode === 'table'
                          ? 'bg-white text-[#38003c] shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <List className="w-3.5 h-3.5" />
                      <span>Results Table</span>
                    </button>
                  </div>
                </div>

                {/* View 1: Grid Cards */}
                {viewMode === 'grid' && (
                  <>
                    {filteredMatches.length === 0 ? (
                      <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-500 text-sm">
                        {searchQuery.trim() ? (
                          <div className="flex flex-col items-center justify-center gap-2">
                            <span>No matches matching &quot;{searchQuery}&quot; found.</span>
                            <button
                              type="button"
                              onClick={() => setSearchQuery('')}
                              className="text-xs text-[#38003c] font-bold hover:underline cursor-pointer"
                            >
                              Clear search filter
                            </button>
                          </div>
                        ) : statusFilter !== 'all' ? (
                          <span>No {statusFilter === 'played' ? 'completed results' : 'upcoming fixtures'} for this matchweek.</span>
                        ) : (
                          <span>No matches found for this matchweek.</span>
                        )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredMatches.map((match, idx) => (
                          <MatchCard
                            key={match.matchId}
                            match={match}
                            index={idx}
                            onSelectMatch={(m) => navigateToMatch(m.matchId, m)}
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* View 2: List Table */}
                {viewMode === 'table' && (
                  <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px] tracking-wider">
                          <tr>
                            <th className="py-3 px-4">#</th>
                            <th className="py-3 px-4">Home Club</th>
                            <th className="py-3 px-4 text-center">Score / Status</th>
                            <th className="py-3 px-4">Away Club</th>
                            <th className="py-3 px-4">Kick-off Date</th>
                            <th className="py-3 px-4">Stadium / Ground</th>
                            <th className="py-3 px-4 text-right">Details</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredMatches.map((m, idx) => {
                            const hasScore = typeof m.homeTeam.score === 'number' && typeof m.awayTeam.score === 'number';
                            const isHomeWon = hasScore && (m.homeTeam.score as number) > (m.awayTeam.score as number);
                            const isAwayWon = hasScore && (m.awayTeam.score as number) > (m.homeTeam.score as number);

                            return (
                              <tr key={m.matchId} className="hover:bg-purple-50/40 transition">
                                <td className="py-3 px-4 font-mono text-slate-400">{idx + 1}</td>
                                <td className={`py-3 px-4 ${isHomeWon ? 'font-black text-slate-900' : 'font-semibold text-slate-700'}`}>
                                  <div className="flex items-center gap-2">
                                    {m.homeTeam.badgeUrl && (
                                      <img
                                        src={m.homeTeam.badgeUrl}
                                        alt=""
                                        className="w-5 h-5 object-contain"
                                        onError={(e) => {
                                          (e.target as HTMLElement).style.display = 'none';
                                        }}
                                      />
                                    )}
                                    <span>{m.homeTeam.name}</span>
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-center">
                                  {hasScore ? (
                                    <div className="inline-flex flex-col items-center">
                                      <span className="px-2.5 py-0.5 rounded bg-slate-100 font-mono font-black text-slate-900 text-xs border border-slate-200 shadow-2xs">
                                        {m.homeTeam.score} - {m.awayTeam.score}
                                      </span>
                                      <span className="text-[10px] font-bold text-emerald-700 mt-0.5">
                                        FT
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 font-semibold text-slate-700 text-[11px]">
                                      {m.period}
                                    </span>
                                  )}
                                </td>
                                <td className={`py-3 px-4 ${isAwayWon ? 'font-black text-slate-900' : 'font-semibold text-slate-700'}`}>
                                  <div className="flex items-center gap-2">
                                    {m.awayTeam.badgeUrl && (
                                      <img
                                        src={m.awayTeam.badgeUrl}
                                        alt=""
                                        className="w-5 h-5 object-contain"
                                        onError={(e) => {
                                          (e.target as HTMLElement).style.display = 'none';
                                        }}
                                      />
                                    )}
                                    <span>{m.awayTeam.name}</span>
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-slate-600 font-medium">
                                  {m.kickoff} {m.kickoffTimezone}
                                </td>
                                <td className="py-3 px-4 text-slate-600 truncate max-w-[200px]">
                                  {m.ground}
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <a
                                    href={`/match/${m.matchId}`}
                                    onClick={(e) => {
                                      if (!e.ctrlKey && !e.metaKey && e.button === 0) {
                                        e.preventDefault();
                                        navigateToMatch(m.matchId, m);
                                      }
                                    }}
                                    className="inline-block px-2.5 py-1 text-xs font-semibold text-[#38003c] bg-purple-50 hover:bg-[#38003c] hover:text-white rounded-lg transition border border-purple-200 cursor-pointer"
                                  >
                                    {hasScore ? 'Result & H2H' : 'H2H History'}
                                  </a>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>
      )}

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Premier League Hub</span>
            <span>•</span>
            <span>1992-93 to Date Seasons</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Fixtures, Results, Standings & Season Statistics</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
