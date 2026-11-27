import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Calculator,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ExternalLink,
  Loader2,
  Lock,
  LogIn,
  LogOut,
  NotebookPen,
  Plus,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  X,
} from 'lucide-react';
import {
  LiveExitSignal,
  LiveRecheckUpdate,
  ResearchLanguage,
  SectionPlan,
  SwingMarket,
  TradeSetup,
  TradeStatus,
  TradingSection,
  UniverseMode,
} from '../types';
import { RemoteAppConfig } from '../config/appConfig';
import { resolveBackendApiBase } from '../utils/runtimeApi';
import { ParameterAuditList, SectionParameterBlueprint } from './ParameterChecklist';

interface TradingDeskViewProps {
  section: TradingSection;
  plans: SectionPlan[];
  remoteConfig: RemoteAppConfig | null;
  onSavePlan: (plan: SectionPlan) => void;
  onUpdateSetup: (planId: string, setup: TradeSetup) => void;
  onDeleteSetup: (planId: string, setupId: string) => void;
  onOpenDeepResearch: (symbol: string) => void;
}

interface SectionConfig {
  id: TradingSection;
  title: string;
  callHeading: string;
  horizonLabel: string;
  defaultHolding: string;
  defaultSetupType: string;
  defaultCapital: number;
  defaultRiskPct: number;
  expiryDays: number;
}

const SECTION_CONFIGS: Record<TradingSection, SectionConfig> = {
  swing: {
    id: 'swing',
    title: 'Swing Calls',
    callHeading: 'Swing trading call',
    horizonLabel: '≤ 1 Month',
    defaultHolding: '≤ 1 Month',
    defaultSetupType: 'Swing Breakout / Pullback',
    defaultCapital: 100000,
    defaultRiskPct: 1.5,
    expiryDays: 21,
  },
  short_term: {
    id: 'short_term',
    title: 'Short Term Calls',
    callHeading: 'Short-term positional call',
    horizonLabel: '< 3 Months',
    defaultHolding: '< 3 Months',
    defaultSetupType: 'Positional Momentum',
    defaultCapital: 150000,
    defaultRiskPct: 2,
    expiryDays: 60,
  },
  long_term: {
    id: 'long_term',
    title: 'Long Term Calls',
    callHeading: 'Long-term investment call',
    horizonLabel: '> 1 Year',
    defaultHolding: '> 1 Year',
    defaultSetupType: 'Long-Term Compounder',
    defaultCapital: 250000,
    defaultRiskPct: 2,
    expiryDays: 420,
  },
  mtf: {
    id: 'mtf',
    title: 'MTF Calls',
    callHeading: 'MTF margin trading call',
    horizonLabel: '≤ 14 Days · MTF',
    defaultHolding: '≤ 14 Days',
    defaultSetupType: 'MTF High-Liquidity Momentum',
    defaultCapital: 50000,
    defaultRiskPct: 1.5,
    expiryDays: 10,
  },
};

const STATUS_OPTIONS: Array<{ id: TradeStatus; label: string }> = [
  { id: 'watching', label: 'Open' },
  { id: 'entered', label: 'Entered' },
  { id: 'target_hit', label: 'Target Hit' },
  { id: 'sl_hit', label: 'Stoploss' },
  { id: 'closed', label: 'Closed' },
];

const SIGNAL_META: Record<
  LiveExitSignal,
  { shortLabel: string; label: string; boxClass: string; textClass: string }
> = {
  EXIT_NOW: {
    shortLabel: 'EXIT NOW',
    label: 'EXIT NOW — TRAP / SL ALERT',
    boxClass: 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/70',
    textClass: 'text-red-700 dark:text-red-300',
  },
  BOOK_PARTIAL: {
    shortLabel: 'BOOK PARTIAL',
    label: 'BOOK PARTIAL PROFIT',
    boxClass: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/60',
    textClass: 'text-emerald-800 dark:text-emerald-300',
  },
  TRAIL_SL: {
    shortLabel: 'TRAIL SL',
    label: 'TRAIL STOP LOSS UP',
    boxClass: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/60',
    textClass: 'text-blue-800 dark:text-blue-300',
  },
  HOLD: {
    shortLabel: 'HOLD',
    label: 'SAFE TO HOLD WITH SL',
    boxClass: 'bg-slate-50 dark:bg-[#0B0F17] border-slate-200 dark:border-slate-800',
    textClass: 'text-slate-700 dark:text-slate-300',
  },
  WAIT_ENTRY: {
    shortLabel: 'WAIT ENTRY',
    label: 'WAIT FOR CLEAN ENTRY',
    boxClass: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60',
    textClass: 'text-amber-800 dark:text-amber-300',
  },
};

function getCurrentMonthInfo() {
  const now = new Date();
  const year = now.getFullYear();
  const monthIdx = now.getMonth() + 1;
  const monthKey = `${year}-${String(monthIdx).padStart(2, '0')}`;
  const monthLabel = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const todayIso = now.toISOString().slice(0, 10);
  const todayShort = now
    .toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
    .toUpperCase();
  return { monthKey, monthLabel, todayIso, todayShort };
}

