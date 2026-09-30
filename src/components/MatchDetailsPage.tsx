import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Trophy,
  Shield,
  TrendingUp,
  Share2,
  Check,
  RefreshCw,
  AlertCircle,
  Clock,
  Award,
  Sparkles,
  ExternalLink,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import { MatchFixture, MatchFullDetailsResponse, PreviousMeeting } from '../types';
import { fetchMatchFullDetails } from '../services/scraper';
import { ClubBadge } from './ClubBadge';
import { calculateWinProbability } from '../utils/winProbability';
import { AiMatchAnalysis } from './AiMatchAnalysis';

interface MatchDetailsPageProps {
  matchId: string;
  initialMatch?: MatchFixture | null;
  onBack: () => void;
  onNavigateMatch?: (matchId: string) => void;
}

export const MatchDetailsPage: React.FC<MatchDetailsPageProps> = ({
  matchId,
  initialMatch,
  onBack,
  onNavigateMatch
}) => {
  const [data, setData] = useState<MatchFullDetailsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [h2hFilter, setH2hFilter] = useState<'all' | 'home' | 'away'>('all');

  const loadMatchDetails = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchMatchFullDetails(id);
      if (result) {
        setData(result);
      } else if (!initialMatch) {
        setError(`Unable to retrieve match details for Match ID #${id}.`);
      }
    } catch (err: any) {
      console.error('Failed to load match details:', err);
      if (!initialMatch) {
        setError(err.message || 'Failed to load match details and head-to-head records.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMatchDetails(matchId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [matchId]);

  // Handle Share link copy
  const handleShare = async () => {
    try {
      const url = `${window.location.origin}/match/${matchId}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.warn('Clipboard write failed:', err);
    }
  };

  // Determine current fixture from loaded data or initial fallback
  const fixture: MatchFixture | null = data?.fixture || initialMatch || null;

  const hasScore = typeof fixture?.homeTeam?.score === 'number' && typeof fixture?.awayTeam?.score === 'number';
  const isFinished = fixture?.period === 'FullTime' || hasScore;
  const isHomeWinner = hasScore && (fixture!.homeTeam.score as number) > (fixture!.awayTeam.score as number);
  const isAwayWinner = hasScore && (fixture!.awayTeam.score as number) > (fixture!.homeTeam.score as number);
  const isDraw = hasScore && (fixture!.homeTeam.score as number) === (fixture!.awayTeam.score as number);

  // Events
  const homeGoals = data?.homeGoals || [];
  const awayGoals = data?.awayGoals || [];
  const homeCards = data?.homeCards || [];
  const awayCards = data?.awayCards || [];
  const hasEvents = homeGoals.length > 0 || awayGoals.length > 0 || homeCards.length > 0 || awayCards.length > 0;

  // Previous meetings & Win Probability
  const previousMeetings = data?.previousMeetings || [];
  const winProb = fixture
    ? calculateWinProbability(fixture.homeTeam, fixture.awayTeam, previousMeetings)
    : null;

  // Head to Head breakdown calculation
  const totalH2H = previousMeetings.length;
  let homeH2HWins = 0;
  let awayH2HWins = 0;
  let drawH2H = 0;
  let totalH2HGoals = 0;

  if (fixture) {
    const homeNameLower = fixture.homeTeam.name.toLowerCase();
    const awayNameLower = fixture.awayTeam.name.toLowerCase();

    for (const m of previousMeetings) {
      const hScore = m.homeTeam?.score ?? 0;
      const aScore = m.awayTeam?.score ?? 0;
      totalH2HGoals += hScore + aScore;

      const isCurrentHomePlayingHome = m.homeTeam?.team?.name?.toLowerCase().includes(homeNameLower) ||
        homeNameLower.includes(m.homeTeam?.team?.name?.toLowerCase() || '');

      if (hScore === aScore) {
        drawH2H++;
      } else if (hScore > aScore) {
        if (isCurrentHomePlayingHome) homeH2HWins++;
        else awayH2HWins++;
      } else {
        if (isCurrentHomePlayingHome) awayH2HWins++;
        else homeH2HWins++;
      }
    }
  }

  // Filter previous meetings based on user selection
  const filteredMeetings = previousMeetings.filter((m) => {
    if (h2hFilter === 'all') return true;
    if (!fixture) return true;
    const homeName = fixture.homeTeam.name.toLowerCase();
    const awayName = fixture.awayTeam.name.toLowerCase();
    if (h2hFilter === 'home') {
      return m.homeTeam?.team?.name?.toLowerCase().includes(homeName) ||
        m.awayTeam?.team?.name?.toLowerCase().includes(homeName);
    }
    return m.homeTeam?.team?.name?.toLowerCase().includes(awayName) ||
      m.awayTeam?.team?.name?.toLowerCase().includes(awayName);
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16 selection:bg-[#00ff85] selection:text-[#38003c]">
      {/* Top Navigation & Breadcrumbs Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          {/* Back button & Breadcrumb */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition cursor-pointer shrink-0 border border-slate-200"
            >
              <ArrowLeft className="w-4 h-4 text-[#38003c]" />
              <span className="hidden sm:inline">Back to Fixtures</span>
              <span className="sm:hidden">Back</span>
            </button>

            <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-400 truncate">
              <span>Premier League</span>
              <ChevronRight className="w-3 h-3 text-slate-300" />
              <span>Match Details & H2H</span>
              {fixture && (
                <>
                  <ChevronRight className="w-3 h-3 text-slate-300" />
                  <span className="font-semibold text-slate-800 truncate">
                    {fixture.homeTeam.shortName || fixture.homeTeam.name} vs{' '}
                    {fixture.awayTeam.shortName || fixture.awayTeam.name}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                document.getElementById('ai-match-insights-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#38003c] text-white hover:bg-[#4d0b52] text-xs font-bold shadow-2xs transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#00ff85]" />
              <span className="hidden sm:inline">AI Analysis</span>
            </button>

            <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-md bg-purple-50 text-[#38003c] text-xs font-mono font-semibold border border-purple-200/80">
              ID: {matchId}
            </span>

            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 shadow-2xs transition cursor-pointer"
              title="Copy shareable match URL"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">Link Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden sm:inline">Share Page</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => loadMatchDetails(matchId)}
              disabled={loading}
              className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 transition cursor-pointer"
              title="Refresh match data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#38003c]' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Error Notification */}
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-start gap-3 shadow-xs">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-bold text-sm">Failed to Load Match Details</h3>
              <p className="text-xs text-red-700 mt-0.5">{error}</p>
            </div>
            <button
              type="button"
              onClick={() => loadMatchDetails(matchId)}
              className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-900 rounded-lg text-xs font-semibold cursor-pointer transition"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading Skeleton if no fixture available yet */}
        {loading && !fixture && (
          <div className="space-y-6 animate-pulse">
            <div className="h-64 bg-slate-200 rounded-2xl"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="h-44 bg-slate-200 rounded-xl"></div>
              <div className="h-44 bg-slate-200 rounded-xl"></div>
              <div className="h-44 bg-slate-200 rounded-xl"></div>
            </div>
          </div>
        )}

        {fixture && (
          <>
            {/* HERO SCOREBOARD & CLASH BANNER */}
            <div className="bg-gradient-to-br from-[#38003c] via-[#2d0030] to-[#1a001c] rounded-2xl text-white shadow-xl overflow-hidden border border-purple-900/60 relative">
              {/* Subtle background glow */}
              <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#00ff85]/5 rounded-full blur-3xl pointer-events-none"></div>

              {/* Banner Top Info Bar */}
              <div className="px-6 py-3.5 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-[#00ff85] flex items-center justify-center text-[#38003c] font-black text-[10px]">
                    PL
                  </div>
                  <span className="font-bold tracking-wide uppercase text-white/90">
                    {fixture.competition || 'Premier League'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {isFinished ? (
                    <span className="px-3 py-0.5 rounded-full bg-[#00ff85] text-[#38003c] font-black text-xs uppercase tracking-wider shadow-xs">
                      Full Time Result
                    </span>
                  ) : fixture.period === 'Live' ? (
                    <span className="px-3 py-0.5 rounded-full bg-red-600 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 animate-pulse shadow-xs">
                      <span className="w-2 h-2 rounded-full bg-white"></span>
                      Live Match
                    </span>
                  ) : (
                    <span className="px-3 py-0.5 rounded-full bg-white/20 text-[#00ff85] font-black text-xs uppercase tracking-wider border border-white/20">
                      Upcoming Fixture
                    </span>
                  )}
                </div>
              </div>

              {/* Main Scoreboard Clash Display */}
              <div className="p-6 sm:p-10">
                <div className="grid grid-cols-1 md:grid-cols-7 items-center gap-6">
                  {/* Home Team */}
                  <div className="md:col-span-3 flex flex-col items-center md:items-end text-center md:text-right">
                    <div className="flex flex-col md:flex-row items-center gap-4">
                      <div className="order-2 md:order-1">
                        <span className="text-[11px] font-bold text-white/50 uppercase tracking-widest block">
                          Home
                        </span>
                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight mt-0.5">
                          {fixture.homeTeam.name}
                        </h1>
                        <span className="text-xs text-white/70 font-medium">
                          {fixture.homeTeam.shortName}
                        </span>
                        {typeof fixture.homeTeam.redCards === 'number' && fixture.homeTeam.redCards > 0 && (
                          <div className="mt-1 flex items-center justify-center md:justify-end gap-1">
                            <span className="w-2.5 h-3.5 bg-red-600 rounded-2xs inline-block"></span>
                            <span className="text-xs text-red-300 font-bold">
                              {fixture.homeTeam.redCards} Red Card
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="order-1 md:order-2 w-20 h-20 sm:w-24 sm:h-24 p-3 bg-white/10 rounded-2xl border border-white/15 backdrop-blur-xs flex items-center justify-center shrink-0 shadow-lg">
                        <ClubBadge
                          name={fixture.homeTeam.name}
                          id={fixture.homeTeam.id}
                          badgeUrl={fixture.homeTeam.badgeUrl}
                          size="xl"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Center: Large Score / VS */}
                  <div className="md:col-span-1 flex flex-col items-center justify-center text-center">
                    {hasScore ? (
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-3 bg-black/40 px-5 py-2.5 rounded-2xl border border-white/15 shadow-inner">
                          <span className={`text-3xl sm:text-4xl lg:text-5xl font-black font-mono ${
                            isHomeWinner ? 'text-[#00ff85]' : 'text-white'
                          }`}>
                            {fixture.homeTeam.score}
                          </span>
                          <span className="text-white/40 text-2xl font-light">-</span>
                          <span className={`text-3xl sm:text-4xl lg:text-5xl font-black font-mono ${
                            isAwayWinner ? 'text-[#00ff85]' : 'text-white'
                          }`}>
                            {fixture.awayTeam.score}
                          </span>
                        </div>

                        {typeof fixture.homeTeam.halfTimeScore === 'number' &&
                          typeof fixture.awayTeam.halfTimeScore === 'number' && (
                            <span className="mt-2 text-xs font-semibold text-white/60 tracking-wider">
                              Half-Time {fixture.homeTeam.halfTimeScore} - {fixture.awayTeam.halfTimeScore}
                            </span>
                          )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <div className="w-14 h-14 rounded-full bg-white/10 border border-white/20 flex items-center justify-center shadow-lg backdrop-blur-xs">
                          <span className="text-[#00ff85] font-black text-lg tracking-wider">VS</span>
                        </div>
                        <span className="text-xs font-bold text-white/70 uppercase tracking-widest mt-2">
                          Scheduled
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Away Team */}
                  <div className="md:col-span-3 flex flex-col items-center md:items-start text-center md:text-left">
                    <div className="flex flex-col md:flex-row items-center gap-4">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 p-3 bg-white/10 rounded-2xl border border-white/15 backdrop-blur-xs flex items-center justify-center shrink-0 shadow-lg">
                        <ClubBadge
                          name={fixture.awayTeam.name}
                          id={fixture.awayTeam.id}
                          badgeUrl={fixture.awayTeam.badgeUrl}
                          size="xl"
                        />
                      </div>

                      <div>
                        <span className="text-[11px] font-bold text-white/50 uppercase tracking-widest block">
                          Away
                        </span>
                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight mt-0.5">
                          {fixture.awayTeam.name}
                        </h1>
                        <span className="text-xs text-white/70 font-medium">
                          {fixture.awayTeam.shortName}
                        </span>
                        {typeof fixture.awayTeam.redCards === 'number' && fixture.awayTeam.redCards > 0 && (
                          <div className="mt-1 flex items-center justify-center md:justify-start gap-1">
                            <span className="w-2.5 h-3.5 bg-red-600 rounded-2xs inline-block"></span>
                            <span className="text-xs text-red-300 font-bold">
                              {fixture.awayTeam.redCards} Red Card
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Match Meta Footer (Kickoff, Stadium, Attendance) */}
              <div className="bg-black/30 border-t border-white/10 px-6 py-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-white/80">
                <div className="flex items-center gap-2.5">
                  <Calendar className="w-4 h-4 text-[#00ff85] shrink-0" />
                  <div>
                    <span className="text-white/40 block text-[10px] font-bold uppercase tracking-wider">Date & Time</span>
                    <span className="font-semibold text-white">{fixture.kickoff} {fixture.kickoffTimezone}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-[#00ff85] shrink-0" />
                  <div className="min-w-0">
                    <span className="text-white/40 block text-[10px] font-bold uppercase tracking-wider">Stadium / Venue</span>
                    <span className="font-semibold text-white truncate block">{fixture.ground || 'Premier League Stadium'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-[#00ff85] shrink-0" />
                  <div>
                    <span className="text-white/40 block text-[10px] font-bold uppercase tracking-wider">Attendance</span>
                    <span className="font-semibold text-white">
                      {fixture.attendance ? `${fixture.attendance.toLocaleString()} supporters` : 'Official Premier League Match'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* WIN PROBABILITY VISUALIZER */}
            {winProb && (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-[#38003c]">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900">
                        Match Win Probability & Projection
                      </h2>
                      <p className="text-xs text-slate-500">
                        Historical head-to-head algorithm with venue and form calibration
                      </p>
                    </div>
                  </div>

                  <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    <span>H2H Projection Model</span>
                  </span>
                </div>

                {/* Probability Stats Row */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-3 text-center">
                  <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-100 flex flex-col items-center">
                    <span className="text-xs text-slate-600 font-semibold truncate max-w-[120px]">
                      {fixture.homeTeam.shortName || fixture.homeTeam.name}
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-[#38003c] font-mono mt-0.5">
                      {winProb.homeProb}%
                    </span>
                    <span className="text-[10px] font-medium text-purple-900/60 uppercase tracking-wider">
                      Home Win
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col items-center">
                    <span className="text-xs text-slate-600 font-semibold">Draw</span>
                    <span className="text-xl sm:text-2xl font-black text-slate-700 font-mono mt-0.5">
                      {winProb.drawProb}%
                    </span>
                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                      Tie Outcome
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100 flex flex-col items-center">
                    <span className="text-xs text-slate-600 font-semibold truncate max-w-[120px]">
                      {fixture.awayTeam.shortName || fixture.awayTeam.name}
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-emerald-700 font-mono mt-0.5">
                      {winProb.awayProb}%
                    </span>
                    <span className="text-[10px] font-medium text-emerald-900/60 uppercase tracking-wider">
                      Away Win
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div
                  className="w-full h-4 bg-slate-200 rounded-full overflow-hidden flex shadow-inner border border-slate-300/60"
                  title={`Home ${winProb.homeProb}% | Draw ${winProb.drawProb}% | Away ${winProb.awayProb}%`}
                >
                  <div
                    className="bg-[#38003c] h-full transition-all duration-700 first:rounded-l-full relative group"
                    style={{ width: `${winProb.homeProb}%` }}
                  />
                  <div
                    className="bg-slate-400 h-full transition-all duration-700 border-x border-white"
                    style={{ width: `${winProb.drawProb}%` }}
                  />
                  <div
                    className="bg-emerald-500 h-full transition-all duration-700 last:rounded-r-full"
                    style={{ width: `${winProb.awayProb}%` }}
                  />
                </div>

                {/* Summary footer */}
                <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
                  <span>
                    {winProb.totalMeetings > 0
                      ? `Based on ${winProb.totalMeetings} recorded Premier League meetings between ${fixture.homeTeam.name} and ${fixture.awayTeam.name} (${winProb.homeWins}W - ${winProb.draws}D - ${winProb.awayWins}L).`
                      : 'Based on baseline league home-advantage and matchup model.'}
                  </span>
                  <span className="font-semibold text-slate-700 shrink-0">
                    Rivalry record: {homeH2HWins} - {drawH2H} - {awayH2HWins}
                  </span>
                </div>
              </div>
            )}

            {/* AI MATCH INSIGHTS & TACTICAL PREDICTION (Gemini API) */}
            <AiMatchAnalysis matchId={matchId} fixture={fixture} />

            {/* GOALSCORERS & MATCH EVENTS (When match has events or is completed) */}
            {isFinished && (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700">
                      <Award className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900">
                        Match Events & Key Moments
                      </h2>
                      <p className="text-xs text-slate-500">Goalscorers, penalty conversions, and disciplinary actions</p>
                    </div>
                  </div>
                </div>

                {hasEvents ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Home Club Events */}
                    <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
                      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-200">
                        <ClubBadge name={fixture.homeTeam.name} id={fixture.homeTeam.id} badgeUrl={fixture.homeTeam.badgeUrl} size="sm" />
                        <span className="font-bold text-sm text-slate-900">{fixture.homeTeam.name}</span>
                      </div>

                      <div className="space-y-2">
                        {homeGoals.length > 0 ? (
                          homeGoals.map((g, idx) => (
                            <div key={`h-goal-${idx}`} className="flex items-center justify-between text-xs bg-white p-2.5 rounded-lg border border-slate-100 shadow-2xs">
                              <div className="flex items-center gap-2">
                                <span className="text-emerald-600 font-bold text-sm">⚽</span>
                                <div>
                                  <span className="font-bold text-slate-900">{g.playerName}</span>
                                  {g.goalType && g.goalType !== 'Goal' && (
                                    <span className="ml-1.5 text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-semibold border border-amber-200">
                                      {g.goalType}
                                    </span>
                                  )}
                                  {g.assistPlayerName && (
                                    <span className="block text-[11px] text-slate-400">
                                      Assist: {g.assistPlayerName}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <span className="font-mono font-bold text-slate-700 text-xs px-2 py-0.5 bg-slate-100 rounded">
                                {g.time}&apos;
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="text-xs text-slate-400 italic py-2">No goals scored</div>
                        )}

                        {homeCards.map((c, idx) => (
                          <div key={`h-card-${idx}`} className="flex items-center justify-between text-xs bg-white p-2 rounded-lg border border-slate-100 text-slate-600">
                            <div className="flex items-center gap-2">
                              <span>{c.type === 'Red' ? '🟥' : '🟨'}</span>
                              <span className="font-medium">{c.playerName}</span>
                            </div>
                            <span className="font-mono text-slate-400 text-xs">{c.time}&apos;</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Away Club Events */}
                    <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
                      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-200">
                        <ClubBadge name={fixture.awayTeam.name} id={fixture.awayTeam.id} badgeUrl={fixture.awayTeam.badgeUrl} size="sm" />
                        <span className="font-bold text-sm text-slate-900">{fixture.awayTeam.name}</span>
                      </div>

                      <div className="space-y-2">
                        {awayGoals.length > 0 ? (
                          awayGoals.map((g, idx) => (
                            <div key={`a-goal-${idx}`} className="flex items-center justify-between text-xs bg-white p-2.5 rounded-lg border border-slate-100 shadow-2xs">
                              <div className="flex items-center gap-2">
                                <span className="text-emerald-600 font-bold text-sm">⚽</span>
                                <div>
                                  <span className="font-bold text-slate-900">{g.playerName}</span>
                                  {g.goalType && g.goalType !== 'Goal' && (
                                    <span className="ml-1.5 text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-semibold border border-amber-200">
                                      {g.goalType}
                                    </span>
                                  )}
                                  {g.assistPlayerName && (
                                    <span className="block text-[11px] text-slate-400">
                                      Assist: {g.assistPlayerName}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <span className="font-mono font-bold text-slate-700 text-xs px-2 py-0.5 bg-slate-100 rounded">
                                {g.time}&apos;
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="text-xs text-slate-400 italic py-2">No goals scored</div>
                        )}

                        {awayCards.map((c, idx) => (
                          <div key={`a-card-${idx}`} className="flex items-center justify-between text-xs bg-white p-2 rounded-lg border border-slate-100 text-slate-600">
                            <div className="flex items-center gap-2">
                              <span>{c.type === 'Red' ? '🟥' : '🟨'}</span>
                              <span className="font-medium">{c.playerName}</span>
                            </div>
                            <span className="font-mono text-slate-400 text-xs">{c.time}&apos;</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-slate-500 text-xs bg-slate-50 rounded-xl border border-slate-100">
                    Official goal scorers and cards are recorded in match reports.
                  </div>
                )}
              </div>
            )}

            {/* HEAD-TO-HEAD HISTORICAL ARCHIVE SECTION */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Head-to-Head (H2H) Historical Archive
                    </h2>
                    <p className="text-xs text-slate-500">
                      Complete recorded encounters between {fixture.homeTeam.name} and {fixture.awayTeam.name}
                    </p>
                  </div>
                </div>

                {/* Filter buttons */}
                {previousMeetings.length > 0 && (
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg self-start sm:self-auto text-xs">
                    <button
                      type="button"
                      onClick={() => setH2hFilter('all')}
                      className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
                        h2hFilter === 'all'
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      All ({previousMeetings.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setH2hFilter('home')}
                      className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
                        h2hFilter === 'home'
                          ? 'bg-[#38003c] text-white shadow-2xs'
                          : 'text-slate-600 hover:text-[#38003c]'
                      }`}
                    >
                      {fixture.homeTeam.shortName || fixture.homeTeam.name}
                    </button>
                    <button
                      type="button"
                      onClick={() => setH2hFilter('away')}
                      className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
                        h2hFilter === 'away'
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-emerald-700'
                      }`}
                    >
                      {fixture.awayTeam.shortName || fixture.awayTeam.name}
                    </button>
                  </div>
                )}
              </div>

              {/* H2H Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Meetings</span>
                  <span className="text-2xl font-black text-slate-900 font-mono mt-0.5 block">{totalH2H}</span>
                </div>

                <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100 text-center">
                  <span className="text-[11px] font-bold text-[#38003c] uppercase tracking-wider block truncate">
                    {fixture.homeTeam.shortName} Wins
                  </span>
                  <span className="text-2xl font-black text-[#38003c] font-mono mt-0.5 block">{homeH2HWins}</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Draws</span>
                  <span className="text-2xl font-black text-slate-700 font-mono mt-0.5 block">{drawH2H}</span>
                </div>

                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 text-center">
                  <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block truncate">
                    {fixture.awayTeam.shortName} Wins
                  </span>
                  <span className="text-2xl font-black text-emerald-700 font-mono mt-0.5 block">{awayH2HWins}</span>
                </div>

                <div className="col-span-2 sm:col-span-1 p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Goals</span>
                  <span className="text-2xl font-black text-slate-900 font-mono mt-0.5 block">{totalH2HGoals}</span>
                </div>
              </div>

              {/* Meetings List */}
              {filteredMeetings.length > 0 ? (
                <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                  {filteredMeetings.map((meeting, idx) => {
                    const hScore = meeting.homeTeam?.score ?? 0;
                    const aScore = meeting.awayTeam?.score ?? 0;
                    const homeWon = hScore > aScore;
                    const awayWon = aScore > hScore;
                    const isDrawMatch = hScore === aScore;

                    const matchDate = meeting.kickoff?.split(' ')[0] || '';

                    return (
                      <div
                        key={`meeting-${idx}`}
                        className="p-3.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs transition"
                      >
                        {/* Date & Ground */}
                        <div className="flex items-center gap-2 text-slate-500 font-mono text-[11px] sm:min-w-[120px] self-start sm:self-auto">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{matchDate}</span>
                        </div>

                        {/* Teams & Score Clash */}
                        <div className="flex-1 flex items-center justify-center gap-3 w-full sm:w-auto">
                          <span className={`text-right flex-1 truncate ${
                            homeWon ? 'font-black text-slate-900' : 'text-slate-600'
                          }`}>
                            {meeting.homeTeam?.team?.name}
                          </span>

                          <span className={`px-3 py-1 rounded-lg font-mono font-black text-xs shadow-2xs border ${
                            isDrawMatch
                              ? 'bg-white text-slate-800 border-slate-200'
                              : 'bg-slate-900 text-white border-slate-900'
                          }`}>
                            {hScore} - {aScore}
                          </span>

                          <span className={`text-left flex-1 truncate ${
                            awayWon ? 'font-black text-slate-900' : 'text-slate-600'
                          }`}>
                            {meeting.awayTeam?.team?.name}
                          </span>
                        </div>

                        {/* Venue */}
                        <div className="text-[11px] text-slate-400 truncate max-w-[150px] text-right self-end sm:self-auto flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-300" />
                          <span>{meeting.ground || 'Premier League'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500 text-xs bg-slate-50 rounded-xl border border-slate-100">
                  No head-to-head encounters found for the selected filter.
                </div>
              )}
            </div>

            {/* OFFICIAL LINEUPS (When available) */}
            {data?.lineups && (data.lineups.home || data.lineups.away) && (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-[#38003c]">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900">
                        Team Lineups & Formations
                      </h2>
                      <p className="text-xs text-slate-500">Official starting eleven and substitute benches</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Home Lineup */}
                  {data.lineups.home && (
                    <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
                        <div className="flex items-center gap-2">
                          <ClubBadge name={fixture.homeTeam.name} id={fixture.homeTeam.id} badgeUrl={fixture.homeTeam.badgeUrl} size="sm" />
                          <span className="font-bold text-sm text-slate-900">{fixture.homeTeam.name}</span>
                        </div>
                        {data.lineups.home.formation && (
                          <span className="px-2 py-0.5 bg-white text-[#38003c] rounded text-xs font-mono font-bold border border-slate-200">
                            {data.lineups.home.formation}
                          </span>
                        )}
                      </div>

                      {/* Starting XI */}
                      <div className="mb-4">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Starting XI</span>
                        <div className="space-y-1.5">
                          {data.lineups.home.starting.map((p, idx) => (
                            <div key={`h-player-${idx}`} className="flex items-center justify-between text-xs bg-white px-2.5 py-1.5 rounded-lg border border-slate-100">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-slate-400 w-5 text-center text-[11px]">
                                  {p.number ?? idx + 1}
                                </span>
                                <span className="font-semibold text-slate-800">{p.name}</span>
                                {p.captain && (
                                  <span className="px-1 bg-amber-100 text-amber-900 text-[10px] font-bold rounded">
                                    C
                                  </span>
                                )}
                              </div>
                              {p.position && (
                                <span className="text-[10px] font-medium text-slate-400 uppercase">
                                  {p.position}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Subs */}
                      {data.lineups.home.substitutes.length > 0 && (
                        <div>
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Substitutes</span>
                          <div className="space-y-1">
                            {data.lineups.home.substitutes.map((p, idx) => (
                              <div key={`h-sub-${idx}`} className="flex items-center justify-between text-xs px-2 py-1 text-slate-600">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-slate-400 w-5 text-center text-[11px]">
                                    {p.number ?? '-'}
                                  </span>
                                  <span>{p.name}</span>
                                </div>
                                {p.position && (
                                  <span className="text-[10px] text-slate-400 uppercase">{p.position}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Away Lineup */}
                  {data.lineups.away && (
                    <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
                        <div className="flex items-center gap-2">
                          <ClubBadge name={fixture.awayTeam.name} id={fixture.awayTeam.id} badgeUrl={fixture.awayTeam.badgeUrl} size="sm" />
                          <span className="font-bold text-sm text-slate-900">{fixture.awayTeam.name}</span>
                        </div>
                        {data.lineups.away.formation && (
                          <span className="px-2 py-0.5 bg-white text-emerald-800 rounded text-xs font-mono font-bold border border-slate-200">
                            {data.lineups.away.formation}
                          </span>
                        )}
                      </div>

                      {/* Starting XI */}
                      <div className="mb-4">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Starting XI</span>
                        <div className="space-y-1.5">
                          {data.lineups.away.starting.map((p, idx) => (
                            <div key={`a-player-${idx}`} className="flex items-center justify-between text-xs bg-white px-2.5 py-1.5 rounded-lg border border-slate-100">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-slate-400 w-5 text-center text-[11px]">
                                  {p.number ?? idx + 1}
                                </span>
                                <span className="font-semibold text-slate-800">{p.name}</span>
                                {p.captain && (
                                  <span className="px-1 bg-amber-100 text-amber-900 text-[10px] font-bold rounded">
                                    C
                                  </span>
                                )}
                              </div>
                              {p.position && (
                                <span className="text-[10px] font-medium text-slate-400 uppercase">
                                  {p.position}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Subs */}
                      {data.lineups.away.substitutes.length > 0 && (
                        <div>
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Substitutes</span>
                          <div className="space-y-1">
                            {data.lineups.away.substitutes.map((p, idx) => (
                              <div key={`a-sub-${idx}`} className="flex items-center justify-between text-xs px-2 py-1 text-slate-600">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-slate-400 w-5 text-center text-[11px]">
                                    {p.number ?? '-'}
                                  </span>
                                  <span>{p.name}</span>
                                </div>
                                {p.position && (
                                  <span className="text-[10px] text-slate-400 uppercase">{p.position}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Back to Fixtures bottom bar */}
            <div className="pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-[#38003c] text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Fixtures & Tables</span>
              </button>

              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
              >
                Back to Top ↑
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
