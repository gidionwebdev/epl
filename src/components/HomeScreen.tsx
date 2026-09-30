import React from 'react';
import {
  Trophy,
  ArrowRight,
  Calendar,
  Sparkles,
  BarChart3,
  ShieldCheck,
  Flame,
  CheckCircle2,
  Clock
} from 'lucide-react';

interface HomeScreenProps {
  onSelectLeague: (league: 'epl' | 'primeira-liga') => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onSelectLeague }) => {
  return (
    <div className="min-h-[85vh] py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col justify-center">
      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-50 border border-purple-200/80 text-[#38003c] text-xs font-bold uppercase tracking-wider mb-4 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-[#00ff85]" />
          <span>Premier Football Intelligence & Tactical Center</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight">
          Select Your <span className="bg-gradient-to-r from-[#38003c] via-purple-700 to-[#00ff85] bg-clip-text text-transparent">Competition</span>
        </h1>

        <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
          Explore real-time matchweek scores, live standings, scheduled kickoff dates, and comprehensive AI tactical analysis across Europe's elite leagues.
        </p>
      </div>

      {/* League Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto w-full">
        {/* Card 1: English Premier League */}
        <div
          onClick={() => onSelectLeague('epl')}
          className="group relative bg-white rounded-3xl border-2 border-slate-200 hover:border-[#38003c] shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer flex flex-col justify-between"
        >
          {/* Top Banner */}
          <div className="h-32 bg-gradient-to-br from-[#38003c] via-[#4d0b52] to-[#250128] p-6 flex items-center justify-between relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 w-36 h-36 bg-[#00ff85]/10 rounded-full blur-2xl group-hover:scale-150 transition duration-500"></div>

            <div className="flex items-center gap-3 z-10">
              <div className="w-14 h-14 rounded-2xl bg-white p-2 flex items-center justify-center shadow-md">
                <img
                  src="https://media.api-sports.io/football/leagues/39.png"
                  alt="Premier League Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-[#00ff85]">England • Tier 1</span>
                <h2 className="text-2xl font-black text-white leading-tight">Premier League</h2>
              </div>
            </div>

            <span className="text-3xl z-10">🏴󠁧󠁢󠁥󠁮󠁧󠁿</span>
          </div>

          {/* Body */}
          <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
            <div>
              {/* Status Chips */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-[#38003c] border border-purple-200">
                  <Trophy className="w-3.5 h-3.5 text-[#38003c]" />
                  20 Clubs • 38 Matchweeks
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  MW 5 Played • MW 6 Upcoming
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                  35 Seasons (1992–2027)
                </span>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed mb-5">
                Official PulseLive SDP sync with every Premier League fixture, complete standings, head-to-head records, and Gemini-powered tactical intelligence.
              </p>

              {/* Sample Club Badges */}
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold uppercase text-slate-400 block mb-2">Featured Clubs</span>
                <div className="flex items-center gap-3">
                  {[
                    { name: 'Arsenal', id: 42 },
                    { name: 'Man City', id: 50 },
                    { name: 'Liverpool', id: 40 },
                    { name: 'Chelsea', id: 49 },
                    { name: 'Man Utd', id: 33 },
                    { name: 'Tottenham', id: 47 }
                  ].map((club) => (
                    <div
                      key={club.id}
                      className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 p-1 flex items-center justify-center hover:scale-110 transition shadow-2xs"
                      title={club.name}
                    >
                      <img
                        src={`https://media.api-sports.io/football/teams/${club.id}.png`}
                        alt={club.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ))}
                  <span className="text-xs font-bold text-slate-400">+14 more</span>
                </div>
              </div>
            </div>

            {/* Enter Button */}
            <button
              type="button"
              className="w-full py-3.5 px-5 rounded-xl bg-[#38003c] text-white font-bold text-sm flex items-center justify-center gap-2 group-hover:bg-[#4d0b52] group-hover:shadow-md transition cursor-pointer"
            >
              <span>Explore Premier League Hub</span>
              <ArrowRight className="w-4 h-4 text-[#00ff85] group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Card 2: Portuguese Primeira Liga */}
        <div
          onClick={() => onSelectLeague('primeira-liga')}
          className="group relative bg-white rounded-3xl border-2 border-slate-200 hover:border-emerald-600 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer flex flex-col justify-between"
        >
          {/* Top Banner */}
          <div className="h-32 bg-gradient-to-br from-[#0c2340] via-[#093529] to-[#044e37] p-6 flex items-center justify-between relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 w-36 h-36 bg-emerald-400/15 rounded-full blur-2xl group-hover:scale-150 transition duration-500"></div>

            <div className="flex items-center gap-3 z-10">
              <div className="w-14 h-14 rounded-2xl bg-white p-2 flex items-center justify-center shadow-md">
                <img
                  src="https://media.api-sports.io/football/leagues/94.png"
                  alt="Liga Portugal Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-400">Portugal • Tier 1</span>
                <h2 className="text-2xl font-black text-white leading-tight">Primeira Liga</h2>
              </div>
            </div>

            <span className="text-3xl z-10">🇵🇹</span>
          </div>

          {/* Body */}
          <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
            <div>
              {/* Status Chips */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-900 border border-emerald-200">
                  <Trophy className="w-3.5 h-3.5 text-emerald-600" />
                  18 Clubs • 34 Jornadas
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300">
                  <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                  Jornada 7 Played • Jornada 8 Upcoming
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                  <Flame className="w-3 h-3 text-amber-600" />
                  ligaportugal.pt/calendar
                </span>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed mb-5">
                Official Liga Portugal Betclic calendar & live match scores. Includes round-by-round Jornada date tracking, goal events, full standings table, and Gemini AI tactical previews.
              </p>

              {/* Sample Club Badges */}
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold uppercase text-slate-400 block mb-2">Featured Clubs</span>
                <div className="flex items-center gap-3">
                  {[
                    { name: 'FC Porto', id: 212 },
                    { name: 'SL Benfica', id: 211 },
                    { name: 'Sporting CP', id: 228 },
                    { name: 'SC Braga', id: 217 },
                    { name: 'Vitória SC', id: 218 },
                    { name: 'Famalicão', id: 224 }
                  ].map((club) => (
                    <div
                      key={club.id}
                      className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 p-1 flex items-center justify-center hover:scale-110 transition shadow-2xs"
                      title={club.name}
                    >
                      <img
                        src={`https://media.api-sports.io/football/teams/${club.id}.png`}
                        alt={club.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ))}
                  <span className="text-xs font-bold text-slate-400">+12 more</span>
                </div>
              </div>
            </div>

            {/* Enter Button */}
            <button
              type="button"
              className="w-full py-3.5 px-5 rounded-xl bg-[#093529] hover:bg-[#0c4334] text-white font-bold text-sm flex items-center justify-center gap-2 group-hover:shadow-md transition cursor-pointer"
            >
              <span>Explore Primeira Liga Hub</span>
              <ArrowRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="mt-14 max-w-5xl mx-auto w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-[#38003c] flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-slate-900">Smart Date Tracking</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Tracks played vs upcoming matchweek dates with instant jump to latest round.
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-slate-900">Live Tables & Form</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Comprehensive standings, European qualification zones, and 6-match form guides.
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-slate-900">Gemini AI Analysis</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              In-depth football tactical breakdowns, probability models & head-to-head insights.
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-slate-900">Verified Feeds</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Data grounded in official Premier League SDP & BBC Sport Portuguese Primeira Liga.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