function formatNum(val: number, currency: '₹' | '$'): string {
  if (!Number.isFinite(val) || val <= 0) return '—';
  const locale = currency === '₹' ? 'en-IN' : 'en-US';
  return val.toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatPrice(val: number, currency: '₹' | '$'): string {
  if (!Number.isFinite(val) || val <= 0) return '—';
  return `${currency}${formatNum(val, currency)}`;
}

function pctDiff(from: number, to: number): string {
  if (!from || !to) return '';
  const pct = ((to - from) / from) * 100;
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${pct.toFixed(2)}%`;
}

function statusDisplay(status: TradeStatus): { label: string; colorClass: string } {
  switch (status) {
    case 'watching':
      return { label: 'Open', colorClass: 'text-teal-600 dark:text-teal-400' };
    case 'entered':
      return { label: 'Entered', colorClass: 'text-blue-700 dark:text-blue-400' };
    case 'target_hit':
      return { label: 'Target Hit', colorClass: 'text-emerald-700 dark:text-emerald-400' };
    case 'sl_hit':
      return { label: 'STOPLOSS', colorClass: 'text-red-600 dark:text-red-400' };
    case 'closed':
      return { label: 'CLOSED', colorClass: 'text-slate-500 dark:text-slate-400' };
  }
}

function ratingColor(score: number): string {
  if (score >= 7.5) return 'text-emerald-700 dark:text-emerald-400';
  if (score >= 5.5) return 'text-amber-700 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

function getCallExpiryAlert(setup: TradeSetup): {
  kind: 'expired' | 'soon';
  label: string;
  detail: string;
  colorClass: string;
} | null {
  if (setup.status === 'target_hit' || setup.status === 'sl_hit' || setup.status === 'closed') {
    return null;
  }
  let expiryMs: number | null = null;
  if (setup.createdAt && setup.expiryDays && setup.expiryDays > 0) {
    const created = Date.parse(setup.createdAt);
    if (Number.isFinite(created)) {
      expiryMs = created + setup.expiryDays * 24 * 60 * 60 * 1000;
    }
  }
  if (expiryMs === null && setup.callExpiryDate) {
    const raw = setup.callExpiryDate.trim();
    const withYear = /\d{4}/.test(raw) ? raw : `${raw} ${new Date().getFullYear()}`;
    const parsed = Date.parse(withYear);
    if (Number.isFinite(parsed)) {
      expiryMs = parsed;
    }
  }
  if (expiryMs === null) return null;

  const daysLeft = Math.ceil((expiryMs - Date.now()) / (24 * 60 * 60 * 1000));
  if (daysLeft < 0) {
    return {
      kind: 'expired',
      label: 'EXPIRED',
      detail:
        setup.status === 'entered'
          ? 'Call expiry window complete ho chuki hai — SL aur position review karein.'
          : 'Call expiry date nikal chuki hai — is par fresh entry avoid karein.',
      colorClass: 'text-red-600 dark:text-red-400',
    };
  }
  if (daysLeft <= 3) {
    return {
      kind: 'soon',
      label: daysLeft === 0 ? 'EXPIRES TODAY' : `EXPIRES ${daysLeft}D`,
      detail:
        daysLeft === 0
          ? 'Aaj is call ki expiry date hai — target/SL review karein.'
          : `Call expiry me sirf ${daysLeft} din bache hain — exit/review plan ready rakhein.`,
      colorClass: 'text-amber-700 dark:text-amber-400',
    };
  }
  return null;
}

export const TradingDeskView: React.FC<TradingDeskViewProps> = ({
  section,
  plans,
  remoteConfig,
  onSavePlan,
  onUpdateSetup,
  onDeleteSetup,
  onOpenDeepResearch,
}) => {
  const cfg = SECTION_CONFIGS[section];
  const currentMonth = useMemo(() => getCurrentMonthInfo(), []);
  const currentPlanId = `${section}_${currentMonth.monthKey}`;

  const sectionPlans = useMemo(
    () =>
      plans
        .filter((p) => p.section === section)
        .sort((a, b) => b.monthKey.localeCompare(a.monthKey)),
    [plans, section]
  );

  const [selectedPlanId, setSelectedPlanId] = useState(currentPlanId);
  const [selectedSetupId, setSelectedSetupId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'entered' | 'open' | 'closed'>('all');

  // Entry & Exit recording states (locks entered stocks until explicit exit)
  const [showEntryBox, setShowEntryBox] = useState(false);
  const [entryPriceInput, setEntryPriceInput] = useState('');
  const [entryQtyInput, setEntryQtyInput] = useState('');
  const [entryFormError, setEntryFormError] = useState<string | null>(null);

  const [showExitBox, setShowExitBox] = useState(false);
  const [exitPriceInput, setExitPriceInput] = useState('');
  const [exitOutcome, setExitOutcome] = useState<'target_hit' | 'sl_hit' | 'closed'>('closed');
  const [exitFormError, setExitFormError] = useState<string | null>(null);

  // Compact Filter / Settings drawer (hidden by default to keep list clean like broker app)
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
  const [market, setMarket] = useState<SwingMarket>('NSE');
  const [universe, setUniverse] = useState<UniverseMode>('nifty500');
  const [setupCount, setSetupCount] = useState<1 | 2 | 3>(3);
  const [language, setLanguage] = useState<ResearchLanguage>('hinglish');

  // Scan & daily exit check states
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [isRechecking, setIsRechecking] = useState(false);
  const [recheckError, setRecheckError] = useState<string | null>(null);

  // Manual call form inside settings drawer
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualSymbol, setManualSymbol] = useState('');
  const [manualName, setManualName] = useState('');
  const [manualEntryMin, setManualEntryMin] = useState('');
  const [manualEntryMax, setManualEntryMax] = useState('');
  const [manualSl, setManualSl] = useState('');
  const [manualT1, setManualT1] = useState('');
  const [manualT2, setManualT2] = useState('');
  const [manualRule, setManualRule] = useState('');
  const [manualError, setManualError] = useState<string | null>(null);

  // Call Detail collapsible panels
  const [openRules, setOpenRules] = useState(false);
  const [openCalc, setOpenCalc] = useState(false);
  const [openLog, setOpenLog] = useState(false);

  // Position sizing / MTF calculator state (inside Call Detail)
  const [capital, setCapital] = useState<number>(cfg.defaultCapital);
  const [riskPct, setRiskPct] = useState<number>(cfg.defaultRiskPct);
  const [mtfLeverage, setMtfLeverage] = useState<number>(4);
  const [mtfInterestPct, setMtfInterestPct] = useState<number>(14);
  const [mtfHoldingDays, setMtfHoldingDays] = useState<number>(10);

  useEffect(() => {
    setSelectedPlanId(`${section}_${currentMonth.monthKey}`);
    setSelectedSetupId(null);
    setStatusFilter('all');
    setShowSettingsDrawer(false);
    setShowManualForm(false);
    setScanError(null);
    setRecheckError(null);
    setManualError(null);
    setOpenRules(false);
    setOpenCalc(false);
    setOpenLog(false);
    setCapital(SECTION_CONFIGS[section].defaultCapital);
    setRiskPct(SECTION_CONFIGS[section].defaultRiskPct);
    if (section === 'mtf') setMarket('NSE');
    const savedForSection = plans.find((p) => p.id === `${section}_${currentMonth.monthKey}`);
    setUniverse(savedForSection?.universe || 'nifty500');
  }, [section, currentMonth.monthKey]);

  // If a new month starts before Daily Update is tapped, keep any previous month's plan with active 'entered' positions immediately visible
  const activePlan =
    sectionPlans.find((p) => p.id === selectedPlanId) ||
    (selectedPlanId === currentPlanId
      ? sectionPlans.find((p) => p.setups.some((s) => s.status === 'entered')) || null
      : sectionPlans[0] || null);

  const activeSetups = activePlan?.setups || [];
  const activeCurrency: '₹' | '$' =
    activeSetups[0]?.currency || (market === 'NSE' ? '₹' : '$');

  const selectedSetup = useMemo(
    () => activeSetups.find((s) => s.id === selectedSetupId) || null,
    [activeSetups, selectedSetupId]
  );

  const enteredCount = activeSetups.filter((s) => s.status === 'entered').length;
  const openCount = activeSetups.filter((s) => s.status === 'watching').length;
  const closedCount = activeSetups.filter(
    (s) => s.status === 'target_hit' || s.status === 'sl_hit' || s.status === 'closed'
  ).length;

  const filteredSetups = useMemo(() => {
    if (statusFilter === 'entered') {
      return activeSetups.filter((s) => s.status === 'entered');
    }
    if (statusFilter === 'open') {
      return activeSetups.filter((s) => s.status === 'watching');
    }
    if (statusFilter === 'closed') {
      return activeSetups.filter(
        (s) => s.status === 'target_hit' || s.status === 'sl_hit' || s.status === 'closed'
      );
    }
    // Always keep locked Entered positions pinned at the top
    return [...activeSetups].sort((a, b) => {
      const aScore = a.status === 'entered' ? 0 : a.status === 'watching' ? 1 : 2;
      const bScore = b.status === 'entered' ? 0 : b.status === 'watching' ? 1 : 2;
      return aScore - bScore;
    });
  }, [activeSetups, statusFilter]);

  const isStaleDailyList = Boolean(
    activePlan &&
      activePlan.id === currentPlanId &&
      activePlan.generatedAt.slice(0, 10) < currentMonth.todayIso
  );

  // Reset inline entry/exit forms and sync dynamic per-stock MTF leverage/days when switching stock
  useEffect(() => {
    setShowEntryBox(false);
    setShowExitBox(false);
    setEntryFormError(null);
    setExitFormError(null);
    if (selectedSetup) {
      const levMatch = (selectedSetup.mtfLeverage || '').match(/(\d+(?:\.\d+)?)x/i);
      if (levMatch) {
        const parsedLev = Number(levMatch[1]);
        if (parsedLev >= 1 && parsedLev <= 5) setMtfLeverage(parsedLev);
      }
      if (selectedSetup.expiryDays && selectedSetup.expiryDays >= 3 && selectedSetup.expiryDays <= 30) {
        setMtfHoldingDays(selectedSetup.expiryDays);
      }
    }
  }, [selectedSetupId, section, selectedSetup]);

  const handleDailyUpdate = async (overrideUniverse?: UniverseMode) => {
    if (isScanning) return;
    const targetUniverse: UniverseMode = overrideUniverse || universe;
    setIsScanning(true);
    setScanError(null);

    try {
      const apiBase = resolveBackendApiBase(remoteConfig?.apiBaseUrl);

      // CRITICAL PROTECTION: Never remove ANY stock marked as 'entered' until the user explicitly marks Exit!
      // Collect locked entered setups from current plan (or carried over from previous plan in this section)
      const currentSavedPlan = sectionPlans.find((p) => p.id === currentPlanId);
      const lockedEnteredMap = new Map<string, TradeSetup>();
      for (const p of sectionPlans) {
        for (const s of p.setups) {
          if (s.status === 'entered' && !lockedEnteredMap.has(s.symbol.toUpperCase())) {
            lockedEnteredMap.set(s.symbol.toUpperCase(), s);
          }
        }
      }
      let lockedEntered = Array.from(lockedEnteredMap.values());

      // Keep already closed calls from this month for history
      const existingClosed = (currentSavedPlan?.setups || []).filter(
        (s) => s.status === 'target_hit' || s.status === 'sl_hit' || s.status === 'closed'
      );

      // Run fresh daily Nifty 500 / Nifty 1000 scan AND live price/exit recheck for locked entered positions in parallel
      const scanPromise = fetch(`${apiBase}/api/stocks/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section,
          market,
          universe: targetUniverse,
          count: setupCount,
          language,
          monthLabel: currentMonth.monthLabel,
        }),
      });

      const recheckPromise =
        lockedEntered.length > 0
          ? fetch(`${apiBase}/api/stocks/recheck`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                section,
                language,
                setups: lockedEntered.map((s) => ({
                  id: s.id,
                  symbol: s.symbol,
                  exchange: s.exchange,
                  currency: s.currency,
                  direction: s.direction,
                  entryMin: s.entryMin,
                  entryMax: s.entryMax,
                  stopLoss: s.stopLoss,
                  target1: s.target1,
                  target2: s.target2,
                  actualEntry: s.actualEntry,
                  status: s.status,
                  callExpiryDate: s.callExpiryDate,
                  expiryDays: s.expiryDays,
                  createdAt: s.createdAt,
                })),
              }),
            }).catch(() => null)
          : Promise.resolve(null);

      const [res, recheckRes] = await Promise.all([scanPromise, recheckPromise]);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Daily update failed (${res.status}).`);
      }

      // Refresh live prices & exit alerts on locked entered stocks without removing them
      if (recheckRes && recheckRes.ok) {
        try {
          const rData = await recheckRes.json();
          const updates = (rData.updates || []) as Array<LiveRecheckUpdate & { id: string }>;
          const byId = new Map(updates.map((u) => [u.id, u]));
          lockedEntered = lockedEntered.map((s) => {
            const u = byId.get(s.id);
            if (!u) return s;
            return {
              ...s,
              currentPrice: u.latestPrice > 0 ? u.latestPrice : s.currentPrice,
              prevClose: u.prevClose > 0 ? u.prevClose : s.prevClose,
              liveCheck: {
                latestPrice: u.latestPrice,
                prevClose: u.prevClose,
                actionSignal: u.actionSignal,
                suggestedTrailingSl: u.suggestedTrailingSl,
                exitReason: u.exitReason,
                newsAlert: u.newsAlert,
                checkedAt: u.checkedAt,
              },
              updatedAt: u.checkedAt,
            };
          });
        } catch {
          // Keep existing locked setups safely even if recheck parse fails
        }
      }

      // Filter out any new daily scan symbol that is ALREADY locked in an active entered position
      const lockedSymbols = new Set(lockedEntered.map((s) => s.symbol.toUpperCase()));
      const freshWatching = ((data.setups || []) as TradeSetup[])
        .filter((s) => !lockedSymbols.has(s.symbol.toUpperCase()))
        .slice(0, setupCount);

      const nextPlan: SectionPlan = {
        id: currentPlanId,
        section,
        monthKey: currentMonth.monthKey,
        monthLabel: currentMonth.monthLabel,
        market,
        universe: market === 'NSE' ? targetUniverse : undefined,
        language,
        asOfDate: data.asOfDate || currentMonth.todayIso,
        marketNote: data.marketNote || '',
        setups: [...lockedEntered, ...freshWatching, ...existingClosed.slice(0, 15)],
        generatedAt: data.generatedAt || new Date().toISOString(),
      };

      onSavePlan(nextPlan);
      setSelectedPlanId(currentPlanId);
      setSelectedSetupId(null);
      setShowSettingsDrawer(false);
    } catch (err) {
      setScanError(
        err instanceof Error
          ? err.message
          : 'Daily calls load nahi ho payi. Thodi der baad retry karein.'
      );
    } finally {
      setIsScanning(false);
    }
  };

  const handleDailyExitRecheck = async () => {
    if (!activePlan || activeSetups.length === 0 || isRechecking) return;
    setIsRechecking(true);
    setRecheckError(null);

    try {
      const apiBase = resolveBackendApiBase(remoteConfig?.apiBaseUrl);
      const res = await fetch(`${apiBase}/api/stocks/recheck`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section,
          language,
          setups: activeSetups.map((s) => ({
            id: s.id,
            symbol: s.symbol,
            exchange: s.exchange,
            currency: s.currency,
            direction: s.direction,
            entryMin: s.entryMin,
            entryMax: s.entryMax,
            stopLoss: s.stopLoss,
            target1: s.target1,
            target2: s.target2,
            actualEntry: s.actualEntry,
            status: s.status,
            callExpiryDate: s.callExpiryDate,
            expiryDays: s.expiryDays,
            createdAt: s.createdAt,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Exit check failed (${res.status}).`);
      }

      const updates = (data.updates || []) as Array<LiveRecheckUpdate & { id: string }>;
      const byId = new Map(updates.map((u) => [u.id, u]));

      const updatedSetups = activePlan.setups.map((s) => {
        const u = byId.get(s.id);
        if (!u) return s;
        return {
          ...s,
          currentPrice: u.latestPrice > 0 ? u.latestPrice : s.currentPrice,
          prevClose: u.prevClose > 0 ? u.prevClose : s.prevClose,
          liveCheck: {
            latestPrice: u.latestPrice,
            prevClose: u.prevClose,
            actionSignal: u.actionSignal,
            suggestedTrailingSl: u.suggestedTrailingSl,
            exitReason: u.exitReason,
            newsAlert: u.newsAlert,
            checkedAt: u.checkedAt,
          },
          updatedAt: u.checkedAt,
        };
      });

      onSavePlan({
        ...activePlan,
        setups: updatedSetups,
        generatedAt: new Date().toISOString(),
      });
    } catch (err) {
      setRecheckError(
        err instanceof Error
          ? err.message
          : 'Exit check complete nahi ho paya. Retry karein.'
      );
    } finally {
      setIsRechecking(false);
    }
  };

  const handleAddManualSetup = (e: React.FormEvent) => {
    e.preventDefault();
    setManualError(null);

    const sym = manualSymbol.trim().toUpperCase();
    const eMin = Number(manualEntryMin);
    const eMax = Number(manualEntryMax || manualEntryMin);
    const sl = Number(manualSl);
    const t1 = Number(manualT1);
    const t2 = Number(manualT2 || manualT1);

    if (!sym || !eMin || !sl || !t1) {
      setManualError('Symbol, Entry, Stoploss, aur Target 1 bharna zaroori hai.');
      return;
    }

    const existingCurrentPlan = sectionPlans.find((p) => p.id === currentPlanId);
    const existingSetups = existingCurrentPlan?.setups || [];
    const nonEnteredCount = existingSetups.filter((s) => s.status !== 'entered').length;
    if (nonEnteredCount >= 12) {
      setManualError('Is section me 12 open/closed calls poore hain. Pehle koi purani call delete karein.');
      return;
    }

    const midEntry = (eMin + eMax) / 2;
    const riskPerShare = Math.abs(midEntry - sl);
    const rewardPerShare = Math.abs(t2 - midEntry);
    const rrVal = riskPerShare > 0 ? (rewardPerShare / riskPerShare).toFixed(1) : '2.0';
    const isShort = sl > midEntry;
    const curr: '₹' | '$' = market === 'NSE' ? '₹' : '$';
    const expiryDate = new Date(Date.now() + cfg.expiryDays * 24 * 60 * 60 * 1000)
      .toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        ...(section === 'long_term' ? { year: 'numeric' as const } : {}),
      })
      .toUpperCase();

    const newSetup: TradeSetup = {
      id: `${section}_manual_${Date.now()}`,
      section,
      symbol: sym,
      companyName: manualName.trim() || sym,
      exchange: market,
      sector: 'Manual Pick',
      currency: curr,
      direction: isShort ? 'Short' : 'Long',
      currentPrice: midEntry,
      prevClose: midEntry,
      asOfDate: currentMonth.todayIso,
      callDate: currentMonth.todayShort,
      callExpiryDate: expiryDate,
      hdRating: 8.0,
      entryMin: Math.min(eMin, eMax),
      entryMax: Math.max(eMin, eMax),
      stopLoss: sl,
      target1: t1,
      target2: t2,
      riskReward: `1 : ${rrVal}`,
      holdingWindow: cfg.defaultHolding,
      setupType: cfg.defaultSetupType,
      entryRule:
        manualRule.trim() || `Enter near ${formatPrice(eMin, curr)} with volume confirmation.`,
      exitRule: `Strict Stoploss at ${formatPrice(sl, curr)}. Book 50% at Target 1, rest at Target 2.`,
      rationale: `User-added ${cfg.title} call.`,
      mtfLeverage: section === 'mtf' ? `${mtfLeverage}x MTF` : '',
      status: 'watching',
      sources: [],
      createdAt: new Date().toISOString(),
    };

    const nextPlan: SectionPlan = {
      id: currentPlanId,
      section,
      monthKey: currentMonth.monthKey,
      monthLabel: currentMonth.monthLabel,
      market,
      language,
      asOfDate: existingCurrentPlan?.asOfDate || currentMonth.todayIso,
      marketNote: existingCurrentPlan?.marketNote || '',
      setups: [...existingSetups, newSetup],
      generatedAt: new Date().toISOString(),
    };

    onSavePlan(nextPlan);
    setSelectedPlanId(currentPlanId);
    setShowManualForm(false);
    setShowSettingsDrawer(false);
    setManualSymbol('');
    setManualName('');
    setManualEntryMin('');
    setManualEntryMax('');
    setManualSl('');
    setManualT1('');
    setManualT2('');
    setManualRule('');
  };

  // =========================================================================
  // CALL DETAIL VIEW (Matches Screenshot 1 — Clean Broker Call Detail Screen)
  // =========================================================================
  if (selectedSetup && activePlan) {
    const curr = selectedSetup.currency || activeCurrency;
    const isSell = selectedSetup.direction === 'Short';
    const isEntered = selectedSetup.status === 'entered';
    const isClosed =
      selectedSetup.status === 'target_hit' ||
      selectedSetup.status === 'sl_hit' ||
      selectedSetup.status === 'closed';
    const actualEntryNum = Number(selectedSetup.actualEntry) || 0;
    const actualExitNum = Number(selectedSetup.actualExit) || 0;
    const actualQtyNum = Number(selectedSetup.actualQty) || 0;

    const refPrice =
      selectedSetup.currentPrice ||
      (selectedSetup.entryMin + selectedSetup.entryMax) / 2 ||
      selectedSetup.entryMin;
    const midEntry =
      actualEntryNum > 0
        ? actualEntryNum
        : (selectedSetup.entryMin + selectedSetup.entryMax) / 2 || refPrice;
    const stInfo = statusDisplay(selectedSetup.status);
    const liveCheck = selectedSetup.liveCheck;
    const signalMeta = liveCheck ? SIGNAL_META[liveCheck.actionSignal] : null;

    // Live / Realized P&L calculation based on User's Actual Entry Price
    const livePnlPct =
      actualEntryNum > 0 && selectedSetup.currentPrice > 0
        ? ((isSell
            ? actualEntryNum - selectedSetup.currentPrice
            : selectedSetup.currentPrice - actualEntryNum) /
            actualEntryNum) *
          100
        : null;
    const livePnlAbs =
      actualEntryNum > 0 && actualQtyNum > 0 && selectedSetup.currentPrice > 0
        ? (isSell
            ? actualEntryNum - selectedSetup.currentPrice
            : selectedSetup.currentPrice - actualEntryNum) * actualQtyNum
        : null;

    const closedPnlPct =
      actualEntryNum > 0 && actualExitNum > 0
        ? ((isSell ? actualEntryNum - actualExitNum : actualExitNum - actualEntryNum) /
            actualEntryNum) *
          100
        : null;
    const closedPnlAbs =
      actualEntryNum > 0 && actualExitNum > 0 && actualQtyNum > 0
        ? (isSell ? actualEntryNum - actualExitNum : actualExitNum - actualEntryNum) *
          actualQtyNum
        : null;

    const handleConfirmEntry = (e: React.FormEvent) => {
      e.preventDefault();
      setEntryFormError(null);
      const parsedPrice = Number(entryPriceInput);
      if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
        setEntryFormError('Sahi Entry Price daalein (e.g. 1611.50).');
        return;
      }
      const parsedQty = entryQtyInput.trim() ? Number(entryQtyInput) : 0;
      onUpdateSetup(activePlan.id, {
        ...selectedSetup,
        status: 'entered',
        actualEntry: String(parsedPrice),
        actualQty: parsedQty > 0 ? String(parsedQty) : selectedSetup.actualQty,
        enteredAt: currentMonth.todayShort,
        updatedAt: new Date().toISOString(),
      });
      setShowEntryBox(false);
    };

    const handleConfirmExit = (e: React.FormEvent) => {
      e.preventDefault();
      setExitFormError(null);
      const parsedExit = Number(exitPriceInput);
      if (!Number.isFinite(parsedExit) || parsedExit <= 0) {
        setExitFormError('Sahi Exit Price daalein.');
        return;
      }
      onUpdateSetup(activePlan.id, {
        ...selectedSetup,
        status: exitOutcome,
        actualExit: String(parsedExit),
        exitedAt: currentMonth.todayShort,
        updatedAt: new Date().toISOString(),
      });
      setShowExitBox(false);
    };

    // Day change math
    const changePct =
      typeof selectedSetup.dayChangePct === 'number'
        ? selectedSetup.dayChangePct
        : selectedSetup.prevClose && selectedSetup.prevClose > 0 && selectedSetup.currentPrice > 0
          ? ((selectedSetup.currentPrice - selectedSetup.prevClose) / selectedSetup.prevClose) * 100
          : null;
    const changeAbs =
      selectedSetup.prevClose && selectedSetup.prevClose > 0 && selectedSetup.currentPrice > 0
        ? selectedSetup.currentPrice - selectedSetup.prevClose
        : null;

    // Position sizing / MTF math for this stock (Risk % enforced across ALL sections including MTF!)
    const riskPerShare = Math.abs(midEntry - selectedSetup.stopLoss);
    const riskAmount = (capital * riskPct) / 100;
    const mtfTotalBuyingPower = capital * mtfLeverage;

    let qty = 0;
    let deployedValue = 0;
    let mtfBrokerFunded = 0;
    let mtfTotalInterest = 0;
    let maxLoss = 0;
    let netT1Profit = 0;
    let netT2Profit = 0;

    if (section === 'mtf') {
      const qtyByRisk = riskPerShare > 0 ? Math.floor(riskAmount / riskPerShare) : 0;
      const qtyByBuyingPower = midEntry > 0 ? Math.floor(mtfTotalBuyingPower / midEntry) : 0;
      qty = Math.max(1, Math.min(qtyByRisk || qtyByBuyingPower, qtyByBuyingPower || qtyByRisk));
      deployedValue = qty * midEntry;
      const yourMargin = mtfLeverage > 1 ? Math.min(capital, deployedValue / mtfLeverage) : Math.min(capital, deployedValue);
      mtfBrokerFunded = Math.max(0, deployedValue - yourMargin);
      mtfTotalInterest = ((mtfBrokerFunded * (mtfInterestPct / 100)) / 365) * mtfHoldingDays;
      maxLoss = qty * riskPerShare + mtfTotalInterest;
      netT1Profit = qty * Math.abs(selectedSetup.target1 - midEntry) - mtfTotalInterest;
      netT2Profit = qty * Math.abs(selectedSetup.target2 - midEntry) - mtfTotalInterest;
    } else {
      const qtyByRisk = riskPerShare > 0 ? Math.floor(riskAmount / riskPerShare) : 0;
      const qtyByCapital = midEntry > 0 ? Math.floor(capital / midEntry) : 0;
      qty = Math.max(1, Math.min(qtyByRisk || qtyByCapital, qtyByCapital || qtyByRisk));
      deployedValue = qty * midEntry;
      maxLoss = qty * riskPerShare;
      netT1Profit = qty * Math.abs(selectedSetup.target1 - midEntry);
      netT2Profit = qty * Math.abs(selectedSetup.target2 - midEntry);
    }

    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4">
        {/* Clean Top Navigation Bar */}
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setSelectedSetupId(null)}
            className="inline-flex items-center gap-1.5 min-h-[44px] pr-3 text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>{cfg.title}</span>
          </button>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleDailyExitRecheck}
              disabled={isRechecking}
              title="Run Daily Exit & Trap Check"
              className="min-h-[40px] px-3 inline-flex items-center gap-1.5 rounded-xl bg-white dark:bg-[#131A26] border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 hover:border-blue-600 transition-colors disabled:opacity-60"
            >
              {isRechecking ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-blue-700 dark:text-blue-400" />
              )}
              <span>Exit Check</span>
            </button>

            {/* Protect active entered stock from accidental deletion until exited */}
            {isEntered ? (
              <span
                title="Position locked until Exit"
                className="min-h-[40px] px-2.5 inline-flex items-center gap-1 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-xs font-semibold text-blue-700 dark:text-blue-300"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Locked</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onDeleteSetup(activePlan.id, selectedSetup.id);
                  setSelectedSetupId(null);
                }}
                aria-label={`Remove ${selectedSetup.symbol}`}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {recheckError && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 p-3 text-xs text-red-700 dark:text-red-300"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{recheckError}</span>
          </div>
        )}

        {/* Stock Header Card (Exact Screenshot 1 Identity Header) */}
        <section className="rounded-2xl bg-white dark:bg-[#131A26] border border-slate-200 dark:border-slate-800 p-4 sm:p-5 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl font-bold font-mono tracking-tight text-slate-900 dark:text-slate-100">
              {selectedSetup.symbol}
            </h1>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400 truncate">
              {selectedSetup.companyName}
            </p>
            <div className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
              {selectedSetup.exchange}
              {selectedSetup.universe === 'nifty1000'
                ? ' · High Risk · Nifty 1000'
                : selectedSetup.universe === 'nifty500'
                  ? ' · Low Risk · Nifty 500'
                  : ''}
              {selectedSetup.sector ? ` · ${selectedSetup.sector}` : ''}
            </div>
          </div>

          <div className="text-right shrink-0 tabular-nums">
            <div className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">
              {formatPrice(selectedSetup.currentPrice, curr)}
            </div>
            {changePct !== null && (
              <div
                className={`mt-0.5 text-xs font-mono font-semibold ${
                  changePct >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {changeAbs !== null && (
                  <span>
                    {changeAbs >= 0 ? '+' : ''}
                    {changeAbs.toFixed(2)}{' '}
                  </span>
                )}
                <span>
                  ({changePct >= 0 ? '+' : ''}
                  {changePct.toFixed(2)}%)
                </span>
              </div>
            )}
          </div>
        </section>

        {/* Live Exit / Trap Alert Banner (if checked) */}
        {liveCheck && signalMeta && (
          <section className={`rounded-2xl border p-4 space-y-1.5 ${signalMeta.boxClass}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className={`text-xs font-bold tracking-wide ${signalMeta.textClass}`}>
                {signalMeta.label}
              </div>
              {liveCheck.suggestedTrailingSl && liveCheck.suggestedTrailingSl > selectedSetup.stopLoss && (
                <button
                  type="button"
                  onClick={() =>
                    onUpdateSetup(activePlan.id, {
                      ...selectedSetup,
                      stopLoss: liveCheck.suggestedTrailingSl || selectedSetup.stopLoss,
                      updatedAt: new Date().toISOString(),
                    })
                  }
                  className="text-xs font-semibold text-blue-700 dark:text-blue-400 hover:underline"
                >
                  Apply Trailing SL {formatPrice(liveCheck.suggestedTrailingSl, curr)}
                </button>
              )}
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              {liveCheck.exitReason}
            </p>
            {liveCheck.newsAlert && (
              <p className="text-xs text-slate-600 dark:text-slate-400">
                News: {liveCheck.newsAlert}
              </p>
            )}
          </section>
        )}

        {/* Primary Broker-Style Key-Value Call Card (Exact Screenshot 1 Table) */}
        <section className="rounded-2xl bg-white dark:bg-[#131A26] border border-slate-200 dark:border-slate-800 px-4 sm:px-5 py-2">
          <div className="py-3.5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
            <h2 className="text-base font-bold text-blue-900 dark:text-blue-300">
              {cfg.callHeading} - {isSell ? 'SELL' : 'BUY'}
            </h2>
            {selectedSetup.mtfLeverage && (
              <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">
                {selectedSetup.mtfLeverage}
              </span>
            )}
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/80 text-sm">
            {/* Target Price (1 & 2) */}
            <div className="py-3.5 space-y-1">
              <div className="flex items-start justify-between gap-4">
                <span className="text-slate-600 dark:text-slate-400">Target price</span>
                <div className="text-right font-mono tabular-nums space-y-1">
                  <div className="flex items-baseline justify-end gap-2">
                    <span className="text-xs font-sans font-semibold text-blue-700 dark:text-blue-400">
                      1
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {formatPrice(selectedSetup.target1, curr)}
                    </span>
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      {pctDiff(midEntry, selectedSetup.target1)}
                    </span>
                  </div>
                  {selectedSetup.target2 > 0 && selectedSetup.target2 !== selectedSetup.target1 && (
                    <div className="flex items-baseline justify-end gap-2">
                      <span className="text-xs font-sans font-semibold text-blue-700 dark:text-blue-400">
                        2
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {formatPrice(selectedSetup.target2, curr)}
                      </span>
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        {pctDiff(midEntry, selectedSetup.target2)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              {selectedSetup.targetLogic && (
                <div className="text-[11px] text-slate-500 dark:text-slate-400 text-right">
                  {selectedSetup.targetLogic}
                </div>
              )}
            </div>

            {/* Stoploss Price */}
            <div className="py-3.5 space-y-1">
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-600 dark:text-slate-400">Stoploss price</span>
                <div className="flex items-baseline gap-2 font-mono tabular-nums">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {formatPrice(selectedSetup.stopLoss, curr)}
                  </span>
                  <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                    {pctDiff(midEntry, selectedSetup.stopLoss)}
                  </span>
                </div>
              </div>
              {selectedSetup.slLogic && (
                <div className="text-[11px] text-slate-500 dark:text-slate-400 text-right">
                  {selectedSetup.slLogic}
                </div>
              )}
            </div>

            {/* Suggested Entry Price */}
            <div className="py-3.5 flex items-center justify-between gap-4">
              <span className="text-slate-600 dark:text-slate-400">Suggested entry price</span>
              <span className="font-mono font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                {selectedSetup.entryMin === selectedSetup.entryMax
                  ? formatPrice(selectedSetup.entryMin, curr)
                  : `${formatPrice(selectedSetup.entryMin, curr)} – ${formatPrice(selectedSetup.entryMax, curr)}`}
              </span>
            </div>

            {/* Call Date */}
            <div className="py-3.5 flex items-center justify-between gap-4">
              <span className="text-slate-600 dark:text-slate-400">Call date</span>
              <span className="font-medium tabular-nums text-slate-900 dark:text-slate-100">
                {selectedSetup.callDate || selectedSetup.asOfDate || currentMonth.todayShort}
              </span>
            </div>

            {/* Call Expiry Date */}
            {(() => {
              const expAlert = getCallExpiryAlert(selectedSetup);
              return (
                <div className="py-3.5 space-y-1">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-600 dark:text-slate-400">Call expiry date</span>
                    <span className="font-medium tabular-nums text-slate-900 dark:text-slate-100">
                      {selectedSetup.callExpiryDate || selectedSetup.holdingWindow}
                      {selectedSetup.expiryDays ? ` (${selectedSetup.expiryDays}d)` : ''}
                      {expAlert && (
                        <span className={`ml-2 text-xs font-bold uppercase ${expAlert.colorClass}`}>
                          · {expAlert.label}
                        </span>
                      )}
                    </span>
                  </div>
                  {selectedSetup.expiryLogic && (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 text-right">
                      {selectedSetup.expiryLogic}
                    </div>
                  )}
                  {expAlert && (
                    <div className={`text-[11px] font-medium text-right ${expAlert.colorClass}`}>
                      {expAlert.detail}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* HD Rating & Risk:Reward */}
            <div className="py-3.5 flex items-center justify-between gap-4">
              <span className="text-slate-600 dark:text-slate-400">HD Rating · R:R</span>
              <span className="font-mono font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                <span className={ratingColor(selectedSetup.hdRating)}>
                  {selectedSetup.hdRating.toFixed(1)}/10
                </span>
                <span className="mx-2 text-slate-400">·</span>
                <span>{selectedSetup.riskReward}</span>
              </span>
            </div>

            {/* Call Status */}
            <div className="py-3.5 flex items-center justify-between gap-4">
              <span className="text-slate-600 dark:text-slate-400">Call status</span>
              <span className={`font-semibold ${stInfo.colorClass}`}>{stInfo.label}</span>
            </div>

            {/* View HD Pro Research Action Row (Matches Screenshot 1 "View share details >") */}
            <button
              type="button"
              onClick={() => onOpenDeepResearch(selectedSetup.symbol)}
              className="w-full py-4 flex items-center justify-between text-left font-semibold text-blue-900 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              <span>View HD Pro Research</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </section>

        {/* ACTIVE POSITION / MARK ENTRY & MARK EXIT PANEL (Protects entered stock until explicit exit) */}
        <section className="rounded-2xl bg-white dark:bg-[#131A26] border border-slate-200 dark:border-slate-800 p-4 sm:p-5 space-y-3.5">
          {isEntered && actualEntryNum > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 dark:text-blue-400">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Active Entry Locked (Exit tak Daily Update me nahi hatega)</span>
                </div>
                {selectedSetup.enteredAt && (
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                    {selectedSetup.enteredAt}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2.5 rounded-xl bg-slate-50 dark:bg-[#0B0F17] p-3 font-mono tabular-nums">
                <div>
                  <div className="text-[11px] font-sans text-slate-500 dark:text-slate-400">
                    My Entry
                  </div>
                  <div className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    {formatPrice(actualEntryNum, curr)}
                  </div>
                  {actualQtyNum > 0 && (
                    <div className="text-[11px] font-sans text-slate-500">{actualQtyNum} sh</div>
                  )}
                </div>

                <div>
                  <div className="text-[11px] font-sans text-slate-500 dark:text-slate-400">
                    Live LTP
                  </div>
                  <div className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    {formatPrice(selectedSetup.currentPrice, curr)}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[11px] font-sans text-slate-500 dark:text-slate-400">
                    Live P&amp;L
                  </div>
                  {livePnlPct !== null && (
                    <div
                      className={`font-bold text-sm ${
                        livePnlPct >= 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {livePnlPct >= 0 ? '+' : ''}
                      {livePnlPct.toFixed(2)}%
                    </div>
                  )}
                  {livePnlAbs !== null && (
                    <div
                      className={`text-[11px] font-semibold ${
                        livePnlAbs >= 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {livePnlAbs >= 0 ? '+' : ''}
                      {formatPrice(Math.round(livePnlAbs), curr)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {isClosed && actualEntryNum > 0 && actualExitNum > 0 && (
            <div className="rounded-xl bg-slate-50 dark:bg-[#0B0F17] p-3 flex items-center justify-between gap-3 font-mono tabular-nums text-xs sm:text-sm">
              <div>
                <div className="text-[11px] font-sans text-slate-500">Closed Trade</div>
                <div className="font-semibold text-slate-900 dark:text-slate-100">
                  {formatPrice(actualEntryNum, curr)} → {formatPrice(actualExitNum, curr)}
                </div>
              </div>
              {closedPnlPct !== null && (
                <div className="text-right">
                  <div
                    className={`font-bold ${
                      closedPnlPct >= 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {closedPnlPct >= 0 ? '+' : ''}
                    {closedPnlPct.toFixed(2)}%
                  </div>
                  {closedPnlAbs !== null && (
                    <div className="text-[11px] text-slate-500">
                      {closedPnlAbs >= 0 ? '+' : ''}
                      {formatPrice(Math.round(closedPnlAbs), curr)}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Primary Action Button (Exact Screenshot 1 Full-Width Primary CTA Rhythm) */}
          {!isEntered && !isClosed && !showEntryBox && (
            <button
              type="button"
              onClick={() => {
                setEntryPriceInput(String(selectedSetup.currentPrice || selectedSetup.entryMax || ''));
                setEntryQtyInput(selectedSetup.actualQty || '');
                setEntryFormError(null);
                setShowEntryBox(true);
              }}
              className="w-full min-h-[48px] px-4 rounded-xl bg-blue-900 hover:bg-blue-800 dark:bg-blue-700 dark:hover:bg-blue-600 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors"
            >
              <LogIn className="w-4 h-4" />
              <span>Mark Entry (Maine Buy Kiya)</span>
            </button>
          )}

          {isEntered && !showExitBox && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setExitPriceInput(String(selectedSetup.currentPrice || ''));
                  const autoOutcome: 'target_hit' | 'sl_hit' | 'closed' =
                    selectedSetup.currentPrice >= selectedSetup.target1
                      ? 'target_hit'
                      : selectedSetup.currentPrice <= selectedSetup.stopLoss
                        ? 'sl_hit'
                        : 'closed';
                  setExitOutcome(autoOutcome);
                  setExitFormError(null);
                  setShowExitBox(true);
                }}
                className="flex-1 min-h-[48px] px-4 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-950 text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Mark Exit (Position Close Karein)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEntryPriceInput(selectedSetup.actualEntry || String(selectedSetup.currentPrice));
                  setEntryQtyInput(selectedSetup.actualQty || '');
                  setShowEntryBox((v) => !v);
                }}
                className="min-h-[48px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Edit Entry
              </button>
            </div>
          )}

          {/* Inline Mark Entry Form */}
          {showEntryBox && (
            <form onSubmit={handleConfirmEntry} className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  Apna Actual Entry Price daalein
                </span>
                <button
                  type="button"
                  onClick={() => setShowEntryBox(false)}
                  className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                >
                  Cancel
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <label className="space-y-1 text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Entry Price ({curr}) *</span>
                  <input
                    type="number"
                    step="any"
                    required
                    value={entryPriceInput}
                    onChange={(e) => setEntryPriceInput(e.target.value)}
                    placeholder={String(selectedSetup.currentPrice)}
                    className="w-full min-h-[44px] px-3 rounded-xl bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 font-mono text-sm tabular-nums text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600"
                  />
                </label>
                <label className="space-y-1 text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Qty (Optional)</span>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={entryQtyInput}
                    onChange={(e) => setEntryQtyInput(e.target.value)}
                    placeholder="e.g. 10"
                    className="w-full min-h-[44px] px-3 rounded-xl bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 font-mono text-sm tabular-nums text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600"
                  />
                </label>
              </div>
              {entryFormError && (
                <p className="text-xs text-red-600 dark:text-red-400">{entryFormError}</p>
              )}
              <button
                type="submit"
                className="w-full min-h-[46px] rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold inline-flex items-center justify-center gap-1.5 transition-colors"
              >
                <Check className="w-4 h-4" />
                <span>Confirm Entry &amp; Lock Stock</span>
              </button>
            </form>
          )}

          {/* Inline Mark Exit Form */}
          {showExitBox && (
            <form onSubmit={handleConfirmExit} className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  Position Exit Record Karein
                </span>
                <button
                  type="button"
                  onClick={() => setShowExitBox(false)}
                  className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                >
                  Cancel
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <label className="space-y-1 text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Exit Price ({curr}) *</span>
                  <input
                    type="number"
                    step="any"
                    required
                    value={exitPriceInput}
                    onChange={(e) => setExitPriceInput(e.target.value)}
                    placeholder={String(selectedSetup.currentPrice)}
                    className="w-full min-h-[44px] px-3 rounded-xl bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 font-mono text-sm tabular-nums text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600"
                  />
                </label>
                <div className="space-y-1 text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Exit Reason</span>
                  <div className="grid grid-cols-3 gap-1">
                    {(
                      [
                        { id: 'target_hit', label: 'Target' },
                        { id: 'sl_hit', label: 'Stoploss' },
                        { id: 'closed', label: 'Manual' },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setExitOutcome(opt.id)}
                        className={`min-h-[44px] rounded-xl text-xs font-medium transition-colors ${
                          exitOutcome === opt.id
                            ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950'
                            : 'bg-slate-100 dark:bg-[#0B0F17] text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              {exitFormError && (
                <p className="text-xs text-red-600 dark:text-red-400">{exitFormError}</p>
              )}
              <button
                type="submit"
                className="w-full min-h-[46px] rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-950 text-sm font-semibold inline-flex items-center justify-center gap-1.5 transition-colors"
              >
                <Check className="w-4 h-4" />
                <span>Confirm Exit</span>
              </button>
            </form>
          )}
        </section>

        {/* Collapsible 1: Entry / Exit Rules & Trap Alert */}
        <section className="rounded-2xl bg-white dark:bg-[#131A26] border border-slate-200 dark:border-slate-800 px-4 sm:px-5">
          <button
            type="button"
            onClick={() => setOpenRules((v) => !v)}
            className="w-full min-h-[48px] flex items-center justify-between gap-3 text-left"
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
              <ShieldAlert className="w-4 h-4 text-blue-700 dark:text-blue-400 shrink-0" />
              <span>Entry / Exit Rules &amp; Trap Alert</span>
            </div>
            {openRules ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {openRules && (
            <div className="pb-4 pt-1 border-t border-slate-100 dark:border-slate-800/80 space-y-3 text-sm">
              {selectedSetup.rationale && (
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  {selectedSetup.rationale}
                </p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 dark:bg-[#0B0F17] p-3">
                  <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    Kab Entry Leni Hai
                  </div>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {selectedSetup.entryRule}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 dark:bg-[#0B0F17] p-3">
                  <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    Kab Exit Karna Hai
                  </div>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {selectedSetup.exitRule}
                  </p>
                </div>
              </div>
              {selectedSetup.trapWarning && (
                <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 p-3 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                  <strong>Trap Shield:</strong> {selectedSetup.trapWarning}
                </div>
              )}
              {selectedSetup.newsSummary && (
                <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  <strong className="text-slate-800 dark:text-slate-200">News:</strong>{' '}
                  {selectedSetup.newsSummary}
                </div>
              )}
              {selectedSetup.sources && selectedSetup.sources.length > 0 && (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                  <span>Sources:</span>
                  {selectedSetup.sources.slice(0, 4).map((src) => (
                    <a
                      key={src.index}
                      href={src.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-700 dark:text-blue-400 hover:underline"
                    >
                      <span className="truncate max-w-[140px]">{src.domain}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Collapsible 2: Daily Parameters Checked (Transparent Audit) */}
        {selectedSetup.parameters && selectedSetup.parameters.length > 0 && (
          <section className="rounded-2xl bg-white dark:bg-[#131A26] border border-slate-200 dark:border-slate-800 px-4 sm:px-5 pb-4">
            <ParameterAuditList
              parameters={selectedSetup.parameters}
              title={`Daily Parameters Checked (${selectedSetup.symbol})`}
              defaultOpen={section === 'short_term'}
            />
          </section>
        )}

        {/* Collapsible 3: Position Size / MTF Calculator */}
        <section className="rounded-2xl bg-white dark:bg-[#131A26] border border-slate-200 dark:border-slate-800 px-4 sm:px-5">
          <button
            type="button"
            onClick={() => setOpenCalc((v) => !v)}
            className="w-full min-h-[48px] flex items-center justify-between gap-3 text-left"
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
              <Calculator className="w-4 h-4 text-slate-500 shrink-0" />
              <span>
                {section === 'mtf'
                  ? 'MTF Margin & Interest Calculator'
                  : 'Position Size & Risk Calculator'}
              </span>
            </div>
            <span className="text-xs font-mono tabular-nums text-slate-500">
              Qty {qty}
              {openCalc ? (
                <ChevronUp className="w-4 h-4 inline ml-1.5" />
              ) : (
                <ChevronDown className="w-4 h-4 inline ml-1.5" />
              )}
            </span>
          </button>

          {openCalc && (
            <div className="pb-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-3 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <label className="space-y-1">
                  <span className="text-slate-500 dark:text-slate-400">
                    {section === 'mtf' ? `Own Margin (${curr})` : `Capital (${curr})`}
                  </span>
                  <input
                    type="number"
                    min={1000}
                    step={5000}
                    value={capital}
                    onChange={(e) => setCapital(Math.max(1000, Number(e.target.value) || 0))}
                    className="w-full min-h-[38px] px-2.5 rounded-lg bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 font-mono tabular-nums text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600"
                  />
                </label>

                {section === 'mtf' ? (
                  <>
                    <label className="space-y-1">
                      <span className="text-slate-500 dark:text-slate-400">Leverage (x)</span>
                      <select
                        value={mtfLeverage}
                        onChange={(e) => setMtfLeverage(Number(e.target.value))}
                        className="w-full min-h-[38px] px-2.5 rounded-lg bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 font-mono text-slate-900 dark:text-slate-100"
                      >
                        {[1, 2, 3, 4, 5].map((l) => (
                          <option key={l} value={l}>
                            {l}x
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-1">
                      <span className="text-slate-500 dark:text-slate-400">Risk per Trade (%)</span>
                      <div className="flex gap-1">
                        {[1, 1.5, 2, 3].map((pct) => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => setRiskPct(pct)}
                            className={`flex-1 min-h-[38px] rounded-lg font-mono font-medium transition-colors ${
                              riskPct === pct
                                ? 'bg-blue-700 text-white'
                                : 'bg-slate-100 dark:bg-[#0B0F17] text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {pct}%
                          </button>
                        ))}
                      </div>
                    </label>
                    <label className="space-y-1">
                      <span className="text-slate-500 dark:text-slate-400">Days · Int %/yr</span>
                      <div className="flex gap-1.5">
                        <input
                          type="number"
                          min={1}
                          max={90}
                          value={mtfHoldingDays}
                          onChange={(e) => setMtfHoldingDays(Math.max(1, Number(e.target.value) || 1))}
                          className="w-1/2 min-h-[38px] px-2 rounded-lg bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 font-mono tabular-nums text-slate-900 dark:text-slate-100"
                        />
                        <input
                          type="number"
                          min={0}
                          max={30}
                          step={0.5}
                          value={mtfInterestPct}
                          onChange={(e) => setMtfInterestPct(Math.max(0, Number(e.target.value) || 0))}
                          className="w-1/2 min-h-[38px] px-2 rounded-lg bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 font-mono tabular-nums text-slate-900 dark:text-slate-100"
                        />
                      </div>
                    </label>
                  </>
                ) : (
                  <label className="space-y-1">
                    <span className="text-slate-500 dark:text-slate-400">Risk per Trade (%)</span>
                    <div className="flex gap-1">
                      {[1, 1.5, 2].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => setRiskPct(pct)}
                          className={`flex-1 min-h-[38px] rounded-lg font-mono font-medium transition-colors ${
                            riskPct === pct
                              ? 'bg-blue-700 text-white'
                              : 'bg-slate-100 dark:bg-[#0B0F17] text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {pct}%
                        </button>
                      ))}
                    </div>
                  </label>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-xl bg-slate-50 dark:bg-[#0B0F17] p-3 font-mono tabular-nums">
                <div>
                  <div className="text-[11px] font-sans text-slate-500">Safe Qty ({riskPct}% Risk)</div>
                  <div className="font-bold text-slate-900 dark:text-slate-100">{qty} sh</div>
                </div>
                <div>
                  <div className="text-[11px] font-sans text-slate-500">
                    {section === 'mtf' ? 'Max Loss (+Int)' : 'Max SL Loss'}
                  </div>
                  <div className="font-bold text-red-600 dark:text-red-400">
                    -{formatPrice(Math.round(maxLoss), curr)}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-sans text-slate-500">
                    {section === 'mtf' ? 'Net T1 Profit' : 'Est. T1 Profit'}
                  </div>
                  <div
                    className={`font-bold ${
                      netT1Profit >= 0
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {netT1Profit >= 0 ? '+' : '-'}
                    {formatPrice(Math.abs(Math.round(netT1Profit)), curr)}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-sans text-slate-500">
                    {section === 'mtf' ? 'Net T2 Profit' : 'Est. T2 Profit'}
                  </div>
                  <div
                    className={`font-bold ${
                      netT2Profit >= 0
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {netT2Profit >= 0 ? '+' : '-'}
                    {formatPrice(Math.abs(Math.round(netT2Profit)), curr)}
                  </div>
                </div>
              </div>
              {section === 'mtf' && (
                <div className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                  Deployed {formatPrice(Math.round(deployedValue), curr)} (Max Power{' '}
                  {formatPrice(mtfTotalBuyingPower, curr)}) · Funded{' '}
                  {formatPrice(Math.round(mtfBrokerFunded), curr)} · Est. {mtfHoldingDays}d
                  Interest {formatPrice(Math.round(mtfTotalInterest), curr)}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Collapsible 4: My Trade Log */}
        <section className="rounded-2xl bg-white dark:bg-[#131A26] border border-slate-200 dark:border-slate-800 px-4 sm:px-5">
          <button
            type="button"
            onClick={() => setOpenLog((v) => !v)}
            className="w-full min-h-[48px] flex items-center justify-between gap-3 text-left"
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
              <NotebookPen className="w-4 h-4 text-slate-500 shrink-0" />
              <span>My Trade Log</span>
            </div>
            {openLog ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {openLog && (
            <div className="pb-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2.5 text-xs">
              <div className="grid grid-cols-2 gap-2.5">
                <input
                  type="text"
                  value={selectedSetup.actualEntry || ''}
                  onChange={(e) =>
                    onUpdateSetup(activePlan.id, {
                      ...selectedSetup,
                      actualEntry: e.target.value,
                    })
                  }
                  placeholder="My Actual Entry"
                  className="min-h-[40px] px-3 rounded-xl bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 font-mono text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
                />
                <input
                  type="text"
                  value={selectedSetup.actualExit || ''}
                  onChange={(e) =>
                    onUpdateSetup(activePlan.id, {
                      ...selectedSetup,
                      actualExit: e.target.value,
                    })
                  }
                  placeholder="My Actual Exit"
                  className="min-h-[40px] px-3 rounded-xl bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 font-mono text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
                />
              </div>
              <textarea
                rows={2}
                value={selectedSetup.userNotes || ''}
                onChange={(e) =>
                  onUpdateSetup(activePlan.id, {
                    ...selectedSetup,
                    userNotes: e.target.value,
                  })
                }
                placeholder="Personal entry/exit notes..."
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
              />
            </div>
          )}
        </section>

        <p className="text-[11px] text-slate-500 dark:text-slate-400 px-1">
          Educational &amp; risk-discipline tool only (not SEBI advisory). Verify live price on broker chart before placing orders.
        </p>
      </div>
    );
  }

  // =========================================================================
  // TRADING CALLS LIST VIEW (Matches Screenshot 2 — Ultra-Clean Broker Feed)
  // =========================================================================
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4">
      {/* Compact Header Bar — Zero Search Box Clutter */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-blue-950 dark:text-slate-100 truncate">
            {cfg.title}
          </h1>
          <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            {market === 'NSE'
              ? universe === 'nifty1000'
                ? `High Risk · Nifty 1000 · ${cfg.horizonLabel}`
                : `Low Risk · Nifty 500 · ${cfg.horizonLabel}`
              : `US Stocks · ${cfg.horizonLabel}`}
            {activePlan?.asOfDate && ` · Data ${activePlan.asOfDate}`}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => handleDailyUpdate()}
            disabled={isScanning}
            className="inline-flex items-center gap-1.5 min-h-[40px] px-3 sm:px-3.5 rounded-xl bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white text-xs font-medium transition-colors whitespace-nowrap"
          >
            {isScanning ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            <span>{isScanning ? 'Updating...' : 'Daily Update'}</span>
          </button>

          {activeSetups.length > 0 && (
            <button
              type="button"
              onClick={handleDailyExitRecheck}
              disabled={isRechecking}
              title="Daily Exit & Trap Check"
              className="inline-flex items-center gap-1.5 min-h-[40px] px-3 rounded-xl bg-white dark:bg-[#131A26] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-blue-600 text-xs font-medium transition-colors disabled:opacity-60 whitespace-nowrap"
            >
              {isRechecking ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-blue-700 dark:text-blue-400" />
              )}
              <span className="hidden sm:inline">Exit Check</span>
            </button>
          )}

          {/* Compact Filter / Settings Icon Button (Like Screenshot 2 Filter Button) */}
          <button
            type="button"
            onClick={() => setShowSettingsDrawer((v) => !v)}
            aria-label="Filter, settings and manual call"
            className={`min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl border transition-colors ${
              showSettingsDrawer
                ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-600 text-blue-700 dark:text-blue-400'
                : 'bg-white dark:bg-[#131A26] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            {showSettingsDrawer ? (
              <X className="w-4 h-4" />
            ) : (
              <SlidersHorizontal className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Top Risk Mode Toggle: Low Risk (Nifty 500) vs High Risk (Nifty 1000) */}
      {market === 'NSE' && (
        <div
          role="group"
          aria-label="Select risk universe: Low Risk Nifty 500 or High Risk Nifty 1000"
          className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-[#131A26] border border-slate-200 dark:border-slate-800"
        >
          <button
            type="button"
            disabled={isScanning}
            onClick={() => {
              if (universe !== 'nifty500') {
                setUniverse('nifty500');
                handleDailyUpdate('nifty500');
              }
            }}
            className={`min-h-[44px] px-3 py-2 rounded-xl text-left flex items-center justify-between gap-2 transition-colors disabled:opacity-60 ${
              universe === 'nifty500'
                ? 'bg-white dark:bg-[#1C2638] text-slate-900 dark:text-white shadow-xs ring-1 ring-emerald-600/30 dark:ring-emerald-500/40'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <div className="min-w-0">
              <div className="text-xs font-bold leading-tight truncate">Low Risk</div>
              <div className="text-[11px] font-medium opacity-75 truncate">Nifty 500</div>
            </div>
            <span
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                universe === 'nifty500'
                  ? 'bg-emerald-500'
                  : 'bg-slate-300 dark:bg-slate-700'
              }`}
            />
          </button>

          <button
            type="button"
            disabled={isScanning}
            onClick={() => {
              if (universe !== 'nifty1000') {
                setUniverse('nifty1000');
                handleDailyUpdate('nifty1000');
              }
            }}
            className={`min-h-[44px] px-3 py-2 rounded-xl text-left flex items-center justify-between gap-2 transition-colors disabled:opacity-60 ${
              universe === 'nifty1000'
                ? 'bg-white dark:bg-[#1C2638] text-slate-900 dark:text-white shadow-xs ring-1 ring-amber-600/40 dark:ring-amber-500/50'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <div className="min-w-0">
              <div className="text-xs font-bold leading-tight truncate">High Risk</div>
              <div className="text-[11px] font-medium opacity-75 truncate">Nifty 1000</div>
            </div>
            <span
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                universe === 'nifty1000'
                  ? 'bg-amber-500'
                  : 'bg-slate-300 dark:bg-slate-700'
              }`}
            />
          </button>
        </div>
      )}

      {isScanning && activeSetups.length > 0 && (
        <div className="flex items-center gap-2 rounded-xl bg-blue-50 dark:bg-blue-950/35 border border-blue-200 dark:border-blue-900/60 px-3.5 py-2 text-xs text-blue-900 dark:text-blue-200">
          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0 text-blue-700 dark:text-blue-400" />
          <span>
            {universe === 'nifty1000'
              ? 'High Risk · Nifty 1000 stocks scan ho rahe hain (Entered stocks safe rahenge)...'
              : 'Low Risk · Nifty 500 stocks scan ho rahe hain (Entered stocks safe rahenge)...'}
          </span>
        </div>
      )}

      {/* Underline Filter Tabs (All / Entered / Open / Closed) */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-4 sm:gap-6 text-sm font-medium overflow-x-auto no-scrollbar">
          {(
            [
              { id: 'all', label: 'All', count: activeSetups.length },
              { id: 'entered', label: 'Entered', count: enteredCount },
              { id: 'open', label: 'Open', count: openCount },
              { id: 'closed', label: 'Closed', count: closedCount },
            ] as const
          ).map((tab) => {
            const active = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`pb-2.5 border-b-2 inline-flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'border-blue-800 dark:border-blue-400 text-blue-900 dark:text-blue-300 font-semibold'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                <span className="text-xs font-mono tabular-nums opacity-75">({tab.count})</span>
              </button>
            );
          })}
        </div>

        {sectionPlans.length > 1 && (
          <select
            aria-label="Select month"
            value={selectedPlanId}
            onChange={(e) => {
              setSelectedPlanId(e.target.value);
              setSelectedSetupId(null);
            }}
            className="mb-1.5 px-2 py-1 rounded-lg bg-transparent text-xs font-medium text-slate-600 dark:text-slate-400 focus:outline-none"
          >
            {sectionPlans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.monthLabel}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Stale Previous-Day Reminder (Only when list is from an earlier date) */}
      {isStaleDailyList && (
        <div className="rounded-xl bg-blue-50 dark:bg-blue-950/35 border border-blue-200 dark:border-blue-900/60 px-3.5 py-2.5 flex items-center justify-between gap-3 text-xs text-blue-900 dark:text-blue-200">
          <span>Purane din ({activePlan?.asOfDate}) ka data hai — aaj ka update check karein.</span>
          <button
            type="button"
            onClick={() => handleDailyUpdate()}
            disabled={isScanning}
            className="font-semibold text-blue-700 dark:text-blue-400 hover:underline shrink-0"
          >
            Refresh
          </button>
        </div>
      )}

      {/* Collapsible Filter / Settings / Manual Call / Parameters Drawer */}
      {showSettingsDrawer && (
        <section className="rounded-2xl bg-white dark:bg-[#131A26] border border-slate-200 dark:border-slate-800 p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Market */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-[#0B0F17]">
              {(['NSE', 'US'] as SwingMarket[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMarket(m)}
                  className={`min-h-[34px] px-3 rounded-lg text-xs font-medium transition-colors ${
                    market === m
                      ? 'bg-white dark:bg-[#1C2536] text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {m === 'NSE' ? 'NSE (₹)' : 'US ($)'}
                </button>
              ))}
            </div>

            {/* Max 1-3 calls */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-500 dark:text-slate-400">Max:</span>
              {([1, 2, 3] as const).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setSetupCount(n)}
                  className={`min-h-[34px] min-w-[34px] rounded-lg font-mono font-semibold transition-colors ${
                    setupCount === n
                      ? 'bg-blue-700 text-white'
                      : 'bg-slate-100 dark:bg-[#0B0F17] text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>

            {/* Language */}
            <select
              aria-label="Language"
              value={language}
              onChange={(e) => setLanguage(e.target.value as ResearchLanguage)}
              className="min-h-[36px] px-2.5 rounded-xl bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200"
            >
              <option value="hinglish">Hinglish</option>
              <option value="hi">Hindi</option>
              <option value="en">English</option>
            </select>

            <button
              type="button"
              onClick={() => {
                setManualError(null);
                setShowManualForm((v) => !v);
              }}
              className="inline-flex items-center gap-1 min-h-[36px] px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Manual Call</span>
            </button>
          </div>

          {showManualForm && (
            <form
              onSubmit={handleAddManualSetup}
              className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2.5"
            >
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <input
                  type="text"
                  value={manualSymbol}
                  onChange={(e) => setManualSymbol(e.target.value)}
                  placeholder="Symbol (GPPL)"
                  className="min-h-[40px] px-3 rounded-xl bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 text-xs font-mono uppercase text-slate-900 dark:text-slate-100"
                />
                <input
                  type="text"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  placeholder="Company Name"
                  className="min-h-[40px] px-3 rounded-xl bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100"
                />
                <input
                  type="number"
                  step="any"
                  value={manualEntryMin}
                  onChange={(e) => setManualEntryMin(e.target.value)}
                  placeholder="Entry Min"
                  className="min-h-[40px] px-3 rounded-xl bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 text-xs tabular-nums text-slate-900 dark:text-slate-100"
                />
                <input
                  type="number"
                  step="any"
                  value={manualEntryMax}
                  onChange={(e) => setManualEntryMax(e.target.value)}
                  placeholder="Entry Max"
                  className="min-h-[40px] px-3 rounded-xl bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 text-xs tabular-nums text-slate-900 dark:text-slate-100"
                />
                <input
                  type="number"
                  step="any"
                  value={manualSl}
                  onChange={(e) => setManualSl(e.target.value)}
                  placeholder="Stoploss"
                  className="min-h-[40px] px-3 rounded-xl bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 text-xs tabular-nums text-slate-900 dark:text-slate-100"
                />
                <input
                  type="number"
                  step="any"
                  value={manualT1}
                  onChange={(e) => setManualT1(e.target.value)}
                  placeholder="Target 1"
                  className="min-h-[40px] px-3 rounded-xl bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 text-xs tabular-nums text-slate-900 dark:text-slate-100"
                />
                <input
                  type="number"
                  step="any"
                  value={manualT2}
                  onChange={(e) => setManualT2(e.target.value)}
                  placeholder="Target 2"
                  className="min-h-[40px] px-3 rounded-xl bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 text-xs tabular-nums text-slate-900 dark:text-slate-100"
                />
                <input
                  type="text"
                  value={manualRule}
                  onChange={(e) => setManualRule(e.target.value)}
                  placeholder="Entry note"
                  className="min-h-[40px] px-3 rounded-xl bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100"
                />
              </div>
              {manualError && <p className="text-xs text-red-600 dark:text-red-400">{manualError}</p>}
              <button
                type="submit"
                className="min-h-[40px] px-4 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 text-xs font-medium"
              >
                Save Call
              </button>
            </form>
          )}

          {/* Transparent 8 Daily Parameters Checked for This Section */}
          <SectionParameterBlueprint
            section={section}
            heading={`${cfg.title} — Daily Parameters Checked (8 Checks)`}
          />
        </section>
      )}

      {(scanError || recheckError) && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 p-3.5 text-sm text-red-700 dark:text-red-300"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{scanError || recheckError}</span>
        </div>
      )}

      {/* Broker-Style Clean Trading Calls List (Exact Screenshot 2 Rhythm) */}
      {isScanning && activeSetups.length === 0 ? (
        <section className="rounded-2xl bg-white dark:bg-[#131A26] border border-slate-200 dark:border-slate-800 p-10 text-center space-y-2">
          <Loader2 className="w-6 h-6 animate-spin text-blue-700 dark:text-blue-400 mx-auto" />
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Checking previous day data &amp; 8 parameters...
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            High-accuracy 1–3 {cfg.title} filter ho rahi hain.
          </p>
        </section>
      ) : filteredSetups.length === 0 ? (
        <section className="rounded-2xl bg-white dark:bg-[#131A26] border border-slate-200 dark:border-slate-800 p-8 text-center space-y-3">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {activeSetups.length === 0
              ? `Aaj ki ${cfg.title} abhi load nahi hain`
              : 'Is filter me koi call nahi hai'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {activePlan?.marketNote ||
              'Daily Update tap karein — pichhle trading din ke closing data + 5 angles par 1 se 3 high-accuracy calls yahan clean list me aa jayengi.'}
          </p>
          {activeSetups.length === 0 && (
            <button
              type="button"
              onClick={() => handleDailyUpdate()}
              disabled={isScanning}
              className="inline-flex items-center gap-2 min-h-[44px] px-5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>
                Load {universe === 'nifty1000' ? 'Nifty 1000' : 'Nifty 500'} {cfg.title}
              </span>
            </button>
          )}
        </section>
      ) : (
        <section className="rounded-2xl bg-white dark:bg-[#131A26] border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/80 overflow-hidden">
          {filteredSetups.map((setup) => {
            const curr = setup.currency || activeCurrency;
            const isSell = setup.direction === 'Short';
            const rowActualEntry = Number(setup.actualEntry) || 0;
            const midEntry =
              rowActualEntry > 0
                ? rowActualEntry
                : (setup.entryMin + setup.entryMax) / 2 || setup.currentPrice;
            const stInfo = statusDisplay(setup.status);
            const liveSignal = setup.liveCheck ? SIGNAL_META[setup.liveCheck.actionSignal] : null;
            const isClosedOrSl =
              setup.status === 'sl_hit' || setup.status === 'closed' || setup.status === 'target_hit';
            const isEnteredRow = setup.status === 'entered';
            const rowPnlPct =
              isEnteredRow && rowActualEntry > 0 && setup.currentPrice > 0
                ? ((isSell
                    ? rowActualEntry - setup.currentPrice
                    : setup.currentPrice - rowActualEntry) /
                    rowActualEntry) *
                  100
                : null;

            return (
              <button
                key={setup.id}
                type="button"
                onClick={() => setSelectedSetupId(setup.id)}
                className="w-full text-left px-4 sm:px-5 py-4 hover:bg-slate-50 dark:hover:bg-[#172030] transition-colors space-y-2 focus-visible:outline-2 focus-visible:outline-blue-600"
              >
                {/* Row 1: Date · Status · Live Exit Alert */}
                <div className="flex items-center justify-between gap-2 text-xs tabular-nums">
                  <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-slate-500 dark:text-slate-400">
                    <span>{setup.callDate || setup.asOfDate || currentMonth.todayShort}</span>
                    {setup.universe === 'nifty1000' && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-semibold text-amber-700 dark:text-amber-400">
                          Nifty 1000
                        </span>
                      </>
                    )}
                    {isEnteredRow && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="inline-flex items-center gap-1 font-semibold uppercase text-blue-700 dark:text-blue-400">
                          <Lock className="w-3 h-3" />
                          <span>ENTERED</span>
                        </span>
                      </>
                    )}
                    {!isEnteredRow && setup.status !== 'watching' && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className={`font-semibold uppercase ${stInfo.colorClass}`}>
                          {stInfo.label}
                        </span>
                      </>
                    )}
                    {liveSignal && setup.liveCheck?.actionSignal !== 'HOLD' && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className={`font-semibold ${liveSignal.textClass}`}>
                          {liveSignal.shortLabel}
                        </span>
                      </>
                    )}
                    {(() => {
                      const rowExp = getCallExpiryAlert(setup);
                      if (!rowExp) return null;
                      return (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className={`font-semibold uppercase ${rowExp.colorClass}`}>
                            {rowExp.label}
                          </span>
                        </>
                      );
                    })()}
                  </div>

                  <span className="font-mono text-xs font-semibold tabular-nums">
                    {setup.parameters && setup.parameters.length > 0 && (
                      <>
                        <span className="text-slate-600 dark:text-slate-300">
                          {setup.parameters.filter((p) => p.status === 'pass').length}/
                          {setup.parameters.length} Pass
                        </span>
                        <span aria-hidden="true" className="mx-1.5 text-slate-400">
                          ·
                        </span>
                      </>
                    )}
                    <span className={ratingColor(setup.hdRating)}>
                      HD {setup.hdRating.toFixed(1)}/10
                    </span>
                  </span>
                </div>

                {/* Row 2: SYMBOL on left, BUY/SELL or Live P&L on right */}
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-base font-bold font-mono tracking-tight text-slate-900 dark:text-slate-100">
                    {setup.symbol}
                  </span>
                  {rowPnlPct !== null ? (
                    <span
                      className={`text-sm font-mono font-bold tabular-nums ${
                        rowPnlPct >= 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {rowPnlPct >= 0 ? '+' : ''}
                      {rowPnlPct.toFixed(2)}%
                    </span>
                  ) : (
                    <span
                      className={`text-sm font-bold tracking-wide ${
                        isSell
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-blue-800 dark:text-blue-400'
                      }`}
                    >
                      {isSell ? 'SELL' : 'BUY'}
                    </span>
                  )}
                </div>

                {/* Row 3: LTP (or My Entry + LTP) on left, TARGET + % on right */}
                <div className="flex items-baseline justify-between gap-3 text-xs sm:text-sm tabular-nums">
                  <div className="text-slate-500 dark:text-slate-400">
                    {isEnteredRow && rowActualEntry > 0 ? (
                      <>
                        <span>
                          ENTRY{' '}
                          <span className="font-mono font-semibold text-blue-700 dark:text-blue-400">
                            {formatPrice(rowActualEntry, curr)}
                          </span>
                        </span>
                        <span aria-hidden="true" className="mx-1.5">·</span>
                        <span>
                          LTP{' '}
                          <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                            {formatPrice(setup.currentPrice, curr)}
                          </span>
                        </span>
                      </>
                    ) : (
                      <>
                        LTP{' '}
                        <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                          {formatPrice(setup.currentPrice, curr)}
                        </span>
                      </>
                    )}
                  </div>

                  <div className="text-right font-mono shrink-0">
                    <span className="font-sans text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400 mr-1.5">
                      TARGET
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {formatNum(setup.target1, curr)}
                    </span>
                    {!isClosedOrSl && (
                      <span className="ml-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                        {pctDiff(midEntry, setup.target1)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Row 4: CALL EXP. DATE on left, STOPLOSS -% on right */}
                <div className="flex items-baseline justify-between gap-3 text-xs sm:text-sm tabular-nums">
                  <div className="text-slate-500 dark:text-slate-400 truncate">
                    <span className="text-[11px] uppercase tracking-wide">
                      {isEnteredRow ? 'HOLDING' : 'CALL EXP. DATE'}
                    </span>
                    <span className="mx-1">·</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {isEnteredRow
                        ? 'Locked until Exit'
                        : setup.callExpiryDate || setup.holdingWindow}
                    </span>
                  </div>

                  <div className="text-right font-mono shrink-0">
                    <span className="font-sans text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400 mr-1.5">
                      STOPLOSS
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {formatNum(setup.stopLoss, curr)}
                    </span>
                    {!isClosedOrSl && (
                      <span className="ml-1.5 font-semibold text-red-600 dark:text-red-400">
                        {pctDiff(midEntry, setup.stopLoss)}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </section>
      )}

      {activePlan?.marketNote && activeSetups.length > 0 && (
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed px-1">
          <strong className="text-slate-700 dark:text-slate-300 font-medium">Market Pulse:</strong>{' '}
          {activePlan.marketNote}
        </p>
      )}
    </div>
  );
};
