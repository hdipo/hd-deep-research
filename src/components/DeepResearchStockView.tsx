import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Check,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Newspaper,
  Plus,
  Search,
  ShieldAlert,
  Trash2,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import {
  ResearchLanguage,
  StockDeepReport,
  SwingMarket,
  TradingSection,
} from '../types';
import { RemoteAppConfig } from '../config/appConfig';
import { resolveBackendApiBase } from '../utils/runtimeApi';
import { ParameterAuditList, SectionParameterBlueprint } from './ParameterChecklist';

interface DeepResearchStockViewProps {
  reports: StockDeepReport[];
  pendingSymbol: string | null;
  remoteConfig: RemoteAppConfig | null;
  onConsumePendingSymbol: () => void;
  onSaveReport: (report: StockDeepReport) => void;
  onDeleteReport: (id: string) => void;
  onAddToSection: (report: StockDeepReport, section: TradingSection) => void;
}

const SECTION_LABELS: Record<TradingSection | 'avoid', string> = {
  swing: 'Swing',
  short_term: 'Short Term',
  long_term: 'Long Term',
  mtf: 'MTF',
  avoid: 'Avoid / Wait',
};

const QUICK_SYMBOLS = ['TATASTEEL', 'TRENT', 'BEL', 'HAL', 'HDFCBANK'];

function formatPrice(val: number, currency: '₹' | '$'): string {
  if (!Number.isFinite(val) || val <= 0) return '—';
  const locale = currency === '₹' ? 'en-IN' : 'en-US';
  return `${currency}${val.toLocaleString(locale, {
    minimumFractionDigits: val < 100 ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}

function pctDiff(from: number, to: number): string {
  if (!from || !to) return '';
  const pct = ((to - from) / from) * 100;
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${pct.toFixed(1)}%`;
}

