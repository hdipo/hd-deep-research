import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  Clock,
  Landmark,
  Moon,
  Search,
  Sun,
  TrendingUp,
  Zap,
} from 'lucide-react';
import {
  GitHubSyncStatus,
  NavTab,
  SectionPlan,
  StockDeepReport,
  TradeSetup,
  TradingSection,
} from './types';
import { DeepResearchStockView } from './components/DeepResearchStockView';
import { TradingDeskView } from './components/TradingDeskView';
import { PerformanceView } from './components/PerformanceView';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';
import { AppUpdateBanner } from './components/AppUpdateBanner';
import { DEFAULT_GITHUB_REPO_URL, RemoteAppConfig } from './config/appConfig';
import { fetchAppUpdateSync } from './utils/runtimeApi';

const STORAGE_PLANS = 'hd_trading_desk_plans_v1';
const STORAGE_DEEP_REPORTS = 'hd_stock_deep_reports_v1';
const STORAGE_LEGACY_SWING = 'hd_deep_research_swing_plans_v1';
const STORAGE_THEME = 'hd_deep_research_theme_v1';
const STORAGE_REMOTE_CONFIG = 'hd_deep_research_remote_config_v1';

const NAV_ITEMS: Array<{
  id: NavTab;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'deep_research', label: 'HD Research', shortLabel: 'HD Check', icon: Search },
  { id: 'swing', label: 'Swing Trading', shortLabel: 'Swing', icon: TrendingUp },
  { id: 'short_term', label: 'Short Term', shortLabel: 'Short', icon: Clock },
  { id: 'long_term', label: 'Long Term', shortLabel: 'Long', icon: Landmark },
  { id: 'mtf', label: 'MTF', shortLabel: 'MTF', icon: Zap },
  { id: 'performance', label: 'Performance', shortLabel: 'Stats', icon: BarChart3 },
];

function loadInitialPlans(): SectionPlan[] {
  try {
    const raw = localStorage.getItem(STORAGE_PLANS);
    if (raw) {
      const parsed = JSON.parse(raw) as SectionPlan[];
      if (Array.isArray(parsed)) return parsed;
    }

    const legacyRaw = localStorage.getItem(STORAGE_LEGACY_SWING);
    if (legacyRaw) {
      const legacy = JSON.parse(legacyRaw) as Array<{
        monthKey: string;
        monthLabel: string;
        market: 'NSE' | 'US';
        language: 'auto' | 'en' | 'hi' | 'hinglish';
        setups: Array<Omit<TradeSetup, 'section' | 'hdRating'>>;
        generatedAt: string;
      }>;
      if (Array.isArray(legacy) && legacy.length > 0) {
        return legacy.map((p) => ({
          id: `swing_${p.monthKey}`,
          section: 'swing' as TradingSection,
          monthKey: p.monthKey,
          monthLabel: p.monthLabel,
          market: p.market,
          language: p.language,
          setups: (p.setups || []).slice(0, 3).map((s) => ({
            ...s,
            section: 'swing',
            hdRating: 7.8,
          })),
          generatedAt: p.generatedAt,
        }));
      }
    }
  } catch {
    // Ignore storage read errors
  }
  return [];
}

