import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Bot,
  RefreshCw,
  Copy,
  Check,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  FileText,
  BarChart3,
  Shield,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { MatchFixture } from '../types';

interface AiMatchAnalysisProps {
  matchId: string;
  fixture: MatchFixture;
}

// Simple and robust Markdown renderer for analytical text
const FormattedMarkdown: React.FC<{ content: string }> = ({ content }) => {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inTable = false;
  let tableHeader: string[] = [];
  let tableRows: string[][] = [];

  const flushTable = (key: number) => {
    if (tableRows.length > 0 || tableHeader.length > 0) {
      elements.push(
        <div key={`table-${key}`} className="my-4 overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
          <table className="w-full text-left text-xs">
            {tableHeader.length > 0 && (
              <thead className="bg-[#38003c] text-white">
                <tr>
                  {tableHeader.map((th, i) => (
                    <th key={i} className="py-2.5 px-3 font-bold border-r border-purple-900/60 last:border-r-0">
                      {th.trim()}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody className="divide-y divide-slate-100 bg-white">
              {tableRows.map((row, rIdx) => (
                <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="py-2 px-3 text-slate-700 font-medium border-r border-slate-100 last:border-r-0">
                      {renderInlineFormatting(cell.trim())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableHeader = [];
      tableRows = [];
      inTable = false;
    }
  };

  const renderInlineFormatting = (text: string) => {
    // Replace **bold**
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-bold text-slate-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    // Table detection
    if (line.startsWith('|') && line.endsWith('|')) {
      const cells = line
        .split('|')
        .slice(1, -1)
        .map((c) => c.trim());

      // Check if separator line (e.g. |---|---|)
      if (cells.every((c) => /^[-:]+$/.test(c))) {
        continue;
      }

      if (!inTable) {
        inTable = true;
        tableHeader = cells;
      } else {
        tableRows.push(cells);
      }
      continue;
    } else if (inTable) {
      flushTable(i);
    }

    if (!line) {
      continue;
    }

    // Heading 1
    if (line.startsWith('# ')) {
      elements.push(
        <h2 key={i} className="text-xl sm:text-2xl font-black text-slate-900 mt-6 mb-3 tracking-tight border-b pb-2 border-slate-200">
          {renderInlineFormatting(line.replace('# ', ''))}
        </h2>
      );
      continue;
    }

    // Heading 2
    if (line.startsWith('## ')) {
      elements.push(
        <h3 key={i} className="text-base sm:text-lg font-bold text-[#38003c] mt-5 mb-2.5 flex items-center gap-2">
          <span className="w-1.5 h-4 bg-[#00ff85] rounded-full inline-block"></span>
          <span>{renderInlineFormatting(line.replace('## ', ''))}</span>
        </h3>
      );
      continue;
    }

    // Heading 3
    if (line.startsWith('### ')) {
      elements.push(
        <h4 key={i} className="text-sm font-bold text-slate-800 mt-4 mb-1.5 uppercase tracking-wide">
          {renderInlineFormatting(line.replace('### ', ''))}
        </h4>
      );
      continue;
    }

    // Numbered list item: e.g. "1. ..."
    if (/^\d+\.\s/.test(line)) {
      const num = line.match(/^(\d+)\.\s/)![1];
      const text = line.replace(/^\d+\.\s/, '');
      elements.push(
        <div key={i} className="flex items-start gap-2.5 my-1.5 pl-1 text-xs text-slate-700 leading-relaxed">
          <span className="px-1.5 py-0.5 rounded bg-purple-50 text-[#38003c] font-mono font-bold text-[11px] shrink-0 border border-purple-200/80">
            {num}
          </span>
          <div className="flex-1">{renderInlineFormatting(text)}</div>
        </div>
      );
      continue;
    }

    // Bullet points: e.g. "- " or "* "
    if (line.startsWith('- ') || line.startsWith('* ')) {
      const text = line.substring(2);
      elements.push(
        <div key={i} className="flex items-start gap-2 my-1 pl-2 text-xs text-slate-700 leading-relaxed">
          <span className="w-1.5 h-1.5 rounded-full bg-[#38003c] mt-1.5 shrink-0"></span>
          <div className="flex-1">{renderInlineFormatting(text)}</div>
        </div>
      );
      continue;
    }

    // Standard paragraph
    elements.push(
      <p key={i} className="text-xs sm:text-sm text-slate-700 leading-relaxed my-2">
        {renderInlineFormatting(line)}
      </p>
    );
  }

  if (inTable) {
    flushTable(lines.length);
  }

  return <div className="space-y-1">{elements}</div>;
};

export const AiMatchAnalysis: React.FC<AiMatchAnalysisProps> = ({ matchId, fixture }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [showPromptModal, setShowPromptModal] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);

  // Analytical pipeline steps for loading state
  const loadingSteps = [
    'Accessing official Premier League match metrics...',
    'Analyzing xG, shots, and set-piece aerial dynamics...',
    'Evaluating tactical matchups, pressing intensity & formations...',
    'Checking squad status, injuries, and travel fatigue...',
    'Synthesizing probability model & scoreline distribution...'
  ];

  // Check cache on initial load
  useEffect(() => {
    let isMounted = true;
    fetch(`/api/match/${matchId}/ai-analysis`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success && data.analysis) {
          setAnalysis(data.analysis);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [matchId]);

  // Loading animation step timer
  useEffect(() => {
    let interval: any;
    if (loading) {
      setCurrentStep(0);
      interval = setInterval(() => {
        setCurrentStep((prev) => (prev < loadingSteps.length - 1 ? prev + 1 : prev));
      }, 1800);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleGenerate = async (forceRefresh = false) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/match/${matchId}/ai-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId,
          homeTeam: fixture.homeTeam.name,
          awayTeam: fixture.awayTeam.name,
          competition: fixture.competition || 'Premier League',
          date: `${fixture.kickoff} ${fixture.kickoffTimezone || 'BST'}`,
          ground: fixture.ground,
          forceRefresh
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP error ${res.status}`);
      }

      const result = await res.json();
      if (result.success && result.analysis) {
        setAnalysis(result.analysis);
      } else {
        throw new Error('Analysis payload was empty.');
      }
    } catch (err: any) {
      console.error('AI match analysis error:', err);
      setError(err.message || 'Failed to generate AI match analysis.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!analysis) return;
    try {
      await navigator.clipboard.writeText(analysis);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.warn('Copy failed:', e);
    }
  };

  // Exact Analyst Prompt for transparency
  const exactPrompt = `You are an expert football analyst. Do a deep, data driven analysis of the match below and give me probability-based predictions.
Match: ${fixture.homeTeam.name} vs ${fixture.awayTeam.name}
Competition: ${fixture.competition || 'Premier League'}
Date: ${fixture.kickoff} ${fixture.kickoffTimezone || 'BST'}${fixture.ground ? `\nVenue: ${fixture.ground}` : ''}
Search for the latest stats and team news before answering. Cite your sources and say clearly when data is missing or uncertain. Do not invent numbers.
1. Core Performance Data
For both teams, cover:
xG and xGA (season and last 5-10 matches)
Shots, shots on target, big chances created and conceded
Possession quality: progressive passes, final-third entries, PPDA (pressing intensity)
Set pieces: goals scored and conceded, main set piece takers and aerial threats
2. Form and Context
Last 5-10 results, weighted by opponent strength
Home record for ${fixture.homeTeam.name} vs away record for ${fixture.awayTeam.name}
Head-to-head history, focusing on recent meetings and current coaches
League position and what is at stake for each side (title, Europe, relegation, nothing to play for)
3. Squad Factors
Injuries, suspensions, and returning players
Likely lineups and formations
Key player roles and form (main striker, playmaker, goalkeeper)
Squad depth and rotation risk
Fatigue: days since last match, travel distance, European or cup fixtures
4. Tactical Matchup
Each team's style of play and how the two styles interact
Manager tendencies in big games or against stronger/weaker opponents
Specific weaknesses to exploit (e.g. slow centre back vs fast winger)
Key one-on-one battles
5. Outside Factors
Referee: average cards and penalties per game
Weather, pitch, and crowd/atmosphere
Motivation, team morale, and any recent managerial change
6. Prediction
Give me:
1. Win / Draw / Loss probabilities (must add up to 100%)
2. Most likely scoreline plus 2 alternative scorelines
3. Goals markets: over/under 2.5, both teams to score
4. Key player to watch for each team
5. Confidence level (low / medium / high) and why
6. Value check: compare your probabilities with current bookmaker odds and flag any value
7. Biggest risks: what could make this prediction wrong (injury news, red card, weather, etc.)
Output Format
Use clear headings for each section
Finish with a short summary table of the prediction
Remember football is low-scoring and high variance: treat everything as probabilities, not certainties`;

  return (
    <div id="ai-match-insights-section" className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#38003c] via-[#2d0030] to-[#1a001c] p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00ff85] to-[#00cc6a] flex items-center justify-center text-[#38003c] shadow-md shrink-0">
            <Sparkles className="w-5 h-5 text-[#38003c]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                AI Match Intelligence & Tactical Analysis
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-[#00ff85]/20 text-[#00ff85] text-[10px] font-mono font-bold border border-[#00ff85]/30">
                Gemini AI
              </span>
            </div>
            <p className="text-xs text-white/70 mt-0.5">
              Deep, data-driven match preview, xG modeling, tactical interactions & probability projections
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setShowPromptModal(!showPromptModal)}
            className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/15 transition cursor-pointer flex items-center gap-1.5"
            title="View Analyst Prompt specification"
          >
            <FileText className="w-3.5 h-3.5 text-[#00ff85]" />
            <span className="hidden sm:inline">Analyst Prompt</span>
          </button>

          {analysis ? (
            <>
              <button
                type="button"
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/15 transition cursor-pointer flex items-center gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#00ff85]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleGenerate(true)}
                disabled={loading}
                className="px-3.5 py-1.5 rounded-lg bg-[#00ff85] hover:bg-[#00e676] text-[#38003c] text-xs font-black transition cursor-pointer shadow-sm flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Regenerate</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => handleGenerate(false)}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-[#00ff85] hover:bg-[#00e676] text-[#38003c] text-xs font-black transition cursor-pointer shadow-md flex items-center gap-2 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate Analysis</span>
            </button>
          )}
        </div>
      </div>

      {/* Expandable Prompt Drawer */}
      {showPromptModal && (
        <div className="bg-slate-900 text-slate-200 p-4 border-b border-slate-800 text-xs animate-in slide-in-from-top duration-200 font-mono">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[#00ff85] font-bold uppercase tracking-wider text-[11px]">
              Exact Prompt Sent to Gemini:
            </span>
            <button
              type="button"
              onClick={() => setShowPromptModal(false)}
              className="text-slate-400 hover:text-white cursor-pointer text-xs"
            >
              Close ✕
            </button>
          </div>
          <pre className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-[11px] overflow-x-auto whitespace-pre-wrap leading-relaxed text-slate-300">
            {exactPrompt}
          </pre>
        </div>
      )}

      {/* Content Area */}
      <div className="p-6">
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-start gap-3 shadow-xs mb-4">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-bold text-sm">Analysis Generation Failed</h3>
              <p className="text-xs text-red-700 mt-0.5">{error}</p>
            </div>
            <button
              type="button"
              onClick={() => handleGenerate(true)}
              className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-900 rounded-lg text-xs font-semibold cursor-pointer transition"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading State with Milestone Progress */}
        {loading && (
          <div className="py-12 px-4 flex flex-col items-center justify-center text-center">
            <div className="relative mb-5">
              <div className="w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center border border-purple-200 shadow-inner">
                <Bot className="w-8 h-8 text-[#38003c] animate-pulse" />
              </div>
              <div className="absolute -top-1 -right-1">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ff85] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[#00ff85]"></span>
                </span>
              </div>
            </div>

            <h3 className="text-base font-bold text-slate-900 mb-1">
              Generating In-Depth Tactical Analysis...
            </h3>
            <p className="text-xs text-slate-500 max-w-md mb-6">
              Gemini is reviewing performance metrics, head-to-head records, squad rotation factors, and probabilistic scoreline models.
            </p>

            {/* Stepper indicators */}
            <div className="space-y-2.5 max-w-sm w-full text-left">
              {loadingSteps.map((step, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-3 p-2.5 rounded-lg border text-xs transition-all duration-300 ${
                    idx === currentStep
                      ? 'bg-purple-50 border-purple-200 text-[#38003c] font-bold shadow-2xs'
                      : idx < currentStep
                      ? 'bg-emerald-50/60 border-emerald-100 text-emerald-800'
                      : 'bg-slate-50 border-slate-100 text-slate-400'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold shrink-0 ${
                    idx === currentStep
                      ? 'bg-[#38003c] text-white animate-spin'
                      : idx < currentStep
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-500'
                  }`}>
                    {idx < currentStep ? '✓' : idx + 1}
                  </span>
                  <span className="truncate">{step}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State (When analysis not yet generated) */}
        {!loading && !analysis && (
          <div className="py-10 px-4 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-[#38003c] shadow-xs mb-3.5 border border-slate-200">
              <Bot className="w-7 h-7 text-[#38003c]" />
            </div>

            <h3 className="text-sm sm:text-base font-bold text-slate-800 mb-1">
              Run AI Analysis for {fixture.homeTeam.name} vs {fixture.awayTeam.name}
            </h3>
            <p className="text-xs text-slate-500 max-w-lg mb-5 leading-relaxed">
              Generate an expert data-driven preview covering Core Performance (xG/xGA, pressing intensity, set pieces), Form & Context, Squad Factors, Tactical Interactions, and Probability Predictions.
            </p>

            <button
              type="button"
              onClick={() => handleGenerate(false)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#38003c] hover:bg-[#4a014f] text-white text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#00ff85]" />
              <span>Generate Match Analysis</span>
            </button>
          </div>
        )}

        {/* Rendered Analysis */}
        {!loading && analysis && (
          <div className="space-y-4">
            {/* Quick analyst disclaimer notice */}
            <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100 flex items-center justify-between text-xs text-purple-900">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#38003c] shrink-0" />
                <span>
                  <strong>Data-Driven Model:</strong> Evaluated using official stats, latest team news, and tactical matchup interactions.
                </span>
              </div>
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                Low-scoring & high variance sport: treated as probabilities
              </span>
            </div>

            {/* Markdown Body */}
            <div className="prose prose-slate max-w-none text-slate-800">
              <FormattedMarkdown content={analysis} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
