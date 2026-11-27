import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ListChecks,
  XCircle,
} from 'lucide-react';
import { ParameterCheck, ParameterStatus, TradingSection } from '../types';

export interface BlueprintRule {
  category: string;
  name: string;
  target: string;
}

export const SECTION_DAILY_PARAMETERS: Record<TradingSection | 'deep_research', BlueprintRule[]> = {
  swing: [
    { category: 'Technical', name: '20 & 50 EMA Trend', target: 'Price above 20 & 50 EMA (uptrend intact)' },
    { category: 'Technical', name: 'RSI (14) Momentum', target: '50 se 68 zone (strong par overbought >75 nahi)' },
    { category: 'Technical', name: 'MACD & Trend Strength', target: 'Bullish crossover / positive histogram' },
    { category: 'Technical', name: 'Volume & Delivery Surge', target: 'Prev day volume > 20-day avg + healthy delivery' },
    { category: 'Price Action', name: 'Breakout / Pullback Structure', target: 'Clean base breakout ya support retest' },
    { category: 'Fundamental', name: 'Quality Trap Filter', target: 'Profitable company, low promoter pledge' },
    { category: 'News', name: 'Latest News & Earnings Risk', target: 'No negative news ya sudden gap-down risk' },
    { category: 'Safety', name: 'SL & Risk:Reward Math', target: '3%–6.5% tight SL aur minimum 1:2 R:R' },
  ],
  short_term: [
    { category: 'Safety', name: 'Nifty 500 Universe & Liquidity', target: 'Sirf official Nifty 500 stock + strong daily turnover' },
    { category: 'Fundamental', name: 'Quarterly Sales & Profit', target: 'Strong YoY / QoQ revenue aur net profit growth' },
    { category: 'Technical', name: '50 & 200 EMA Alignment', target: 'Price 50 EMA aur 200 EMA ke upar clean uptrend me' },
    { category: 'Technical', name: 'Relative Strength vs Nifty 50', target: 'Nifty 50 aur sector se stronger outperformance' },
    { category: 'Price Action', name: 'Weekly Base Breakout', target: 'Multi-week consolidation breakout ya clean support' },
    { category: 'Technical', name: 'RSI (14) & Volume Accumulation', target: 'RSI 50–70 zone + institutional buying volume' },
    { category: 'Fundamental', name: 'ROE / ROCE & Debt Check', target: 'ROE/ROCE >= 15%, manageable debt' },
    { category: 'News', name: 'News, Catalyst & Risk:Reward', target: 'Clean news/catalyst, 6%–9.5% SL, >= 1:2 R:R' },
  ],
  long_term: [
    { category: 'Fundamental', name: '3–5 Yr Revenue & Profit Growth', target: 'Consistent compounding growth track record' },
    { category: 'Fundamental', name: 'ROE & ROCE Quality', target: 'ROE / ROCE >= 15% sustainable efficiency' },
    { category: 'Fundamental', name: 'Debt-to-Equity & Cash Flow', target: 'Low debt + positive operating cash flow' },
    { category: 'Fundamental', name: 'Valuation (P/E vs Sector)', target: 'Reasonable valuation — bubble price nahi' },
    { category: 'Fundamental', name: 'Promoter & FII / DII Holding', target: 'Stable promoter stake, zero high pledge' },
    { category: 'Price Action', name: 'Accumulation Zone (50/200 DMA)', target: 'Strong structural support par buying zone' },
    { category: 'News', name: 'Business Moat & Governance', target: 'Clean management + long-term demand visibility' },
    { category: 'Safety', name: 'Thesis Review / Exit Level', target: 'Clear fundamental + chart invalidation level' },
  ],
  mtf: [
    { category: 'Safety', name: 'Group-1 MTF Liquidity', target: 'High daily turnover, broker MTF 3x–4x eligible' },
    { category: 'Price Action', name: 'Immediate Momentum Breakout', target: 'Fast 3–14 day move (sideways trap avoid)' },
    { category: 'Technical', name: '20 EMA Short-Term Control', target: 'Cleanly riding above rising 20 EMA' },
    { category: 'Technical', name: 'RSI (14) Sweet Spot', target: '52 se 70 momentum — overextended >75 avoid' },
    { category: 'Technical', name: 'Previous Day Volume Spike', target: 'Strong breakout volume confirmation' },
    { category: 'Safety', name: 'Ultra-Tight Stop Loss', target: '2.5%–5% hard SL (leveraged loss control)' },
    { category: 'News', name: 'Zero Event / Earnings Gap Trap', target: 'No sudden binary news risk in next 7–10 days' },
    { category: 'Safety', name: 'Upside vs MTF Interest Cost', target: 'Target easily covers daily MTF interest cost' },
  ],
  deep_research: [
    { category: 'Technical', name: 'Prev Close vs 20 / 50 / 200 EMA', target: 'Trend alignment check' },
    { category: 'Technical', name: 'RSI (14) & Momentum', target: 'Strength vs overbought trap check' },
    { category: 'Technical', name: 'MACD & Volume / Delivery', target: 'Buying conviction check' },
    { category: 'Price Action', name: 'Support & Resistance Structure', target: 'Exact breakout / pullback zones' },
    { category: 'Fundamental', name: 'Quarterly Revenue & Profit', target: 'Latest YoY / QoQ earnings growth' },
    { category: 'Fundamental', name: 'ROE & ROCE Efficiency', target: 'Capital return quality' },
    { category: 'Fundamental', name: 'Debt-to-Equity & P/E Valuation', target: 'Balance sheet & price comfort' },
    { category: 'Fundamental', name: 'Promoter / FII-DII Holding', target: 'Smart money & pledge check' },
    { category: 'News', name: 'Latest News & Earnings Events', target: 'Catalysts & red flags check' },
    { category: 'Safety', name: 'Trap Risk & MTF Eligibility', target: 'Liquidity, circuit & operator trap check' },
  ],
};