function loadInitialDeepReports(): StockDeepReport[] {
  try {
    const raw = localStorage.getItem(STORAGE_DEEP_REPORTS);
    if (raw) {
      const parsed = JSON.parse(raw) as StockDeepReport[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // Ignore
  }
  return [];
}

function parseRepoOwnerAndName(url: string): { owner: string; repo: string } | null {
  const match = url.match(/github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)/i);
  if (!match) return null;
  return { owner: match[1], repo: match[2].replace(/\.git$/i, '') };
}

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('deep_research');
  const [pendingDeepSymbol, setPendingDeepSymbol] = useState<string | null>(null);

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_THEME);
      if (saved === 'dark') return true;
      if (saved === 'light') return false;
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  const [plans, setPlans] = useState<SectionPlan[]>(() => loadInitialPlans());
  const [deepReports, setDeepReports] = useState<StockDeepReport[]>(() =>
    loadInitialDeepReports()
  );

  const [remoteConfig, setRemoteConfig] = useState<RemoteAppConfig | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_REMOTE_CONFIG);
      return raw ? (JSON.parse(raw) as RemoteAppConfig) : null;
    } catch {
      return null;
    }
  });

  const [syncStatus, setSyncStatus] = useState<GitHubSyncStatus | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(STORAGE_THEME, darkMode ? 'dark' : 'light');
    } catch {
      // Ignore storage quota errors
    }
  }, [darkMode]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PLANS, JSON.stringify(plans.slice(0, 48)));
    } catch {
      // Ignore storage quota errors
    }
  }, [plans]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_DEEP_REPORTS, JSON.stringify(deepReports.slice(0, 20)));
    } catch {
      // Ignore storage quota errors
    }
  }, [deepReports]);

  // Quiet background check for APK updates / remote API config
  useEffect(() => {
    const parsed = parseRepoOwnerAndName(DEFAULT_GITHUB_REPO_URL);
    if (!parsed) return;
    let cancelled = false;

    fetchAppUpdateSync(parsed.owner, parsed.repo, 'main')
      .then((data) => {
        if (cancelled || !data) return;
        if (data.remoteConfig) {
          setRemoteConfig(data.remoteConfig);
          try {
            localStorage.setItem(STORAGE_REMOTE_CONFIG, JSON.stringify(data.remoteConfig));
          } catch {
            // ignore
          }
        }
        setSyncStatus({
          latestCommitSha: data.latestCommitSha || '',
          latestCommitMessage: data.latestCommitMessage || '',
          latestCommitDate: data.latestCommitDate || '',
          hasWorkflow: Boolean(data.hasWorkflow),
          hasCapacitorConfig: Boolean(data.hasCapacitorConfig),
          hasSharedData: Boolean(data.hasSharedData),
          latestReleaseTag: data.latestReleaseTag || '',
          latestReleaseUrl: data.latestReleaseUrl || '',
          apkDownloadUrl: data.apkDownloadUrl || '',
          apkFileName: data.apkFileName || '',
          apkSize: data.apkSize || 0,
          remoteReportsCount: 0,
          syncedAt: data.syncedAt,
        });
      })
      .catch(() => {
        // Offline; ignore safely
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSavePlan = (nextPlan: SectionPlan) => {
    setPlans((prev) => {
      const enteredSetups = nextPlan.setups.filter((s) => s.status === 'entered');
      const otherSetups = nextPlan.setups.filter((s) => s.status !== 'entered').slice(0, 20);
      const normalized: SectionPlan = {
        ...nextPlan,
        setups: [...enteredSetups, ...otherSetups],
      };
      const filtered = prev.filter((p) => p.id !== normalized.id);
      return [normalized, ...filtered].slice(0, 48);
    });
  };

  const handleUpdateSetup = (planId: string, updatedSetup: TradeSetup) => {
    setPlans((prev) =>
      prev.map((plan) => {
        if (plan.id !== planId) return plan;
        return {
          ...plan,
          generatedAt: new Date().toISOString(),
          setups: plan.setups.map((s) => (s.id === updatedSetup.id ? updatedSetup : s)),
        };
      })
    );
  };

  const handleDeleteSetup = (planId: string, setupId: string) => {
    setPlans((prev) =>
      prev.map((plan) => {
        if (plan.id !== planId) return plan;
        return {
          ...plan,
          generatedAt: new Date().toISOString(),
          setups: plan.setups.filter((s) => s.id !== setupId),
        };
      })
    );
  };

  const handleSaveDeepReport = (report: StockDeepReport) => {
    setDeepReports((prev) => {
      const filtered = prev.filter((r) => r.id !== report.id);
      return [report, ...filtered].slice(0, 20);
    });
  };

  const handleDeleteDeepReport = (id: string) => {
    setDeepReports((prev) => prev.filter((r) => r.id !== id));
  };

  const handleOpenDeepResearch = (symbol: string) => {
    setPendingDeepSymbol(symbol);
    setActiveTab('deep_research');
  };

  const handleAddDeepReportToSection = (report: StockDeepReport, section: TradingSection) => {
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const planId = `${section}_${monthKey}`;

    const sectionExpiryBounds: Record<TradingSection, [number, number, number]> = {
      mtf: [5, 14, 12],
      swing: [7, 30, 21],
      short_term: [32, 88, 65],
      long_term: [370, 730, 450],
    };
    const targetPlan = report.sectionPlans?.[section];
    const [minExp, maxExp, fallbackExp] = sectionExpiryBounds[section];
    const resolvedExpiryDays = targetPlan
      ? targetPlan.expiryDays
      : report.expiryDays && report.expiryDays >= minExp && report.expiryDays <= maxExp
        ? report.expiryDays
        : fallbackExp;
    const callDateLabel = now
      .toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
      .toUpperCase();
    const callExpiryLabel = new Date(
      now.getTime() + resolvedExpiryDays * 24 * 60 * 60 * 1000
    )
      .toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        ...(section === 'long_term' ? { year: 'numeric' as const } : {}),
      })
      .toUpperCase();

    const effEntryMin = targetPlan ? targetPlan.entryMin : report.entryMin;
    const effEntryMax = targetPlan ? targetPlan.entryMax : report.entryMax;
    const effStopLoss = targetPlan ? targetPlan.stopLoss : report.stopLoss;
    const effTarget1 = targetPlan ? targetPlan.target1 : report.target1;
    const effTarget2 = targetPlan ? targetPlan.target2 : report.target2;
    const effRR = targetPlan ? targetPlan.riskReward : report.riskReward;
    const effWindow = targetPlan ? targetPlan.holdingWindow : report.holdingWindow;
    const effSlLogic = targetPlan ? targetPlan.slLogic : report.slLogic;
    const effTargetLogic = targetPlan ? targetPlan.targetLogic : report.targetLogic;
    const effExpiryLogic = targetPlan ? targetPlan.expiryLogic : report.expiryLogic;

    const newSetup: TradeSetup = {
      id: `${section}_hdr_${Date.now()}`,
      section,
      symbol: report.symbol,
      companyName: report.companyName,
      exchange: report.exchange,
      sector: report.sector,
      currency: report.currency,
      direction: effStopLoss > effEntryMax ? 'Short' : 'Long',
      currentPrice: report.currentPrice,
      prevClose: report.prevClose,
      dayChangePct: report.dayChangePct,
      asOfDate: report.asOfDate,
      callDate: callDateLabel,
      callExpiryDate: callExpiryLabel,
      hdRating: report.hdRating,
      angleScores: {
        technical: report.angles.technical.score,
        priceAction: report.angles.priceAction.score,
        fundamentals: report.angles.fundamentals.score,
        news: report.angles.news.score,
        safety: report.angles.safety.score,
      },
      parameters: report.parameters || [],
      entryMin: effEntryMin,
      entryMax: effEntryMax,
      stopLoss: effStopLoss,
      target1: effTarget1,
      target2: effTarget2,
      riskReward: effRR,
      holdingWindow: effWindow,
      expiryDays: resolvedExpiryDays,
      slLogic: effSlLogic,
      targetLogic: effTargetLogic,
      expiryLogic: effExpiryLogic,
      setupType: report.verdict,
      entryRule: report.entryRule,
      exitRule: targetPlan
        ? `Strict SL ${report.currency}${effStopLoss} (${effSlLogic}). Target 1 (${report.currency}${effTarget1}) par 50% book karke Target 2 (${report.currency}${effTarget2}) tak trail karein.`
        : report.exitRule,
      rationale: report.simpleSummary,
      strengths: report.strengths.slice(0, 3),
      weaknesses: report.weaknesses.slice(0, 3),
      trapWarning: report.trapAlert,
      newsSummary: report.angles.news.summary,
      mtfLeverage:
        section === 'mtf'
          ? report.mtfLeverage || (report.mtfEligible ? '2x–3x MTF' : 'Cash Only (Verify MTF)')
          : '',
      status: 'watching',
      sources: report.sources,
      createdAt: new Date().toISOString(),
    };

    setPlans((prev) => {
      const existing = prev.find((p) => p.id === planId);
      const existingList = existing?.setups || [];
      const lockedEntered = existingList.filter((s) => s.status === 'entered');
      const lockedSymbols = new Set(lockedEntered.map((s) => s.symbol.toUpperCase()));
      const otherExisting = existingList.filter(
        (s) =>
          s.status !== 'entered' &&
          s.symbol.toUpperCase() !== newSetup.symbol.toUpperCase()
      );
      const merged = lockedSymbols.has(newSetup.symbol.toUpperCase())
        ? existingList
        : [...lockedEntered, newSetup, ...otherExisting.slice(0, 15)];
      const nextPlan: SectionPlan = {
        id: planId,
        section,
        monthKey,
        monthLabel,
        market: report.market,
        language: report.language,
        asOfDate: report.asOfDate,
        marketNote: existing?.marketNote || '',
        setups: merged,
        generatedAt: new Date().toISOString(),
      };
      const rest = prev.filter((p) => p.id !== planId);
      return [nextPlan, ...rest].slice(0, 48);
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F7F9] dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100">
      {/* Desktop Top Navigation Bar (Strict 3-zone contract) */}
      <header className="hidden lg:flex sticky top-0 z-30 h-16 items-center justify-between gap-8 px-8 bg-white/90 dark:bg-[#0B0F17]/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        {/* Zone 1: Brand Wordmark */}
        <button
          type="button"
          onClick={() => setActiveTab('deep_research')}
          className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap shrink-0 font-display focus-visible:outline-2 focus-visible:outline-blue-600 rounded-md"
        >
          HD Deep Research
        </button>

        {/* Zone 2: Clean Single-Line Nav Links */}
        <nav aria-label="Trading navigation" className="flex items-center gap-6 text-sm font-medium">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`py-1.5 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'border-blue-700 dark:border-blue-500 text-slate-900 dark:text-white'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single Primary Action */}
        <div className="flex items-center shrink-0">
          <PWAInstallButton />
        </div>
      </header>

      {/* Mobile Native Android Top App Bar (Edge-to-Edge safe area compliant) */}
      <header className="lg:hidden sticky top-0 z-30 pt-safe bg-white/90 dark:bg-[#0B0F17]/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="h-[52px] px-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setActiveTab('deep_research')}
            className="flex items-center gap-2.5 min-w-0"
          >
            <img
              src="/icon.svg"
              alt=""
              className="w-7 h-7 rounded-lg shrink-0"
            />
            <span className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100 truncate font-display">
              HD Deep Research
            </span>
          </button>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setDarkMode((v) => !v)}
              aria-label={darkMode ? 'Switch to light theme' : 'Switch to dark theme'}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <PWAInstallButton compact />
          </div>
        </div>
      </header>

      {/* Main Content Workspace */}
      <main className="flex-1 pb-20 lg:pb-10">
        <AppUpdateBanner syncStatus={syncStatus} remoteConfig={remoteConfig} />

        {activeTab === 'deep_research' ? (
          <DeepResearchStockView
            reports={deepReports}
            pendingSymbol={pendingDeepSymbol}
            remoteConfig={remoteConfig}
            onConsumePendingSymbol={() => setPendingDeepSymbol(null)}
            onSaveReport={handleSaveDeepReport}
            onDeleteReport={handleDeleteDeepReport}
            onAddToSection={handleAddDeepReportToSection}
          />
        ) : activeTab === 'performance' ? (
          <PerformanceView
            plans={plans}
            darkMode={darkMode}
            onNavigateTab={setActiveTab}
            onOpenDeepResearch={handleOpenDeepResearch}
          />
        ) : (
          <TradingDeskView
            section={activeTab}
            plans={plans}
            remoteConfig={remoteConfig}
            onSavePlan={handleSavePlan}
            onUpdateSetup={handleUpdateSetup}
            onDeleteSetup={handleDeleteSetup}
            onOpenDeepResearch={handleOpenDeepResearch}
          />
        )}
      </main>

      {/* Quiet Desktop Footer with Theme Switcher */}
      <footer className="hidden lg:flex items-center justify-between gap-4 px-8 py-4 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2.5">
          <span>HD Deep Research</span>
          <span aria-hidden="true">·</span>
          <span>HD Check · Swing · Short Term · Long Term · MTF · Performance</span>
        </div>
        <button
          type="button"
          onClick={() => setDarkMode((v) => !v)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors"
        >
          {darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          <span>{darkMode ? 'Light theme' : 'Dark theme'}</span>
        </button>
      </footer>

      {/* Mobile Native Android Bottom Navigation Bar (6 clean tabs) */}
      <nav
        aria-label="Trading navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#131A26]/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 pb-safe"
      >
        <div className="grid grid-cols-6 h-[60px]">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-label={item.label}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center min-h-[48px] transition-colors ${
                  isActive
                    ? 'text-blue-700 dark:text-blue-400'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <span
                  className={`w-10 h-7 rounded-full flex items-center justify-center transition-colors ${
                    isActive ? 'bg-blue-50 dark:bg-blue-950/70' : ''
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </span>
                <span className="text-[10px] font-medium tracking-tight mt-0.5 leading-none whitespace-nowrap">
                  {item.shortLabel}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      <OfflineIndicator />
    </div>
  );
}
