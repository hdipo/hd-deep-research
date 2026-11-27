import React, { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Layers,
  ShieldCheck,
  Target,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import {
  NavTab,
  SectionPlan,
  TradeSetup,
  TradeStatus,
  TradingSection,
} from '../types';

interface PerformanceViewProps {
  plans: SectionPlan[];
  darkMode: boolean;
  onNavigateTab: (tab: NavTab) => void;
  onOpenDeepResearch: (symbol: string) => void;
}

type SectionFilter = 'all' | TradingSection;
type LedgerStatusFilter = 'all' | TradeStatus;
type RrViewMode = 'section' | 'setups';

interface EnrichedSetup {
  setup: TradeSetup;
  planId: string;
  monthKey: string;
  monthLabel: string;
  entryPrice: number;
  exitOrLtp: number;
  riskPerShare: number;
  plannedRR: number;
  returnPct: number;
  mtfLeverageNum: number;
  mtfNetRoePct: number | null;
  realizedR: number | null;
  realizedPnlValue: number | null;
  outcome: 'win' | 'loss' | 'breakeven' | 'active' | 'watching';
  isResolved: boolean;
  usedActualExit: boolean;
}

const SECTION_LABELS: Record<TradingSection, string> = {
  swing: 'Swing',
  short_term: 'Short Term',
  long_term: 'Long Term',
  mtf: 'MTF',
};

const STATUS_META: Record<
  TradeStatus,
  { label: string; color: string; textClass: string }
> = {
  target_hit: {
    label: 'Target Hit',
    color: '#059669',
    textClass: 'text-emerald-700 dark:text-emerald-400',
  },
  sl_hit: {
    label: 'SL Hit',
    color: '#DC2626',
    textClass: 'text-red-700 dark:text-red-400',
  },
  entered: {
    label: 'Entered',
    color: '#2563EB',
    textClass: 'text-blue-700 dark:text-blue-400',
  },
  closed: {
    label: 'Closed',
    color: '#475569',
    textClass: 'text-slate-700 dark:text-slate-300',
  },
  watching: {
    label: 'Watching',
    color: '#D97706',
    textClass: 'text-amber-700 dark:text-amber-400',
  },
};

const SECTOR_BAR_COLORS = [
  '#1D4ED8',
  '#2563EB',
  '#0284C7',
  '#0D9488',
  '#059669',
  '#4F46E5',
  '#64748B',
  '#94A3B8',
];

function parsePositiveNumber(val?: string | number): number | null {
  if (typeof val === 'number') {
    return Number.isFinite(val) && val > 0 ? val : null;
  }
  if (typeof val === 'string') {
    const cleaned = val.replace(/[^0-9.-]/g, '');
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }
  return null;
}

function parseRiskRewardRatio(rrText?: string): number | null {
  if (!rrText) return null;
  const match = rrText.match(/(\d+(?:\.\d+)?)\s*:\s*(\d+(?:\.\d+)?)/);
  if (!match) return null;
  const riskPart = Number(match[1]);
  const rewardPart = Number(match[2]);
  if (riskPart > 0 && Number.isFinite(rewardPart)) {
    return Number((rewardPart / riskPart).toFixed(2));
  }
  return null;
}

function formatPrice(value: number, currency: '₹' | '$'): string {
  if (!Number.isFinite(value) || value <= 0) return '—';
  const decimals = value >= 1000 ? 0 : 2;
  return `${currency}${value.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

function formatSignedPct(value: number): string {
  if (!Number.isFinite(value)) return '0.0%';
  const prefix = value > 0 ? '+' : '';
  return `${prefix}${value.toFixed(1)}%`;
}

function formatSignedR(value: number): string {
  if (!Number.isFinite(value)) return '0.0R';
  const prefix = value > 0 ? '+' : '';
  return `${prefix}${value.toFixed(2)}R`;
}

function enrichSetup(
  setup: TradeSetup,
  planId: string,
  monthKey: string,
  monthLabel: string
): EnrichedSetup {
  const actualEntry = parsePositiveNumber(setup.actualEntry);
  const actualExit = parsePositiveNumber(setup.actualExit);
  const actualQty = parsePositiveNumber(setup.actualQty);

  const midEntry =
    setup.entryMin > 0 && setup.entryMax > 0
      ? (setup.entryMin + setup.entryMax) / 2
      : setup.entryMax || setup.entryMin || setup.currentPrice || 1;
  const entryPrice = actualEntry ?? midEntry;

  const isShort = setup.direction === 'Short';
  const riskPerShare =
    setup.stopLoss > 0 ? Math.abs(entryPrice - setup.stopLoss) : 0;

  const parsedRR = parseRiskRewardRatio(setup.riskReward);
  const blendedTarget =
    setup.target1 > 0 && setup.target2 > 0
      ? (setup.target1 + setup.target2) / 2
      : setup.target1 || setup.target2 || 0;
  const computedRR =
    riskPerShare > 0 && blendedTarget > 0
      ? Math.abs(blendedTarget - entryPrice) / riskPerShare
      : 0;
  const plannedRR = Number((parsedRR ?? (computedRR || 0)).toFixed(2));

  const latestLive = setup.liveCheck?.latestPrice || setup.currentPrice || entryPrice;
  const isResolved =
    setup.status === 'target_hit' ||
    setup.status === 'sl_hit' ||
    setup.status === 'closed';

  let exitOrLtp = latestLive;
  let usedActualExit = false;

  if (actualExit !== null && isResolved) {
    exitOrLtp = actualExit;
    usedActualExit = true;
  } else if (setup.status === 'target_hit' && setup.target1 > 0) {
    exitOrLtp = setup.target1;
  } else if (setup.status === 'sl_hit' && setup.stopLoss > 0) {
    exitOrLtp = setup.stopLoss;
  }

  const priceDelta = isShort ? entryPrice - exitOrLtp : exitOrLtp - entryPrice;
  const returnPct = entryPrice > 0 ? (priceDelta / entryPrice) * 100 : 0;

  // MTF net leveraged ROE% on user's own margin (after est. 14% p.a. broker funding interest)
  let mtfLeverageNum = 1;
  let mtfNetRoePct: number | null = null;
  if (setup.section === 'mtf') {
    const levMatch = (setup.mtfLeverage || '').match(/(\d+(?:\.\d+)?)x/i);
    if (levMatch) {
      mtfLeverageNum = Math.max(1, Math.min(5, Number(levMatch[1])));
    } else if (!(setup.mtfLeverage || '').toLowerCase().includes('cash')) {
      mtfLeverageNum = 3;
    }
    if (mtfLeverageNum > 1) {
      const createdMs = Date.parse(setup.createdAt || '');
      const endMs = isResolved ? Date.parse(setup.updatedAt || '') || Date.now() : Date.now();
      const rawDays =
        !Number.isNaN(createdMs) && endMs >= createdMs
          ? Math.max(1, Math.round((endMs - createdMs) / (24 * 60 * 60 * 1000)))
          : setup.expiryDays || 10;
      const holdDays = Math.min(30, Math.max(1, rawDays));
      const interestOnMarginPct = (mtfLeverageNum - 1) * (14 / 365) * holdDays;
      mtfNetRoePct = Number((returnPct * mtfLeverageNum - interestOnMarginPct).toFixed(1));
    }
  }

  const realizedR =
    isResolved && riskPerShare > 0
      ? Number((priceDelta / riskPerShare).toFixed(2))
      : null;

  const realizedPnlValue =
    isResolved && actualQty !== null ? priceDelta * actualQty : null;

  let outcome: EnrichedSetup['outcome'] = 'watching';
  if (setup.status === 'target_hit') {
    outcome = returnPct < 0 ? 'loss' : 'win';
  } else if (setup.status === 'sl_hit') {
    outcome = returnPct > 0 ? 'win' : 'loss';
  } else if (setup.status === 'closed') {
    outcome = returnPct > 0.05 ? 'win' : returnPct < -0.05 ? 'loss' : 'breakeven';
  } else if (setup.status === 'entered') {
    outcome = 'active';
  }

  return {
    setup,
    planId,
    monthKey,
    monthLabel,
    entryPrice,
    exitOrLtp,
    riskPerShare,
    plannedRR,
    returnPct,
    mtfLeverageNum,
    mtfNetRoePct,
    realizedR,
    realizedPnlValue,
    outcome,
    isResolved,
    usedActualExit,
  };
}

export const PerformanceView: React.FC<PerformanceViewProps> = ({
  plans,
  darkMode,
  onNavigateTab,
  onOpenDeepResearch,
}) => {
  const [sectionFilter, setSectionFilter] = useState<SectionFilter>('all');
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [ledgerStatus, setLedgerStatus] = useState<LedgerStatusFilter>('all');
  const [rrViewMode, setRrViewMode] = useState<RrViewMode>('section');

  const allEnriched = useMemo<EnrichedSetup[]>(() => {
    const items: EnrichedSetup[] = [];
    const seenIds = new Set<string>();
    for (const plan of plans) {
      for (const setup of plan.setups || []) {
        if (!setup || seenIds.has(setup.id)) continue;
        seenIds.add(setup.id);
        items.push(
          enrichSetup(
            { ...setup, section: setup.section || plan.section },
            plan.id,
            plan.monthKey,
            plan.monthLabel
          )
        );
      }
    }
    return items.sort(
      (a, b) =>
        new Date(b.setup.updatedAt || b.setup.createdAt || 0).getTime() -
        new Date(a.setup.updatedAt || a.setup.createdAt || 0).getTime()
    );
  }, [plans]);

  const monthOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of allEnriched) {
      if (item.monthKey && !map.has(item.monthKey)) {
        map.set(item.monthKey, item.monthLabel || item.monthKey);
      }
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [allEnriched]);

  const filtered = useMemo(() => {
    return allEnriched.filter((item) => {
      if (sectionFilter !== 'all' && item.setup.section !== sectionFilter) {
        return false;
      }
      if (monthFilter !== 'all' && item.monthKey !== monthFilter) {
        return false;
      }
      return true;
    });
  }, [allEnriched, sectionFilter, monthFilter]);

  const analytics = useMemo(() => {
    const total = filtered.length;
    const resolved = filtered.filter((i) => i.isResolved);
    const wins = resolved.filter((i) => i.outcome === 'win');
    const losses = resolved.filter((i) => i.outcome === 'loss');
    const breakevens = resolved.filter((i) => i.outcome === 'breakeven');
    const entered = filtered.filter((i) => i.setup.status === 'entered');
    const watching = filtered.filter((i) => i.setup.status === 'watching');

    const decidedCount = wins.length + losses.length;
    const winRate =
      decidedCount > 0 ? (wins.length / decidedCount) * 100 : null;

    const plannedRRList = filtered.filter((i) => i.plannedRR > 0);
    const avgPlannedRR =
      plannedRRList.length > 0
        ? plannedRRList.reduce((acc, i) => acc + i.plannedRR, 0) /
          plannedRRList.length
        : 0;

    const realizedRList = resolved.filter(
      (i): i is EnrichedSetup & { realizedR: number } => i.realizedR !== null
    );
    const avgRealizedR =
      realizedRList.length > 0
        ? realizedRList.reduce((acc, i) => acc + i.realizedR, 0) /
          realizedRList.length
        : null;

    const avgRealizedReturnPct =
      resolved.length > 0
        ? resolved.reduce((acc, i) => acc + i.returnPct, 0) / resolved.length
        : null;

    const avgOpenReturnPct =
      entered.length > 0
        ? entered.reduce((acc, i) => acc + i.returnPct, 0) / entered.length
        : null;

    // Profit factor from resolved returns
    const grossWinPct = wins.reduce((acc, i) => acc + Math.max(0, i.returnPct), 0);
    const grossLossPct = losses.reduce(
      (acc, i) => acc + Math.abs(Math.min(0, i.returnPct)),
      0
    );
    const profitFactor =
      grossLossPct > 0
        ? grossWinPct / grossLossPct
        : grossWinPct > 0
          ? Infinity
          : null;

    // Exact separate NSE (₹) and US ($) P&L when user logs quantities
    const rupeePnlItems = resolved.filter(
      (i) => i.realizedPnlValue !== null && i.setup.currency === '₹'
    );
    const totalRupeePnl =
      rupeePnlItems.length > 0
        ? rupeePnlItems.reduce((acc, i) => acc + (i.realizedPnlValue || 0), 0)
        : null;

    const usdPnlItems = resolved.filter(
      (i) => i.realizedPnlValue !== null && i.setup.currency === '$'
    );
    const totalUsdPnl =
      usdPnlItems.length > 0
        ? usdPnlItems.reduce((acc, i) => acc + (i.realizedPnlValue || 0), 0)
        : null;

    const mtfResolvedWithRoe = resolved.filter(
      (i): i is EnrichedSetup & { mtfNetRoePct: number } => i.mtfNetRoePct !== null
    );
    const avgMtfNetRoePct =
      mtfResolvedWithRoe.length > 0
        ? mtfResolvedWithRoe.reduce((acc, i) => acc + i.mtfNetRoePct, 0) /
          mtfResolvedWithRoe.length
        : null;

    // Status donut data
    const statusOrder: TradeStatus[] = [
      'target_hit',
      'sl_hit',
      'entered',
      'watching',
      'closed',
    ];
    const statusData = statusOrder
      .map((status) => {
        const count = filtered.filter((i) => i.setup.status === status).length;
        return {
          status,
          name: STATUS_META[status].label,
          value: count,
          pct: total > 0 ? Math.round((count / total) * 100) : 0,
          color: STATUS_META[status].color,
        };
      })
      .filter((d) => d.value > 0);

    // Section-wise R:R & Win Rate comparison
    const sections: TradingSection[] = ['swing', 'short_term', 'long_term', 'mtf'];
    const sectionStats = sections.map((sec) => {
      const items = filtered.filter((i) => i.setup.section === sec);
      const secResolved = items.filter((i) => i.isResolved);
      const secWins = secResolved.filter((i) => i.outcome === 'win').length;
      const secLosses = secResolved.filter((i) => i.outcome === 'loss').length;
      const secDecided = secWins + secLosses;
      const secWinRate = secDecided > 0 ? (secWins / secDecided) * 100 : 0;
      const secPlannedRR =
        items.length > 0
          ? items.reduce((a, i) => a + i.plannedRR, 0) / items.length
          : 0;
      const secRealRItems = secResolved.filter(
        (i): i is EnrichedSetup & { realizedR: number } => i.realizedR !== null
      );
      const secRealizedR =
        secRealRItems.length > 0
          ? secRealRItems.reduce((a, i) => a + i.realizedR, 0) / secRealRItems.length
          : 0;
      const secAvgRet =
        secResolved.length > 0
          ? secResolved.reduce((a, i) => a + i.returnPct, 0) / secResolved.length
          : 0;
      return {
        section: sec,
        label: SECTION_LABELS[sec],
        total: items.length,
        resolved: secResolved.length,
        decided: secDecided,
        wins: secWins,
        losses: secLosses,
        winRate: Number(secWinRate.toFixed(1)),
        plannedRR: Number(secPlannedRR.toFixed(2)),
        realizedR: Number(secRealizedR.toFixed(2)),
        avgReturnPct: Number(secAvgRet.toFixed(1)),
      };
    });

    // Per-setup R:R vs Return chart (most recent 10 setups with valid R:R)
    const setupRrChartData = filtered.slice(0, 10).map((item) => ({
      symbol: item.setup.symbol,
      section: SECTION_LABELS[item.setup.section],
      plannedRR: item.plannedRR,
      achievedR:
        item.realizedR !== null
          ? item.realizedR
          : item.setup.status === 'entered' && item.riskPerShare > 0
            ? Number(
                (
                  ((item.setup.direction === 'Short'
                    ? item.entryPrice - item.exitOrLtp
                    : item.exitOrLtp - item.entryPrice) /
                    item.riskPerShare)
                ).toFixed(2)
              )
            : 0,
      returnPct: Number(item.returnPct.toFixed(1)),
      statusLabel: STATUS_META[item.setup.status].label,
    }));

    // Sector concentration
    const sectorMap = new Map<
      string,
      { count: number; entered: number; wins: number; losses: number; totalRR: number }
    >();
    for (const item of filtered) {
      const rawSector = (item.setup.sector || 'Other').trim();
      const sectorName = rawSector.length > 0 ? rawSector : 'Other';
      const entry = sectorMap.get(sectorName) || {
        count: 0,
        entered: 0,
        wins: 0,
        losses: 0,
        totalRR: 0,
      };
      entry.count += 1;
      if (item.setup.status === 'entered') entry.entered += 1;
      if (item.outcome === 'win') entry.wins += 1;
      if (item.outcome === 'loss') entry.losses += 1;
      entry.totalRR += item.plannedRR;
      sectorMap.set(sectorName, entry);
    }

    const sortedSectors = Array.from(sectorMap.entries())
      .map(([sector, stats]) => ({
        sector,
        shortSector: sector.length > 18 ? `${sector.slice(0, 16)}…` : sector,
        count: stats.count,
        sharePct: total > 0 ? Number(((stats.count / total) * 100).toFixed(1)) : 0,
        entered: stats.entered,
        wins: stats.wins,
        losses: stats.losses,
        avgRR: stats.count > 0 ? Number((stats.totalRR / stats.count).toFixed(2)) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    const topSectors =
      sortedSectors.length > 8
        ? [
            ...sortedSectors.slice(0, 7),
            {
              sector: 'Other Sectors',
              shortSector: 'Other Sectors',
              count: sortedSectors
                .slice(7)
                .reduce((acc, s) => acc + s.count, 0),
              sharePct: Number(
                sortedSectors
                  .slice(7)
                  .reduce((acc, s) => acc + s.sharePct, 0)
                  .toFixed(1)
              ),
              entered: sortedSectors
                .slice(7)
                .reduce((acc, s) => acc + s.entered, 0),
              wins: sortedSectors.slice(7).reduce((acc, s) => acc + s.wins, 0),
              losses: sortedSectors
                .slice(7)
                .reduce((acc, s) => acc + s.losses, 0),
              avgRR: 0,
            },
          ]
        : sortedSectors;

    const topSector = sortedSectors[0] || null;
    const isOverConcentrated =
      total >= 3 && topSector !== null && topSector.sharePct > 35;

    const bestTrade =
      resolved.length > 0
        ? resolved.reduce((best, cur) =>
            cur.returnPct > best.returnPct ? cur : best
          )
        : null;
    const worstTrade =
      resolved.length > 0
        ? resolved.reduce((worst, cur) =>
            cur.returnPct < worst.returnPct ? cur : worst
          )
        : null;

    return {
      total,
      resolvedCount: resolved.length,
      winsCount: wins.length,
      lossesCount: losses.length,
      breakevenCount: breakevens.length,
      enteredCount: entered.length,
      watchingCount: watching.length,
      winRate,
      avgPlannedRR,
      avgRealizedR,
      avgRealizedReturnPct,
      avgOpenReturnPct,
      profitFactor,
      totalRupeePnl,
      totalUsdPnl,
      avgMtfNetRoePct,
      rupeePnlCount: rupeePnlItems.length,
      statusData,
      sectionStats,
      setupRrChartData,
      sectorData: topSectors,
      uniqueSectorCount: sortedSectors.length,
      topSector,
      isOverConcentrated,
      bestTrade,
      worstTrade,
    };
  }, [filtered]);

  const ledgerRows = useMemo(() => {
    if (ledgerStatus === 'all') return filtered;
    return filtered.filter((item) => item.setup.status === ledgerStatus);
  }, [filtered, ledgerStatus]);

  const chartAxisColor = darkMode ? '#94A3B8' : '#64748B';
  const chartGridColor = darkMode ? '#1E293B' : '#E2E8F0';
  const tooltipStyle: React.CSSProperties = {
    backgroundColor: darkMode ? '#0F172A' : '#FFFFFF',
    border: `1px solid ${darkMode ? '#334155' : '#E2E8F0'}`,
    borderRadius: '10px',
    fontSize: '12px',
    color: darkMode ? '#F1F5F9' : '#0F172A',
    boxShadow: '0 8px 20px -4px rgba(15, 23, 42, 0.16)',
  };

  if (allEnriched.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-[#131A26] border border-slate-200 dark:border-slate-800 rounded-2xl p-8 sm:p-12 text-center">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-6 h-6" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-slate-100 text-balance">
            Performance Analytics Ready
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            Scan stocks in Swing, Short Term, Long Term, or MTF and mark your
            trade status (Entered, Target Hit, or SL Hit). Your win rate,
            risk-reward performance, and sector concentration will update here
            automatically.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => onNavigateTab('swing')}
              className="px-5 py-2.5 min-h-[44px] rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium transition-colors whitespace-nowrap"
            >
              Scan Swing Calls
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('deep_research')}
              className="px-5 py-2.5 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B0F17] text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium transition-colors whitespace-nowrap"
            >
              Open HD Check
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7 space-y-6">
      {/* Header + Filter Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-slate-900 dark:text-slate-100">
            Trade Performance
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            <span>{analytics.total} tracked setups</span>
            <span aria-hidden="true">·</span>
            <span>{analytics.resolvedCount} closed</span>
            <span aria-hidden="true">·</span>
            <span>{analytics.enteredCount} active</span>
            <span aria-hidden="true">·</span>
            <span>{analytics.uniqueSectorCount} sectors</span>
          </div>
        </div>

        {/* Section Filter + Month Selector */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div
            role="tablist"
            aria-label="Filter performance by section"
            className="flex items-center gap-1 p-1 bg-slate-200/70 dark:bg-[#131A26] border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto max-w-full"
          >
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'swing', label: 'Swing' },
                { id: 'short_term', label: 'Short' },
                { id: 'long_term', label: 'Long' },
                { id: 'mtf', label: 'MTF' },
              ] as Array<{ id: SectionFilter; label: string }>
            ).map((opt) => {
              const active = sectionFilter === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setSectionFilter(opt.id)}
                  className={`px-3 py-1.5 min-h-[36px] text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-white dark:bg-blue-600 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          {monthOptions.length > 1 && (
            <select
              aria-label="Filter by month"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="h-[44px] sm:h-[38px] px-3 rounded-xl text-xs font-medium bg-white dark:bg-[#131A26] border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus-visible:outline-2 focus-visible:outline-blue-600"
            >
              <option value="all">All Months</option>
              {monthOptions.map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Top 4-Column KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1: Win Rate */}
        <div className="bg-white dark:bg-[#131A26] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>Win Rate</span>
            <Target className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 font-mono tabular-nums text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
            {analytics.winRate !== null ? `${analytics.winRate.toFixed(0)}%` : '—'}
          </div>
          <div className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            {analytics.resolvedCount > 0 ? (
              <span>
                <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                  {analytics.winsCount}W
                </span>
                {' · '}
                <span className="text-red-700 dark:text-red-400 font-medium">
                  {analytics.lossesCount}L
                </span>
                {analytics.breakevenCount > 0
                  ? ` · ${analytics.breakevenCount}BE`
                  : ''}
              </span>
            ) : (
              <span>Mark Target/SL Hit to score</span>
            )}
          </div>
        </div>

        {/* KPI 2: Risk-Reward Performance */}
        <div className="bg-white dark:bg-[#131A26] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>Avg Risk : Reward</span>
            <ShieldCheck className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 font-mono tabular-nums text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
            {analytics.avgPlannedRR > 0
              ? `1:${analytics.avgPlannedRR.toFixed(1)}`
              : '—'}
          </div>
          <div className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            {analytics.avgRealizedR !== null ? (
              <span>
                Realized avg{' '}
                <span
                  className={
                    analytics.avgRealizedR >= 0
                      ? 'text-emerald-700 dark:text-emerald-400 font-medium'
                      : 'text-red-700 dark:text-red-400 font-medium'
                  }
                >
                  {formatSignedR(analytics.avgRealizedR)}
                </span>
              </span>
            ) : (
              <span>Planned across {analytics.total} calls</span>
            )}
          </div>
        </div>

        {/* KPI 3: Average Return / Profit Factor */}
        <div className="bg-white dark:bg-[#131A26] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>
              {analytics.avgRealizedReturnPct !== null
                ? 'Avg Closed Return'
                : 'Open Return (Live)'}
            </span>
            {(analytics.avgRealizedReturnPct ?? analytics.avgOpenReturnPct ?? 0) >=
            0 ? (
              <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
            )}
          </div>
          <div
            className={`mt-2 font-mono tabular-nums text-2xl sm:text-3xl font-bold ${
              analytics.avgRealizedReturnPct !== null
                ? analytics.avgRealizedReturnPct >= 0
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-red-700 dark:text-red-400'
                : analytics.avgOpenReturnPct !== null
                  ? analytics.avgOpenReturnPct >= 0
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-red-700 dark:text-red-400'
                  : 'text-slate-900 dark:text-slate-100'
            }`}
          >
            {analytics.avgRealizedReturnPct !== null
              ? formatSignedPct(analytics.avgRealizedReturnPct)
              : analytics.avgOpenReturnPct !== null
                ? formatSignedPct(analytics.avgOpenReturnPct)
                : '—'}
          </div>
          <div className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            {analytics.totalRupeePnl !== null || analytics.totalUsdPnl !== null ? (
              <span>
                P&L{' '}
                {analytics.totalRupeePnl !== null && (
                  <span
                    className={
                      analytics.totalRupeePnl >= 0
                        ? 'text-emerald-700 dark:text-emerald-400 font-medium'
                        : 'text-red-700 dark:text-red-400 font-medium'
                    }
                  >
                    {analytics.totalRupeePnl >= 0 ? '+' : '-'}₹
                    {Math.abs(Math.round(analytics.totalRupeePnl)).toLocaleString(
                      'en-IN'
                    )}
                  </span>
                )}
                {analytics.totalRupeePnl !== null && analytics.totalUsdPnl !== null
                  ? ' · '
                  : ''}
                {analytics.totalUsdPnl !== null && (
                  <span
                    className={
                      analytics.totalUsdPnl >= 0
                        ? 'text-emerald-700 dark:text-emerald-400 font-medium'
                        : 'text-red-700 dark:text-red-400 font-medium'
                    }
                  >
                    {analytics.totalUsdPnl >= 0 ? '+' : '-'}$
                    {Math.abs(Math.round(analytics.totalUsdPnl)).toLocaleString(
                      'en-US'
                    )}
                  </span>
                )}
              </span>
            ) : sectionFilter === 'mtf' && analytics.avgMtfNetRoePct !== null ? (
              <span>
                Net MTF ROE{' '}
                <span
                  className={
                    analytics.avgMtfNetRoePct >= 0
                      ? 'text-emerald-700 dark:text-emerald-400 font-medium'
                      : 'text-red-700 dark:text-red-400 font-medium'
                  }
                >
                  {formatSignedPct(analytics.avgMtfNetRoePct)}
                </span>
              </span>
            ) : analytics.profitFactor !== null ? (
              <span>
                Profit factor{' '}
                <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                  {analytics.profitFactor === Infinity
                    ? '∞'
                    : analytics.profitFactor.toFixed(2)}
                </span>
              </span>
            ) : (
              <span>{analytics.enteredCount} active positions</span>
            )}
          </div>
        </div>

        {/* KPI 4: Top Sector Concentration */}
        <div className="bg-white dark:bg-[#131A26] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>Top Sector Share</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 font-mono tabular-nums text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
            {analytics.topSector ? `${analytics.topSector.sharePct.toFixed(0)}%` : '—'}
          </div>
          <div className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 truncate">
            {analytics.topSector ? (
              <span
                className={
                  analytics.isOverConcentrated
                    ? 'text-amber-700 dark:text-amber-400 font-medium'
                    : ''
                }
              >
                {analytics.topSector.sector} ({analytics.topSector.count})
              </span>
            ) : (
              <span>No sector data</span>
            )}
          </div>
        </div>
      </div>

      {/* Concentration Warning (Only when actually >35% in one sector with >=3 setups) */}
      {analytics.isOverConcentrated && analytics.topSector && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-2xl px-4 py-3 flex items-start gap-3 text-xs sm:text-sm text-amber-900 dark:text-amber-200">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <span className="font-semibold">{analytics.topSector.sector}</span>{' '}
            holds{' '}
            <span className="font-mono tabular-nums font-semibold">
              {analytics.topSector.sharePct.toFixed(0)}%
            </span>{' '}
            ({analytics.topSector.count} of {analytics.total}) of your filtered
            setups. Keeping single-sector exposure below 35% reduces correlated
            drawdown risk.
          </p>
        </div>
      )}

      {/* Primary Charts Row: Outcome Donut + Risk-Reward Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
        {/* Chart 1: Outcome & Win Rate Breakdown */}
        <section className="lg:col-span-5 bg-white dark:bg-[#131A26] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="text-base font-semibold font-display text-slate-900 dark:text-slate-100">
                Trade Outcome Mix
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Closed accuracy and active pipeline status
              </p>
            </div>
          </div>

          <div className="relative h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.statusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={62}
                  outerRadius={88}
                  paddingAngle={2}
                  stroke={darkMode ? '#131A26' : '#FFFFFF'}
                  strokeWidth={2}
                >
                  {analytics.statusData.map((entry) => (
                    <Cell key={entry.status} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: unknown, name: unknown) => [
                    `${String(value)} setups`,
                    String(name),
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Metric */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="font-mono tabular-nums text-2xl font-bold text-slate-900 dark:text-slate-100">
                {analytics.winRate !== null
                  ? `${analytics.winRate.toFixed(0)}%`
                  : analytics.total}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {analytics.winRate !== null ? 'Win Rate' : 'Setups'}
              </span>
            </div>
          </div>

          {/* Clean Unboxed Status Breakdown */}
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
            {analytics.statusData.map((row) => (
              <div
                key={row.status}
                className="flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-xs shrink-0"
                    style={{ backgroundColor: row.color }}
                  />
                  <span className="text-slate-700 dark:text-slate-300 truncate">
                    {row.name}
                  </span>
                </div>
                <div className="font-mono tabular-nums text-slate-600 dark:text-slate-400 shrink-0">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {row.value}
                  </span>
                  <span className="ml-2 text-slate-400 dark:text-slate-500">
                    {row.pct}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Chart 2: Risk-Reward Performance (By Section or Per Setup) */}
        <section className="lg:col-span-7 bg-white dark:bg-[#131A26] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
            <div>
              <h2 className="text-base font-semibold font-display text-slate-900 dark:text-slate-100">
                Risk-Reward Performance
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {rrViewMode === 'section'
                  ? 'Planned R:R multiple vs realized R across trading desks'
                  : 'Recent setups: planned R:R target vs achieved/open R'}
              </p>
            </div>
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-[#0B0F17] rounded-lg">
              <button
                type="button"
                onClick={() => setRrViewMode('section')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  rrViewMode === 'section'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                By Section
              </button>
              <button
                type="button"
                onClick={() => setRrViewMode('setups')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  rrViewMode === 'setups'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                By Stock
              </button>
            </div>
          </div>

          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              {rrViewMode === 'section' ? (
                <BarChart
                  data={analytics.sectionStats}
                  margin={{ top: 8, right: 12, left: -14, bottom: 4 }}
                  barGap={6}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke={chartGridColor}
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: chartAxisColor, fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: chartAxisColor, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => `${v}R`}
                  />
                  <ReferenceLine y={0} stroke={chartAxisColor} strokeOpacity={0.5} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value: unknown, name: unknown) => [
                      `${Number(value).toFixed(2)}R`,
                      name === 'plannedRR' ? 'Planned R:R' : 'Realized Avg R',
                    ]}
                  />
                  <Bar
                    dataKey="plannedRR"
                    name="plannedRR"
                    fill="#2563EB"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={28}
                  />
                  <Bar
                    dataKey="realizedR"
                    name="realizedR"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={28}
                  >
                    {analytics.sectionStats.map((entry) => (
                      <Cell
                        key={entry.section}
                        fill={entry.realizedR >= 0 ? '#059669' : '#DC2626'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              ) : (
                <BarChart
                  data={analytics.setupRrChartData}
                  margin={{ top: 8, right: 12, left: -14, bottom: 4 }}
                  barGap={4}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke={chartGridColor}
                  />
                  <XAxis
                    dataKey="symbol"
                    tick={{ fill: chartAxisColor, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                    angle={analytics.setupRrChartData.length > 6 ? -25 : 0}
                    textAnchor={
                      analytics.setupRrChartData.length > 6 ? 'end' : 'middle'
                    }
                    height={analytics.setupRrChartData.length > 6 ? 48 : 28}
                  />
                  <YAxis
                    tick={{ fill: chartAxisColor, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => `${v}R`}
                  />
                  <ReferenceLine y={0} stroke={chartAxisColor} strokeOpacity={0.5} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value: unknown, name: unknown) => [
                      `${Number(value).toFixed(2)}R`,
                      name === 'plannedRR' ? 'Planned R:R' : 'Achieved / Open R',
                    ]}
                  />
                  <Bar
                    dataKey="plannedRR"
                    name="plannedRR"
                    fill="#2563EB"
                    radius={[5, 5, 0, 0]}
                    maxBarSize={22}
                  />
                  <Bar
                    dataKey="achievedR"
                    name="achievedR"
                    radius={[5, 5, 0, 0]}
                    maxBarSize={22}
                  >
                    {analytics.setupRrChartData.map((entry, idx) => (
                      <Cell
                        key={`${entry.symbol}-${idx}`}
                        fill={entry.achievedR >= 0 ? '#059669' : '#DC2626'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-blue-600" />
                Planned R:R
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-600" />
                Positive R
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-red-600" />
                Negative R
              </span>
            </div>
            {analytics.bestTrade && analytics.worstTrade && (
              <div className="font-mono tabular-nums flex items-center gap-3">
                <span>
                  Best:{' '}
                  <strong className="text-emerald-700 dark:text-emerald-400">
                    {analytics.bestTrade.setup.symbol}{' '}
                    {formatSignedPct(analytics.bestTrade.returnPct)}
                  </strong>
                </span>
                <span>
                  Worst:{' '}
                  <strong className="text-red-700 dark:text-red-400">
                    {analytics.worstTrade.setup.symbol}{' '}
                    {formatSignedPct(analytics.worstTrade.returnPct)}
                  </strong>
                </span>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Second Row: Sector Concentration + Desk-by-Desk Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
        {/* Chart 3: Sector Concentration */}
        <section className="lg:col-span-7 bg-white dark:bg-[#131A26] border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="text-base font-semibold font-display text-slate-900 dark:text-slate-100">
                Sector Concentration
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Allocation of setups across sectors to spot crowding
              </p>
            </div>
            <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
              {analytics.uniqueSectorCount} sectors
            </span>
          </div>

          <div
            style={{
              height: Math.max(190, analytics.sectorData.length * 36 + 24),
            }}
            className="w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={analytics.sectorData}
                layout="vertical"
                margin={{ top: 4, right: 24, left: 8, bottom: 4 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke={chartGridColor}
                />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fill: chartAxisColor, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="shortSector"
                  width={122}
                  tick={{ fill: chartAxisColor, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: unknown, _name: unknown, item: { payload?: { sharePct?: number; avgRR?: number; sector?: string } }) => [
                    `${String(value)} setups (${item?.payload?.sharePct ?? 0}%)`,
                    item?.payload?.sector || 'Sector',
                  ]}
                />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={22}>
                  {analytics.sectorData.map((entry, idx) => (
                    <Cell
                      key={entry.sector}
                      fill={
                        entry.sharePct > 35 && analytics.total >= 3
                          ? '#D97706'
                          : SECTOR_BAR_COLORS[idx % SECTOR_BAR_COLORS.length]
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Section-wise Breakdown Table */}
        <section className="lg:col-span-5 bg-white dark:bg-[#131A26] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col">
          <div className="mb-4">
            <h2 className="text-base font-semibold font-display text-slate-900 dark:text-slate-100">
              Section Scorecard
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Compare Swing, Short Term, Long Term, and MTF
            </p>
          </div>

          <div className="overflow-x-auto -mx-1 px-1 flex-1">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                  <th className="py-2 text-left font-medium">Section</th>
                  <th className="py-2 text-right font-medium">Calls</th>
                  <th className="py-2 text-right font-medium">Win %</th>
                  <th className="py-2 text-right font-medium">Plan R:R</th>
                  <th className="py-2 text-right font-medium">Avg Ret</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-mono tabular-nums">
                {analytics.sectionStats.map((row) => (
                  <tr
                    key={row.section}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 font-sans font-medium text-slate-900 dark:text-slate-100">
                      <button
                        type="button"
                        onClick={() => onNavigateTab(row.section)}
                        className="inline-flex items-center gap-1 hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
                      >
                        <span>{row.label}</span>
                        <ArrowUpRight className="w-3 h-3 opacity-60" />
                      </button>
                    </td>
                    <td className="py-3 text-right text-slate-700 dark:text-slate-300">
                      {row.total}
                    </td>
                    <td className="py-3 text-right">
                      {row.decided > 0 ? (
                        <span
                          className={
                            row.winRate >= 50
                              ? 'text-emerald-700 dark:text-emerald-400 font-semibold'
                              : 'text-red-700 dark:text-red-400 font-semibold'
                          }
                        >
                          {row.winRate.toFixed(0)}%
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 text-right text-slate-700 dark:text-slate-300">
                      {row.plannedRR > 0 ? `1:${row.plannedRR.toFixed(1)}` : '—'}
                    </td>
                    <td className="py-3 text-right">
                      {row.resolved > 0 ? (
                        <span
                          className={
                            row.avgReturnPct >= 0
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-red-700 dark:text-red-400'
                          }
                        >
                          {formatSignedPct(row.avgReturnPct)}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            Tip: Enter your actual entry, exit price, and quantity inside any
            setup card to switch metrics from Target/SL estimates to exact
            realized P&L.
          </p>
        </section>
      </div>

      {/* Trade Setup Ledger */}
      <section className="bg-white dark:bg-[#131A26] border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-semibold font-display text-slate-900 dark:text-slate-100">
              Setup Ledger
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Tap any symbol to open full HD Check research
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-[#0B0F17] rounded-lg overflow-x-auto max-w-full">
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'entered', label: 'Entered' },
                { id: 'target_hit', label: 'Target Hit' },
                { id: 'sl_hit', label: 'SL Hit' },
                { id: 'watching', label: 'Watching' },
                { id: 'closed', label: 'Closed' },
              ] as Array<{ id: LedgerStatusFilter; label: string }>
            ).map((st) => {
              const active = ledgerStatus === st.id;
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setLedgerStatus(st.id)}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {st.label}
                </button>
              );
            })}
          </div>
        </div>

        {ledgerRows.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
            No setups match this status filter.
          </div>
        ) : (
          <div className="overflow-x-auto -mx-2 px-2">
            <table className="w-full text-xs border-collapse min-w-[640px]">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                  <th className="py-2.5 text-left font-medium">Stock</th>
                  <th className="py-2.5 text-left font-medium">Desk / Sector</th>
                  <th className="py-2.5 text-left font-medium">Status</th>
                  <th className="py-2.5 text-right font-medium">Entry</th>
                  <th className="py-2.5 text-right font-medium">Exit / LTP</th>
                  <th className="py-2.5 text-right font-medium">Plan R:R</th>
                  <th className="py-2.5 text-right font-medium">Return</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {ledgerRows.map((row) => {
                  const stMeta = STATUS_META[row.setup.status];
                  const showReturn =
                    row.isResolved || row.setup.status === 'entered';
                  return (
                    <tr
                      key={row.setup.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 pr-3">
                        <button
                          type="button"
                          onClick={() => onOpenDeepResearch(row.setup.symbol)}
                          className="text-left group"
                        >
                          <div className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-700 dark:group-hover:text-blue-400 inline-flex items-center gap-1">
                            <span>{row.setup.symbol}</span>
                            <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[160px]">
                            {row.setup.companyName}
                          </div>
                        </button>
                      </td>
                      <td className="py-3 pr-3 text-slate-600 dark:text-slate-400">
                        <div className="text-slate-800 dark:text-slate-200 font-medium">
                          {SECTION_LABELS[row.setup.section]}
                          <span className="text-slate-400 dark:text-slate-500 font-normal">
                            {' · '}
                            {row.setup.direction}
                          </span>
                        </div>
                        <div className="text-[11px] truncate max-w-[140px]">
                          {row.setup.sector || 'Other'}
                        </div>
                      </td>
                      <td className="py-3 pr-3 whitespace-nowrap">
                        <span className={`font-medium ${stMeta.textClass}`}>
                          {stMeta.label}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {formatPrice(row.entryPrice, row.setup.currency)}
                      </td>
                      <td className="py-3 px-2 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {formatPrice(row.exitOrLtp, row.setup.currency)}
                      </td>
                      <td className="py-3 px-2 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {row.plannedRR > 0 ? `1:${row.plannedRR.toFixed(1)}` : '—'}
                      </td>
                      <td className="py-3 pl-2 text-right font-mono tabular-nums whitespace-nowrap">
                        {showReturn ? (
                          <div>
                            <div
                              className={`font-semibold ${
                                row.returnPct >= 0
                                  ? 'text-emerald-700 dark:text-emerald-400'
                                  : 'text-red-700 dark:text-red-400'
                              }`}
                            >
                              {formatSignedPct(row.returnPct)}
                            </div>
                            {row.mtfNetRoePct !== null ? (
                              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                                {row.mtfLeverageNum}x Net{' '}
                                <span
                                  className={
                                    row.mtfNetRoePct >= 0
                                      ? 'text-emerald-700 dark:text-emerald-400'
                                      : 'text-red-700 dark:text-red-400'
                                  }
                                >
                                  {formatSignedPct(row.mtfNetRoePct)}
                                </span>
                              </div>
                            ) : row.realizedR !== null ? (
                              <div className="text-[10px] text-slate-400 dark:text-slate-500">
                                {formatSignedR(row.realizedR)}
                              </div>
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