function renderStatus(status: ParameterStatus) {
  if (status === 'pass') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
        <span>Pass</span>
      </span>
    );
  }
  if (status === 'fail') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400 whitespace-nowrap">
        <XCircle className="w-3.5 h-3.5 shrink-0" />
        <span>Fail</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-400 whitespace-nowrap">
      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
      <span>Caution</span>
    </span>
  );
}

interface ParameterAuditListProps {
  parameters: ParameterCheck[];
  title?: string;
  defaultOpen?: boolean;
}

export const ParameterAuditList: React.FC<ParameterAuditListProps> = ({
  parameters,
  title = 'Daily Parameters Checked',
  defaultOpen = true,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (!parameters || parameters.length === 0) return null;

  const passCount = parameters.filter((p) => p.status === 'pass').length;
  const cautionCount = parameters.filter((p) => p.status === 'caution').length;
  const failCount = parameters.filter((p) => p.status === 'fail').length;

  return (
    <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex flex-wrap items-center justify-between gap-2 text-left min-h-[36px]"
      >
        <div className="flex items-center gap-2">
          <ListChecks className="w-4 h-4 text-blue-700 dark:text-blue-400 shrink-0" />
          <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100">
            {title} ({parameters.length})
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono tabular-nums">
          <span className="text-emerald-700 dark:text-emerald-400">{passCount} Pass</span>
          <span aria-hidden="true" className="text-slate-400">·</span>
          <span className="text-amber-700 dark:text-amber-400">{cautionCount} Caution</span>
          <span aria-hidden="true" className="text-slate-400">·</span>
          <span className="text-red-600 dark:text-red-400">{failCount} Fail</span>
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-slate-400 ml-1" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400 ml-1" />
          )}
        </div>
      </button>

      {isOpen && (
        <div className="divide-y divide-slate-100 dark:divide-slate-800/80 rounded-xl bg-slate-50 dark:bg-[#0B0F17] border border-slate-200/80 dark:border-slate-800 px-3.5">
          {parameters.map((param, idx) => (
            <div
              key={`${param.name}-${idx}`}
              className="py-3 grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-start"
            >
              <div className="sm:col-span-4 min-w-0">
                <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  {param.name}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  {param.category}
                </div>
              </div>

              <div className="sm:col-span-3 text-xs font-mono font-medium text-slate-800 dark:text-slate-200 tabular-nums">
                {param.value}
              </div>

              <div className="sm:col-span-2 flex sm:justify-start">
                {renderStatus(param.status)}
              </div>

              <div className="sm:col-span-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {param.note}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

interface SectionParameterBlueprintProps {
  section: TradingSection | 'deep_research';
  heading?: string;
}

export const SectionParameterBlueprint: React.FC<SectionParameterBlueprintProps> = ({
  section,
  heading,
}) => {
  const [expanded, setExpanded] = useState(false);
  const rules = SECTION_DAILY_PARAMETERS[section];

  return (
    <div className="pt-3.5 border-t border-slate-200 dark:border-slate-800">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between gap-3 text-left min-h-[40px]"
      >
        <div className="flex items-center gap-2 min-w-0">
          <ListChecks className="w-4 h-4 text-blue-700 dark:text-blue-400 shrink-0" />
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
            {heading || `Daily Parameters Checked (${rules.length} Checks — Prev Day Data)`}
          </span>
        </div>
        <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 dark:text-blue-400 shrink-0 whitespace-nowrap">
          <span>{expanded ? 'Hide List' : 'View All Parameters'}</span>
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </span>
      </button>

      {expanded && (
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 pt-3 border-t border-slate-100 dark:border-slate-800/80">
          {rules.map((r, i) => (
            <div key={r.name} className="text-xs leading-relaxed">
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono text-[11px] text-slate-400 tabular-nums">
                  {String(i + 1).padStart(2, '0')}.
                </span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {r.name}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  · {r.category}
                </span>
              </div>
              <div className="pl-5 text-slate-600 dark:text-slate-400">
                {r.target}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
