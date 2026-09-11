import React, { useEffect, useState } from 'react';
import { X, Calendar, MapPin, Shield, RefreshCw, Trophy, Users, Award } from 'lucide-react';
import { MatchFixture, MatchPreview } from '../types';
import { fetchMatchPreview } from '../services/scraper';
import { ClubBadge } from './ClubBadge';

interface MatchDetailsModalProps {
  match: MatchFixture | null;
  onClose: () => void;
}

export const MatchDetailsModal: React.FC<MatchDetailsModalProps> = ({ match, onClose }) => {
  const [previewData, setPreviewData] = useState<MatchPreview | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!match) {
      setPreviewData(null);
      return;
    }

    let isMounted = true;
    setLoading(true);
    fetchMatchPreview(match.matchId)
      .then((data) => {
        if (isMounted) {
          setPreviewData(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      isMounted = false;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [match, onClose]);

  if (!match) return null;

  const hasScore = typeof match.homeTeam.score === 'number' && typeof match.awayTeam.score === 'number';
  const isFinished = match.period === 'FullTime' || hasScore;
  const isHomeWinner = hasScore && (match.homeTeam.score as number) > (match.awayTeam.score as number);
  const isAwayWinner = hasScore && (match.awayTeam.score as number) > (match.homeTeam.score as number);

  const homeGoals = previewData?.homeGoals || [];
  const awayGoals = previewData?.awayGoals || [];
  const homeCards = previewData?.homeCards || [];
  const awayCards = previewData?.awayCards || [];
  const hasEvents = homeGoals.length > 0 || awayGoals.length > 0 || homeCards.length > 0 || awayCards.length > 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150">
      <div
        id="match-details-modal"
        className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-[#38003c] text-white p-5 flex items-center justify-between border-b border-purple-900/80">
          <div className="flex items-center gap-2.5">
            <Trophy className="w-5 h-5 text-[#00ff85]" />
            <h2 className="text-lg font-bold text-white tracking-tight">
              {isFinished ? 'Match Result & Timeline' : 'Fixture Details & Head-to-Head'}
            </h2>
          </div>
          <button
            id="close-modal-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Match Clash / Score Banner */}
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 flex items-center justify-between">
            {/* Home */}
            <div className="flex items-center gap-3 flex-1">
              <ClubBadge
                name={match.homeTeam.name}
                id={match.homeTeam.id}
                badgeUrl={match.homeTeam.badgeUrl}
                size="lg"
              />
              <div>
                <span className="text-xs text-slate-400 font-semibold uppercase">Home</span>
                <p className={`text-base font-bold leading-tight ${isHomeWinner ? 'text-[#38003c]' : 'text-slate-900'}`}>
                  {match.homeTeam.name}
                </p>
                <span className="text-xs text-slate-500 font-medium">{match.homeTeam.shortName}</span>
              </div>
            </div>

            {/* Score or VS */}
            <div className="px-4 text-center">
              {hasScore ? (
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-2xs">
                    <span className={`text-2xl font-black ${isHomeWinner ? 'text-[#38003c]' : 'text-slate-800'}`}>
                      {match.homeTeam.score}
                    </span>
                    <span className="text-slate-300 font-bold text-lg">-</span>
                    <span className={`text-2xl font-black ${isAwayWinner ? 'text-[#38003c]' : 'text-slate-800'}`}>
                      {match.awayTeam.score}
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#38003c] text-[#00ff85] font-black text-[10px] uppercase tracking-wider mt-1.5 shadow-2xs">
                    Full Time
                  </span>
                  {typeof match.homeTeam.halfTimeScore === 'number' && typeof match.awayTeam.halfTimeScore === 'number' && (
                    <span className="text-[11px] text-slate-400 font-medium mt-1">
                      HT {match.homeTeam.halfTimeScore} - {match.awayTeam.halfTimeScore}
                    </span>
                  )}
                </div>
              ) : (
                <span className="px-3 py-1 rounded-full bg-[#38003c] text-[#00ff85] font-black text-xs uppercase shadow-xs">
                  VS
                </span>
              )}
            </div>

            {/* Away */}
            <div className="flex items-center gap-3 flex-1 justify-end text-right">
              <div>
                <span className="text-xs text-slate-400 font-semibold uppercase">Away</span>
                <p className={`text-base font-bold leading-tight ${isAwayWinner ? 'text-[#38003c]' : 'text-slate-900'}`}>
                  {match.awayTeam.name}
                </p>
                <span className="text-xs text-slate-500 font-medium">{match.awayTeam.shortName}</span>
              </div>
              <ClubBadge
                name={match.awayTeam.name}
                id={match.awayTeam.id}
                badgeUrl={match.awayTeam.badgeUrl}
                size="lg"
              />
            </div>
          </div>

          {/* Goal Scorers & Match Events (If played and loaded) */}
          {isFinished && hasEvents && (
            <div className="bg-purple-50/50 rounded-xl p-4 border border-purple-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-purple-900 mb-3 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-[#38003c]" />
                Goalscorers & Disciplinary Actions
              </h3>
              <div className="grid grid-cols-2 gap-4 text-xs divide-x divide-purple-100">
                {/* Home Events */}
                <div className="space-y-1.5">
                  <span className="font-semibold text-slate-600 text-[11px] block">{match.homeTeam.name}</span>
                  {homeGoals.length > 0 ? (
                    homeGoals.map((g, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-slate-800">
                        <span className="text-emerald-600 font-black">⚽</span>
                        <span className="font-bold">{g.playerName}</span>
                        <span className="text-slate-400 text-[11px] font-mono">{g.time}&apos;</span>
                      </div>
                    ))
                  ) : (
                    <span className="text-slate-400 text-xs italic">No goals scored</span>
                  )}

                  {homeCards.map((c, idx) => (
                    <div key={`card-${idx}`} className="flex items-center gap-1.5 text-slate-600 pt-1 text-[11px]">
                      <span className={c.type === 'Red' ? 'text-red-600' : 'text-amber-500'}>
                        {c.type === 'Red' ? '🟥' : '🟨'}
                      </span>
                      <span>{c.playerName}</span>
                      <span className="text-slate-400 font-mono">{c.time}&apos;</span>
                    </div>
                  ))}
                </div>

                {/* Away Events */}
                <div className="pl-4 space-y-1.5">
                  <span className="font-semibold text-slate-600 text-[11px] block">{match.awayTeam.name}</span>
                  {awayGoals.length > 0 ? (
                    awayGoals.map((g, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-slate-800">
                        <span className="text-emerald-600 font-black">⚽</span>
                        <span className="font-bold">{g.playerName}</span>
                        <span className="text-slate-400 text-[11px] font-mono">{g.time}&apos;</span>
                      </div>
                    ))
                  ) : (
                    <span className="text-slate-400 text-xs italic">No goals scored</span>
                  )}

                  {awayCards.map((c, idx) => (
                    <div key={`awaycard-${idx}`} className="flex items-center gap-1.5 text-slate-600 pt-1 text-[11px]">
                      <span className={c.type === 'Red' ? 'text-red-600' : 'text-amber-500'}>
                        {c.type === 'Red' ? '🟥' : '🟨'}
                      </span>
                      <span>{c.playerName}</span>
                      <span className="text-slate-400 font-mono">{c.time}&apos;</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Fixture Info Chips */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-purple-50/50 rounded-lg border border-purple-100 flex items-start gap-2.5">
              <Calendar className="w-4 h-4 text-[#38003c] shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-500 block">Kick-off Date & Time</span>
                <span className="font-bold text-slate-900 text-xs">{match.kickoff} ({match.kickoffTimezone})</span>
              </div>
            </div>

            <div className="p-3 bg-purple-50/50 rounded-lg border border-purple-100 flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-[#38003c] shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-500 block">Stadium / Venue</span>
                <span className="font-bold text-slate-900 text-xs truncate max-w-[150px]">{match.ground}</span>
              </div>
            </div>

            <div className="p-3 bg-purple-50/50 rounded-lg border border-purple-100 flex items-start gap-2.5">
              <Users className="w-4 h-4 text-[#38003c] shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-500 block">Official Attendance</span>
                <span className="font-bold text-slate-900 text-xs">
                  {match.attendance ? `${match.attendance.toLocaleString()} Fans` : 'Official Record'}
                </span>
              </div>
            </div>
          </div>

          {/* Head to Head Historical Results */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-600" />
                Previous Meetings & Head-to-Head Archive
              </h3>
              <span className="text-xs text-slate-400">Premier League H2H record</span>
            </div>

            {loading ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center justify-center gap-2 text-slate-500 text-xs">
                <RefreshCw className="w-5 h-5 animate-spin text-[#38003c]" />
                <span>Loading match details and historical encounters...</span>
              </div>
            ) : previewData?.previousMeetings && previewData.previousMeetings.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {previewData.previousMeetings.map((meeting, i) => {
                  const homeWon = meeting.homeTeam.score > meeting.awayTeam.score;
                  const awayWon = meeting.awayTeam.score > meeting.homeTeam.score;
                  return (
                    <div
                      key={i}
                      className="p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-100 flex items-center justify-between text-xs transition"
                    >
                      <div className="flex items-center gap-2 text-slate-500 font-mono text-[11px] min-w-[90px]">
                        <span>{meeting.kickoff.split(' ')[0]}</span>
                      </div>

                      <div className="flex-1 flex items-center justify-center gap-3">
                        <span className={`text-right flex-1 truncate ${homeWon ? 'font-bold text-slate-900' : 'text-slate-600'}`}>
                          {meeting.homeTeam.team.name}
                        </span>

                        <span className="px-2 py-0.5 rounded bg-white border border-slate-200 font-black text-slate-900 font-mono text-xs shadow-2xs">
                          {meeting.homeTeam.score} - {meeting.awayTeam.score}
                        </span>

                        <span className={`text-left flex-1 truncate ${awayWon ? 'font-bold text-slate-900' : 'text-slate-600'}`}>
                          {meeting.awayTeam.team.name}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-400 truncate max-w-[140px] text-right pl-2">
                        {meeting.ground || 'Premier League'}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 text-center bg-slate-50 rounded-xl border border-slate-100 text-slate-500 text-xs">
                No previous head-to-head records found for this matchup in the current cycle.
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Match ID: <strong className="font-mono text-slate-700">{match.matchId}</strong></span>
          <button
            id="close-modal-footer-btn"
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#38003c] hover:bg-[#4a014f] text-white font-semibold rounded-lg shadow-xs transition cursor-pointer"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};
