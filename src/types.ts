export type TradingSection = 'swing' | 'short_term' | 'long_term' | 'mtf';

export type NavTab = 'deep_research' | TradingSection | 'performance';

export type ResearchLanguage = 'auto' | 'en' | 'hi' | 'hinglish';

export type SwingMarket = 'NSE' | 'US';

export type UniverseMode = 'nifty500' | 'nifty1000';

export type TradeStatus = 'watching' | 'entered' | 'target_hit' | 'sl_hit' | 'closed';

export type LiveExitSignal =
  | 'WAIT_ENTRY'
  | 'HOLD'
  | 'TRAIL_SL'
  | 'BOOK_PARTIAL'
  | 'EXIT_NOW';

export interface GroundingSource {
  index: number;
  title: string;
  uri: string;
  domain: string;
}

export type ParameterStatus = 'pass' | 'caution' | 'fail';

export type ParameterCategory =
  | 'Technical'
  | 'Price Action'
  | 'Fundamental'
  | 'News'
  | 'Safety';

export interface ParameterCheck {
  category: ParameterCategory;
  name: string;
  value: string;
  status: ParameterStatus;
  note: string;
}

export interface AngleScores {
  technical: number;
  priceAction: number;
  fundamentals: number;
  news: number;
  safety: number;
}

export interface LiveRecheckUpdate {
  latestPrice: number;
  prevClose: number;
  actionSignal: LiveExitSignal;
  suggestedTrailingSl?: number;
  exitReason: string;
  newsAlert: string;
  checkedAt: string;
}

export interface TradeSetup {
  id: string;
  section: TradingSection;
  universe?: UniverseMode;
  symbol: string;
  companyName: string;
  exchange: string;
  sector: string;
  currency: '₹' | '$';
  direction: 'Long' | 'Short';
  currentPrice: number;
  prevClose?: number;
  dayChangePct?: number;
  asOfDate?: string;
  callDate?: string;
  callExpiryDate?: string;
  hdRating: number; // Out of 10
  angleScores?: AngleScores;
  parameters?: ParameterCheck[];
  entryMin: number;
  entryMax: number;
  stopLoss: number;
  target1: number;
  target2: number;
  riskReward: string;
  holdingWindow: string;
  expiryDays?: number;
  slLogic?: string;
  targetLogic?: string;
  expiryLogic?: string;
  setupType: string;
  entryRule: string;
  exitRule: string;
  rationale: string;
  strengths?: string[];
  weaknesses?: string[];
  trapWarning?: string;
  newsSummary?: string;
  mtfLeverage?: string;
  status: TradeStatus;
  liveCheck?: LiveRecheckUpdate;
  userNotes?: string;
  actualEntry?: string;
  actualExit?: string;
  actualQty?: string;
  enteredAt?: string;
  exitedAt?: string;
  sources: GroundingSource[];
  createdAt: string;
  updatedAt?: string;
}

export interface SectionPlan {
  id: string; // `${section}_${monthKey}`
  section: TradingSection;
  monthKey: string; // e.g. "2026-11"
  monthLabel: string; // e.g. "November 2026"
  market: SwingMarket;
  universe?: UniverseMode;
  language: ResearchLanguage;
  asOfDate?: string;
  marketNote?: string;
  setups: TradeSetup[];
  generatedAt: string;
}

export interface DeepAngleDetail {
  score: number; // 0 to 10
  summary: string;
  highlights: string[];
}

export interface KeyIndicatorItem {
  label: string;
  value: string;
}

export interface MomentumMetric {
  period: string;
  returnPct: string;
}

export interface StockNewsItem {
  title: string;
  date: string;
  summary: string;
  importance: number; // 1 to 10
  sentiment: 'Positive' | 'Neutral' | 'Negative';
}

export interface SectionRiskSnapshot {
  entryMin: number;
  entryMax: number;
  stopLoss: number;
  target1: number;
  target2: number;
  riskReward: string;
  holdingWindow: string;
  expiryDays: number;
  slLogic: string;
  targetLogic: string;
  expiryLogic: string;
}

export interface StockDeepReport {
  id: string;
  query: string;
  symbol: string;
  companyName: string;
  exchange: string;
  sector: string;
  currency: '₹' | '$';
  currentPrice: number;
  prevClose: number;
  dayChangePct?: number;
  asOfDate: string;
  hdRating: number; // 0 to 10
  fairValue?: number;
  fairValueUpsidePct?: number;
  verdict: string;
  bestFitSection: TradingSection | 'avoid';
  mtfEligible: boolean;
  simpleSummary: string;
  keyIndicators?: KeyIndicatorItem[];
  technicalSummary?: {
    overall: string;
    movingAverages: string;
    indicators: string;
  };
  momentum?: MomentumMetric[];
  strengths: string[];
  weaknesses: string[];
  bullCase?: string[];
  bearCase?: string[];
  swot?: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  recentNews?: StockNewsItem[];
  trapAlert: string;
  entryMin: number;
  entryMax: number;
  stopLoss: number;
  target1: number;
  target2: number;
  riskReward: string;
  holdingWindow: string;
  expiryDays?: number;
  slLogic?: string;
  targetLogic?: string;
  expiryLogic?: string;
  mtfLeverage?: string;
  sectionPlans?: Record<TradingSection, SectionRiskSnapshot>;
  entryRule: string;
  exitRule: string;
  angles: {
    technical: DeepAngleDetail;
    priceAction: DeepAngleDetail;
    fundamentals: DeepAngleDetail;
    news: DeepAngleDetail;
    safety: DeepAngleDetail;
  };
  parameters?: ParameterCheck[];
  sources: GroundingSource[];
  language: ResearchLanguage;
  market: SwingMarket;
  createdAt: string;
}

export interface GitHubSyncStatus {
  latestCommitSha: string;
  latestCommitMessage: string;
  latestCommitDate: string;
  hasWorkflow: boolean;
  hasCapacitorConfig: boolean;
  hasSharedData?: boolean;
  latestReleaseTag: string;
  latestReleaseUrl: string;
  releaseNotes?: string;
  apkDownloadUrl: string;
  apkFileName: string;
  apkSize: number;
  remoteReportsCount: number;
  syncedAt: string;
}