function ratingColorClass(score: number): string {
  if (score >= 7.5) return 'text-emerald-700 dark:text-emerald-400';
  if (score >= 5.5) return 'text-amber-700 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

function barColorClass(score: number): string {
  if (score >= 7.5) return 'bg-emerald-600 dark:bg-emerald-500';
  if (score >= 5.5) return 'bg-amber-500 dark:bg-amber-400';
  return 'bg-red-600 dark:bg-red-500';
}

function techSignalColor(signal: string): string {
  const s = signal.toLowerCase();
  if (s.includes('buy')) return 'text-emerald-700 dark:text-emerald-400';
  if (s.includes('sell')) return 'text-red-600 dark:text-red-400';
  return 'text-amber-700 dark:text-amber-400';
}

function sentimentColor(sentiment: string): string {
  const s = sentiment.toLowerCase();
  if (s.includes('pos')) return 'text-emerald-700 dark:text-emerald-400';
  if (s.includes('neg')) return 'text-red-600 dark:text-red-400';
  return 'text-slate-500 dark:text-slate-400';
}

function momentumColor(val: string): string {
  const trimmed = val.trim();
  if (trimmed.startsWith('-')) return 'text-red-600 dark:text-red-400';
  if (trimmed.startsWith('+') || parseFloat(trimmed) > 0) {
    return 'text-emerald-700 dark:text-emerald-400';
  }
  return 'text-slate-700 dark:text-slate-300';
}

export const DeepResearchStockView: React.FC<DeepResearchStockViewProps> = ({
  reports,
  pendingSymbol,
  remoteConfig,
  onConsumePendingSymbol,
  onSaveReport,
  onDeleteReport,
  onAddToSection,
}) => {
  const [query, setQuery] = useState('');
  const [market, setMarket] = useState<SwingMarket>('NSE');
  const [language, setLanguage] = useState<ResearchLanguage>('hinglish');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeReportId, setActiveReportId] = useState<string | null>(reports[0]?.id || null);
  const [addedFeedback, setAddedFeedback] = useState<string | null>(null);

  const activeReport =
    reports.find((r) => r.id === activeReportId) || reports[0] || null;

  const runDeepResearch = async (targetQuery: string) => {
    const clean = targetQuery.trim();
    if (!clean || isLoading) return;

    setIsLoading(true);
    setError(null);
    setAddedFeedback(null);

    try {
      const apiBase = resolveBackendApiBase(remoteConfig?.apiBaseUrl);
      const res = await fetch(`${apiBase}/api/stocks/deep-research`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: clean,
          market,
          language,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Deep research failed (${res.status}).`);
      }

      const report = data as StockDeepReport;
      onSaveReport(report);
      setActiveReportId(report.id);
      setQuery(report.symbol);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Stock research fetch nahi ho paya. Thodi der baad retry karein.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!pendingSymbol) return;
    const sym = pendingSymbol.trim();
    onConsumePendingSymbol();
    if (sym) {
      setQuery(sym);
      const existingToday = reports.find(
        (r) =>
          r.symbol.toUpperCase() === sym.toUpperCase() &&
          r.createdAt.slice(0, 10) === new Date().toISOString().slice(0, 10)
      );
      if (existingToday) {
        setActiveReportId(existingToday.id);
      } else {
        void runDeepResearch(sym);
      }
    }
  }, [pendingSymbol]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void runDeepResearch(query);
  };

  const handleAddClick = (report: StockDeepReport, section: TradingSection) => {
    onAddToSection(report, section);
    setAddedFeedback(`Added ${report.symbol} to ${SECTION_LABELS[section]}`);
    setTimeout(() => setAddedFeedback(null), 3000);
  };

  const angleRows = activeReport
    ? [
        { key: 'technical', title: 'Technical Indicators (EMA, RSI, MACD, Volume)', data: activeReport.angles.technical },
        { key: 'priceAction', title: 'Price Action & Chart Structure', data: activeReport.angles.priceAction },
        { key: 'fundamentals', title: 'Fundamental Strength & Valuation', data: activeReport.angles.fundamentals },
        { key: 'news', title: 'Latest News & Catalysts', data: activeReport.angles.news },
        { key: 'safety', title: 'Trap Protection & MTF Liquidity', data: activeReport.angles.safety },
      ]
    : [];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7 space-y-5">
      {/* Compact Header */}
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          HD Pro Research
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Poore app me ek hi search box — kisi bhi stock ka naam daalo aur Pro Research report (Key Indicators, Fair Value, Technicals, Bull/Bear, SWOT, News, Entry/SL/Target &amp; /10 Rating) pao.
        </p>
      </div>

      {/* The ONE Universal Stock Search Box */}
      <section className="rounded-2xl bg-white dark:bg-[#131A26] border border-slate-200 dark:border-slate-800 p-4 space-y-3.5">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Stock naam ya symbol (e.g. TATASTEEL, GPPL, TRENT, BEL, NVDA)"
                className="w-full min-h-[46px] pl-10 pr-4 rounded-xl bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 text-sm sm:text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="inline-flex items-center justify-center gap-2 min-h-[46px] px-5 rounded-xl bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white text-sm font-medium transition-colors whitespace-nowrap shrink-0"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating Pro Report...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Run Pro Research</span>
                </>
              )}
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-[#0B0F17]">
                {(['NSE', 'US'] as SwingMarket[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMarket(m)}
                    className={`min-h-[32px] px-2.5 rounded-lg text-xs font-medium transition-colors ${
                      market === m
                        ? 'bg-white dark:bg-[#1C2536] text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {m === 'NSE' ? 'NSE (₹)' : 'US ($)'}
                  </button>
                ))}
              </div>

              <select
                aria-label="Language"
                value={language}
                onChange={(e) => setLanguage(e.target.value as ResearchLanguage)}
                className="min-h-[36px] px-2.5 rounded-xl bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-600"
              >
                <option value="hinglish">Hinglish (Aasan)</option>
                <option value="hi">Hindi</option>
                <option value="en">English</option>
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
              <span>Quick:</span>
              {QUICK_SYMBOLS.map((sym) => (
                <button
                  key={sym}
                  type="button"
                  disabled={isLoading}
                  onClick={() => {
                    setQuery(sym);
                    void runDeepResearch(sym);
                  }}
                  className="font-mono font-medium text-blue-700 dark:text-blue-400 hover:underline min-h-[30px]"
                >
                  {sym}
                </button>
              ))}
            </div>
          </div>
        </form>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 p-3 text-sm text-red-700 dark:text-red-300"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <SectionParameterBlueprint
          section="deep_research"
          heading="Daily Parameters Checked in HD Pro Research (10 Checks)"
        />
      </section>

      {/* Loading State */}
      {isLoading && (
        <section className="rounded-2xl bg-white dark:bg-[#131A26] border border-slate-200 dark:border-slate-800 p-8 text-center space-y-2">
          <Loader2 className="w-6 h-6 animate-spin text-blue-700 dark:text-blue-400 mx-auto" />
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Building Pro Research Dossier for {query.toUpperCase()}...
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Key Indicators, Fair Value, Technicals, Momentum, Bull/Bear Case, SWOT, Recent News &amp; 10 Daily Parameters check ho rahe hain.
          </p>
        </section>
      )}

      {/* PRO RESEARCH DOSSIER (Matches TISC Pro Research PDF Layout) */}
      {!isLoading && activeReport && (
        <article className="rounded-2xl bg-white dark:bg-[#131A26] border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-6">
          {/* 1. Stock Identity + Spot Price + Fair Value + HD Rating / 10 */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
            <div className="min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  {activeReport.companyName}
                </h2>
                <span className="font-mono text-sm font-semibold text-blue-700 dark:text-blue-400">
                  {activeReport.exchange}:{activeReport.symbol}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                <span>{activeReport.sector}</span>
                <span aria-hidden="true">·</span>
                <span>Data: {activeReport.asOfDate}</span>
                <span aria-hidden="true">·</span>
                <span>Best Fit: {SECTION_LABELS[activeReport.bestFitSection]}</span>
                <span aria-hidden="true">·</span>
                <span>MTF: {activeReport.mtfEligible ? 'Eligible' : 'No'}</span>
              </div>

              <div className="pt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1 font-mono tabular-nums">
                <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {formatPrice(activeReport.currentPrice, activeReport.currency)}
                </span>
                {typeof activeReport.dayChangePct === 'number' && (
                  <span
                    className={`text-sm font-semibold ${
                      activeReport.dayChangePct >= 0
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {activeReport.dayChangePct >= 0 ? '+' : ''}
                    {activeReport.dayChangePct.toFixed(2)}%
                  </span>
                )}
                <span className="text-xs font-sans text-slate-500 dark:text-slate-400">
                  Prev Close {formatPrice(activeReport.prevClose, activeReport.currency)}
                </span>
              </div>
            </div>

            {/* Right Metrics Box: Fair Value + HD Rating */}
            <div className="grid grid-cols-2 gap-2.5 shrink-0">
              <div className="rounded-xl bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 text-right">
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Fair Value
                </div>
                <div className="mt-0.5 text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
                  {activeReport.fairValue && activeReport.fairValue > 0
                    ? formatPrice(activeReport.fairValue, activeReport.currency)
                    : '—'}
                </div>
                {typeof activeReport.fairValueUpsidePct === 'number' && (
                  <div
                    className={`text-[11px] font-mono font-semibold tabular-nums ${
                      activeReport.fairValueUpsidePct >= 0
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {activeReport.fairValueUpsidePct >= 0 ? '+' : ''}
                    {activeReport.fairValueUpsidePct.toFixed(1)}% upside
                  </div>
                )}
              </div>

              <div className="rounded-xl bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 text-right">
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  HD Rating
                </div>
                <div className="mt-0.5 font-mono tabular-nums">
                  <span className={`text-2xl font-bold ${ratingColorClass(activeReport.hdRating)}`}>
                    {activeReport.hdRating.toFixed(1)}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400"> /10</span>
                </div>
                <div className="text-[11px] font-medium text-slate-600 dark:text-slate-400 truncate max-w-[110px]">
                  {activeReport.verdict}
                </div>
              </div>
            </div>
          </div>

          {/* 2. Key Indicators 3-Column Grid (Page 1 of Pro Research PDF) */}
          {activeReport.keyIndicators && activeReport.keyIndicators.length > 0 && (
            <div className="space-y-2.5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Key Indicators
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 text-xs sm:text-sm">
                {activeReport.keyIndicators.map((ind, i) => (
                  <div
                    key={`${ind.label}-${i}`}
                    className="py-2 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3"
                  >
                    <span className="text-slate-500 dark:text-slate-400">{ind.label}</span>
                    <span className="font-mono font-semibold tabular-nums text-slate-900 dark:text-slate-100 text-right">
                      {ind.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Executive Summary (Aasan Bhasha) & Trap Alert */}
          <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800/80">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Executive Summary (Aasan Bhasha)
            </h3>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {activeReport.simpleSummary}
            </p>

            {activeReport.trapAlert && (
              <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 p-3.5 flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm text-amber-900 dark:text-amber-200 leading-relaxed">
                  <strong>Trap &amp; Safety Alert:</strong> {activeReport.trapAlert}
                </div>
              </div>
            )}
          </div>

          {/* 4. Actionable Entry / Stoploss / Target Plan + 1-Tap Save to Section */}
          <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Action Plan (Entry, Stoploss &amp; Targets)
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                Holding {activeReport.holdingWindow} · R:R{' '}
                <strong className="text-slate-900 dark:text-slate-100">{activeReport.riskReward}</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
              <div className="rounded-xl bg-slate-50 dark:bg-[#0B0F17] p-3">
                <div className="text-[11px] text-slate-500 dark:text-slate-400">Entry Zone</div>
                <div className="mt-0.5 text-sm sm:text-base font-bold font-mono tabular-nums text-blue-700 dark:text-blue-400">
                  {activeReport.entryMin === activeReport.entryMax
                    ? formatPrice(activeReport.entryMin, activeReport.currency)
                    : `${formatPrice(activeReport.entryMin, activeReport.currency)} – ${formatPrice(activeReport.entryMax, activeReport.currency)}`}
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 dark:bg-[#0B0F17] p-3">
                <div className="text-[11px] text-slate-500 dark:text-slate-400">Stoploss</div>
                <div className="mt-0.5 text-sm sm:text-base font-bold font-mono tabular-nums text-red-600 dark:text-red-400">
                  {formatPrice(activeReport.stopLoss, activeReport.currency)}
                </div>
                <div className="text-[11px] font-mono tabular-nums text-red-600/80 dark:text-red-400/80">
                  {pctDiff((activeReport.entryMin + activeReport.entryMax) / 2, activeReport.stopLoss)}
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 dark:bg-[#0B0F17] p-3">
                <div className="text-[11px] text-slate-500 dark:text-slate-400">Target 1</div>
                <div className="mt-0.5 text-sm sm:text-base font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                  {formatPrice(activeReport.target1, activeReport.currency)}
                </div>
                <div className="text-[11px] font-mono tabular-nums text-emerald-700/80 dark:text-emerald-400/80">
                  {pctDiff((activeReport.entryMin + activeReport.entryMax) / 2, activeReport.target1)}
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 dark:bg-[#0B0F17] p-3">
                <div className="text-[11px] text-slate-500 dark:text-slate-400">Target 2</div>
                <div className="mt-0.5 text-sm sm:text-base font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                  {formatPrice(activeReport.target2, activeReport.currency)}
                </div>
                <div className="text-[11px] font-mono tabular-nums text-emerald-700/80 dark:text-emerald-400/80">
                  {pctDiff((activeReport.entryMin + activeReport.entryMax) / 2, activeReport.target2)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs sm:text-sm">
              <div>
                <span className="font-semibold text-slate-900 dark:text-slate-100">Kab Entry: </span>
                <span className="text-slate-600 dark:text-slate-300">{activeReport.entryRule}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-900 dark:text-slate-100">Kab Exit: </span>
                <span className="text-slate-600 dark:text-slate-300">{activeReport.exitRule}</span>
              </div>
            </div>

            {/* 1-Tap Save to Trading Calls Section */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-slate-500 dark:text-slate-400 mr-1">
                  Add call to:
                </span>
                {(['swing', 'short_term', 'long_term', 'mtf'] as TradingSection[]).map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => handleAddClick(activeReport, sec)}
                    className="inline-flex items-center gap-1 min-h-[36px] px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{SECTION_LABELS[sec]}</span>
                  </button>
                ))}
              </div>

              {addedFeedback && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  <Check className="w-3.5 h-3.5" />
                  <span>{addedFeedback}</span>
                </span>
              )}
            </div>
          </div>

          {/* 5. Technical Summary & Price Momentum (Page 6 of Pro Research PDF) */}
          {(activeReport.technicalSummary || (activeReport.momentum && activeReport.momentum.length > 0)) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-slate-100 dark:border-slate-800/80">
              {activeReport.technicalSummary && (
                <div className="space-y-2.5">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Technical Summary
                  </h3>
                  <div className="rounded-xl bg-slate-50 dark:bg-[#0B0F17] divide-y divide-slate-200/70 dark:divide-slate-800 px-3.5 text-sm">
                    <div className="py-2.5 flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Overall</span>
                      <span className={`font-semibold ${techSignalColor(activeReport.technicalSummary.overall)}`}>
                        {activeReport.technicalSummary.overall}
                      </span>
                    </div>
                    <div className="py-2.5 flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Moving Averages</span>
                      <span className={`font-semibold ${techSignalColor(activeReport.technicalSummary.movingAverages)}`}>
                        {activeReport.technicalSummary.movingAverages}
                      </span>
                    </div>
                    <div className="py-2.5 flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Technical Indicators</span>
                      <span className={`font-semibold ${techSignalColor(activeReport.technicalSummary.indicators)}`}>
                        {activeReport.technicalSummary.indicators}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {activeReport.momentum && activeReport.momentum.length > 0 && (
                <div className="space-y-2.5">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Price Momentum
                  </h3>
                  <div className="rounded-xl bg-slate-50 dark:bg-[#0B0F17] divide-y divide-slate-200/70 dark:divide-slate-800 px-3.5 text-sm">
                    {activeReport.momentum.map((m, idx) => (
                      <div key={`${m.period}-${idx}`} className="py-2.5 flex items-center justify-between">
                        <span className="text-slate-600 dark:text-slate-400">{m.period}</span>
                        <span className={`font-mono font-semibold tabular-nums ${momentumColor(m.returnPct)}`}>
                          {m.returnPct}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 6. Pro Tips — Positives vs Warnings (Page 2 of Pro Research PDF) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800/80">
            <div className="rounded-xl bg-slate-50 dark:bg-[#0B0F17] p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Pro Tips — Kya Strong Hai</span>
              </div>
              <ul className="space-y-1.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300 list-disc pl-5">
                {activeReport.strengths.map((item, i) => (
                  <li key={i} className="leading-relaxed">
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl bg-slate-50 dark:bg-[#0B0F17] p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-red-600 dark:text-red-400">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Warnings — Kya Weak Hai</span>
              </div>
              <ul className="space-y-1.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300 list-disc pl-5">
                {activeReport.weaknesses.map((item, i) => (
                  <li key={i} className="leading-relaxed">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 7. Bull Case vs Bear Case (Page 7 of Pro Research PDF) */}
          {((activeReport.bullCase && activeReport.bullCase.length > 0) ||
            (activeReport.bearCase && activeReport.bearCase.length > 0)) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800/80">
              {activeReport.bullCase && activeReport.bullCase.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-sm font-bold text-emerald-700 dark:text-emerald-400">
                    <TrendingUp className="w-4 h-4" />
                    <span>Bull Case</span>
                  </div>
                  <ul className="space-y-1.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300 list-disc pl-5">
                    {activeReport.bullCase.map((pt, i) => (
                      <li key={i} className="leading-relaxed">
                        {pt}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {activeReport.bearCase && activeReport.bearCase.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-sm font-bold text-red-600 dark:text-red-400">
                    <TrendingDown className="w-4 h-4" />
                    <span>Bear Case</span>
                  </div>
                  <ul className="space-y-1.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300 list-disc pl-5">
                    {activeReport.bearCase.map((pt, i) => (
                      <li key={i} className="leading-relaxed">
                        {pt}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* 8. SWOT Analysis 4-Quadrant Grid (Page 8 of Pro Research PDF) */}
          {activeReport.swot &&
            (activeReport.swot.opportunities.length > 0 || activeReport.swot.threats.length > 0) && (
              <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  SWOT Analysis
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-xl bg-slate-50 dark:bg-[#0B0F17] p-3.5 space-y-1.5">
                    <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                      Strengths
                    </div>
                    <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-300 list-disc pl-4">
                      {activeReport.swot.strengths.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-xl bg-slate-50 dark:bg-[#0B0F17] p-3.5 space-y-1.5">
                    <div className="text-xs font-bold text-amber-700 dark:text-amber-400">
                      Weaknesses
                    </div>
                    <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-300 list-disc pl-4">
                      {activeReport.swot.weaknesses.map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-xl bg-slate-50 dark:bg-[#0B0F17] p-3.5 space-y-1.5">
                    <div className="text-xs font-bold text-blue-700 dark:text-blue-400">
                      Opportunities
                    </div>
                    <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-300 list-disc pl-4">
                      {activeReport.swot.opportunities.map((o, i) => (
                        <li key={i}>{o}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-xl bg-slate-50 dark:bg-[#0B0F17] p-3.5 space-y-1.5">
                    <div className="text-xs font-bold text-red-600 dark:text-red-400">
                      Threats
                    </div>
                    <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-300 list-disc pl-4">
                      {activeReport.swot.threats.map((t, i) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

          {/* 9. Top Recent News (Last 60 Days — Pages 9–10 of Pro Research PDF) */}
          {activeReport.recentNews && activeReport.recentNews.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-2">
                <Newspaper className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Top Recent News (Last 60 Days)
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activeReport.recentNews.map((item, idx) => (
                  <div
                    key={`${item.title}-${idx}`}
                    className="rounded-xl bg-slate-50 dark:bg-[#0B0F17] border border-slate-200/70 dark:border-slate-800 p-3.5 space-y-1.5"
                  >
                    <div className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                      {item.title}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2 text-[11px] tabular-nums text-slate-500 dark:text-slate-400">
                      <span>{item.date}</span>
                      <span aria-hidden="true">·</span>
                      <span>Importance {item.importance}/10</span>
                      <span aria-hidden="true">·</span>
                      <span className={`font-semibold ${sentimentColor(item.sentiment)}`}>
                        {item.sentiment}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {item.summary}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 10. All 5 Angles Detailed Health Ratings (/10) */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-3.5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              All 5 Angles Health Ratings (/10)
            </h3>
            <div className="space-y-3.5">
              {angleRows.map((row) => (
                <div
                  key={row.key}
                  className="pb-3.5 border-b last:border-b-0 last:pb-0 border-slate-100 dark:border-slate-800/80 space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {row.title}
                    </span>
                    <span className={`text-xs sm:text-sm font-bold font-mono tabular-nums ${ratingColorClass(row.data.score)}`}>
                      {row.data.score.toFixed(1)} / 10
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${barColorClass(row.data.score)}`}
                      style={{ width: `${Math.min(100, Math.max(5, row.data.score * 10))}%` }}
                    />
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {row.data.summary}
                  </p>
                  {row.data.highlights.length > 0 && (
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-1 text-xs text-slate-500 dark:text-slate-400 list-disc pl-4">
                      {row.data.highlights.map((pt, i) => (
                        <li key={i}>{pt}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 11. 10-Point Daily Parameters Audit Table */}
          {activeReport.parameters && activeReport.parameters.length > 0 && (
            <ParameterAuditList
              parameters={activeReport.parameters}
              title={`Daily Parameters Audit — ${activeReport.symbol}`}
              defaultOpen={false}
            />
          )}

          {/* Verified Sources */}
          {activeReport.sources && activeReport.sources.length > 0 && (
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
              <span>Sources:</span>
              {activeReport.sources.slice(0, 6).map((src) => (
                <a
                  key={`${activeReport.id}-${src.index}`}
                  href={src.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-700 dark:text-blue-400 hover:underline"
                >
                  <span className="truncate max-w-[160px]">{src.domain}</span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              ))}
            </div>
          )}
        </article>
      )}

      {/* Recently Researched Stocks */}
      {reports.length > 0 && (
        <section className="space-y-2.5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Recently Researched ({reports.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {reports.map((rep) => {
              const isSelected = activeReport?.id === rep.id;
              return (
                <div
                  key={rep.id}
                  className={`rounded-xl bg-white dark:bg-[#131A26] border px-3.5 py-2.5 flex items-center justify-between gap-2 transition-colors ${
                    isSelected
                      ? 'border-blue-600 dark:border-blue-500'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setActiveReportId(rep.id)}
                    className="flex-1 min-w-0 text-left"
                  >
                    <div className="flex items-baseline gap-2">
                      <span className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100">
                        {rep.symbol}
                      </span>
                      <span className={`font-mono text-xs font-bold tabular-nums ${ratingColorClass(rep.hdRating)}`}>
                        {rep.hdRating.toFixed(1)}/10
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {SECTION_LABELS[rep.bestFitSection]} · {rep.asOfDate}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteReport(rep.id)}
                    aria-label={`Delete ${rep.symbol}`}
                    className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
        Educational &amp; risk-discipline research tool only (not SEBI advisory). Verify live prices on broker chart before placing orders.
      </p>
    </div>
  );
};
