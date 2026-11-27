import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Download,
  Megaphone,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  X,
} from 'lucide-react';
import { GitHubSyncStatus } from '../types';
import {
  APP_VERSION,
  DEFAULT_GITHUB_REPO_URL,
  formatVersionTag,
  isMandatoryApkUpdate,
  isNewerReleaseTag,
  pickHigherVersion,
  RemoteAppConfig,
} from '../config/appConfig';
import { isBundledNativeApk } from '../utils/runtimeApi';

interface AppUpdateBannerProps {
  syncStatus: GitHubSyncStatus | null;
  remoteConfig: RemoteAppConfig | null;
  isCheckingUpdate?: boolean;
  onRecheckUpdate?: () => void;
}

const SESSION_DISMISSED_KEY = 'hd_dismissed_apk_update_tag_v1';

function isSafeHttpsUrl(raw?: string): boolean {
  if (!raw) return false;
  try {
    const parsed = new URL(raw);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function parseReleaseHighlights(updateNotes?: string, releaseNotes?: string): string[] {
  const preferred = (updateNotes || '').trim();
  if (preferred) {
    return preferred
      .split(/[;\n]+/)
      .map((item) => item.replace(/^[-*•\d.)\s]+/, '').trim())
      .filter((item) => item.length > 4)
      .slice(0, 4);
  }

  const raw = (releaseNotes || '').trim();
  if (!raw) return [];

  const bulletLines = raw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /^[-*•]\s+/.test(line))
    .map((line) => line.replace(/^[-*•]\s+/, '').replace(/\*\*/g, '').trim())
    .filter((line) => line.length > 6 && !/^download\s+/i.test(line));

  return bulletLines.slice(0, 4);
}

export const AppUpdateBanner: React.FC<AppUpdateBannerProps> = ({
  syncStatus,
  remoteConfig,
  isCheckingUpdate = false,
  onRecheckUpdate,
}) => {
  const [pwaUpdateReady, setPwaUpdateReady] = useState<boolean>(() =>
    typeof window !== 'undefined' ? Boolean(window.__hdPwaUpdateReady) : false
  );
  const [applyingPwaUpdate, setApplyingPwaUpdate] = useState(false);

  const [dismissedTag, setDismissedTag] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem(SESSION_DISMISSED_KEY);
    } catch {
      return null;
    }
  });
  const [dismissedNotice, setDismissedNotice] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.__hdPwaUpdateReady) {
      setPwaUpdateReady(true);
    }
    const handleReady = () => setPwaUpdateReady(true);
    window.addEventListener('hd-pwa-update-ready', handleReady);
    return () => {
      window.removeEventListener('hd-pwa-update-ready', handleReady);
    };
  }, []);

  const isNativeApk = useMemo(() => isBundledNativeApk(), []);

  const latestVersion = useMemo(
    () => pickHigherVersion(syncStatus?.latestReleaseTag, remoteConfig?.latestAppVersion),
    [syncStatus?.latestReleaseTag, remoteConfig?.latestAppVersion]
  );

  const hasNewerApk = Boolean(latestVersion) && isNewerReleaseTag(latestVersion, APP_VERSION);

  const downloadUrl = useMemo(() => {
    if (isSafeHttpsUrl(syncStatus?.apkDownloadUrl)) {
      return syncStatus!.apkDownloadUrl;
    }
    if (isSafeHttpsUrl(syncStatus?.latestReleaseUrl)) {
      return syncStatus!.latestReleaseUrl;
    }
    return `${DEFAULT_GITHUB_REPO_URL}/releases/latest`;
  }, [syncStatus]);

  const isMandatoryLock =
    isNativeApk && hasNewerApk && isMandatoryApkUpdate(latestVersion, APP_VERSION, remoteConfig);

  const highlights = useMemo(
    () => parseReleaseHighlights(remoteConfig?.updateNotes, syncStatus?.releaseNotes),
    [remoteConfig?.updateNotes, syncStatus?.releaseNotes]
  );

  useEffect(() => {
    if (!isMandatoryLock || typeof document === 'undefined') return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isMandatoryLock]);

  const handleDismissApkBanner = (tag: string) => {
    setDismissedTag(tag);
    try {
      sessionStorage.setItem(SESSION_DISMISSED_KEY, tag);
    } catch {
      // Ignore storage failures
    }
  };

  const handleApplyPwaUpdate = async () => {
    setApplyingPwaUpdate(true);
    try {
      if (window.__hdApplyPwaUpdate) {
        await window.__hdApplyPwaUpdate();
      } else {
        window.location.reload();
      }
    } catch {
      window.location.reload();
    }
  };

  const latestLabel = formatVersionTag(latestVersion);
  const currentLabel = formatVersionTag(APP_VERSION);
  const apkSizeMb =
    syncStatus && syncStatus.apkSize > 0
      ? `${(syncStatus.apkSize / (1024 * 1024)).toFixed(1)} MB`
      : '';

  // Mandatory full-screen lock ONLY inside installed Android APK on major/required updates
  if (isMandatoryLock) {
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="mandatory-update-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-sm"
      >
        <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#131A26] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
          <div className="p-6 sm:p-7">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-400 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                  Major Update Required
                </p>
                <h2
                  id="mandatory-update-title"
                  className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mt-0.5 font-display"
                >
                  Naya App Version Available
                </h2>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 text-xs font-semibold tabular-nums">
              <span className="text-slate-500 dark:text-slate-400">{currentLabel}</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-blue-700 dark:text-blue-400">{latestLabel}</span>
              {apkSizeMb && (
                <span className="ml-auto text-slate-500 dark:text-slate-400 font-medium">
                  {apkSizeMb}
                </span>
              )}
            </div>

            <p className="mt-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Is major update ke bina app continue nahi hoga. Latest features aur accurate live
              scanners ke liye naya APK download aur install karein.
            </p>

            {highlights.length > 0 && (
              <div className="mt-4 rounded-xl bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 p-3.5">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 mb-2">
                  Is update me kya naya hai:
                </p>
                <ul className="space-y-1.5">
                  {highlights.map((item, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-5 space-y-2.5">
              <a
                href={downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full min-h-[48px] inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold px-4 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download &amp; Update APK ({latestLabel})</span>
              </a>

              {onRecheckUpdate && (
                <button
                  type="button"
                  onClick={onRecheckUpdate}
                  disabled={isCheckingUpdate}
                  className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold px-4 transition-colors disabled:opacity-60"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isCheckingUpdate ? 'animate-spin' : ''}`} />
                  <span>{isCheckingUpdate ? 'Checking for update...' : 'Recheck Version'}</span>
                </button>
              )}
            </div>

            <p className="mt-4 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed text-center">
              APK download hone par file open karke Update/Install dabayein. Aapke saved trades aur
              reports safe rahenge.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const showOptionalApkBanner =
    hasNewerApk &&
    Boolean(syncStatus?.apkDownloadUrl || isNativeApk) &&
    dismissedTag !== latestVersion;

  const announcement = (remoteConfig?.announcement || '').trim();
  const showAnnouncement = Boolean(announcement) && !dismissedNotice;

  if (!pwaUpdateReady && !showOptionalApkBanner && !showAnnouncement) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 space-y-2">
      {pwaUpdateReady && !isNativeApk && (
        <div className="rounded-xl bg-emerald-700 text-white px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-2.5 min-w-0">
            <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-emerald-100" />
            <div className="min-w-0">
              <div className="text-sm font-semibold">App Update Ready</div>
              <div className="text-xs text-emerald-100 mt-0.5">
                Naya version download ho chuka hai — apply karne ke liye Update Now dabayein.
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleApplyPwaUpdate}
            disabled={applyingPwaUpdate}
            className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 rounded-lg bg-white text-emerald-900 font-semibold text-xs hover:bg-emerald-50 transition-colors whitespace-nowrap shrink-0 disabled:opacity-70"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${applyingPwaUpdate ? 'animate-spin' : ''}`} />
            <span>{applyingPwaUpdate ? 'Updating...' : 'Update Now'}</span>
          </button>
        </div>
      )}

      {showOptionalApkBanner && (
        <div className="rounded-xl bg-blue-700 text-white px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-semibold">
              {isNativeApk
                ? `App Update Available (${latestLabel})`
                : `New Android APK Available (${latestLabel})`}
            </div>
            <div className="text-xs text-blue-100 mt-0.5 tabular-nums">
              Current {currentLabel} → {latestLabel}
              {apkSizeMb ? ` · ${apkSizeMb}` : ''}
              {highlights[0] ? ` · ${highlights[0]}` : ''}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 rounded-lg bg-white text-blue-900 font-semibold text-xs hover:bg-blue-50 transition-colors whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Update APK</span>
            </a>
            <button
              type="button"
              onClick={() => handleDismissApkBanner(latestVersion)}
              aria-label="Dismiss update banner"
              className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-blue-100 hover:bg-blue-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {showAnnouncement && (
        <div className="rounded-xl bg-white dark:bg-[#131A26] border border-slate-200 dark:border-slate-800 px-4 py-2.5 flex items-center justify-between gap-3 text-xs text-slate-700 dark:text-slate-300">
          <div className="flex items-center gap-2.5 min-w-0">
            <Megaphone className="w-4 h-4 text-blue-700 dark:text-blue-400 shrink-0" />
            <span className="truncate">{announcement}</span>
          </div>
          <button
            type="button"
            onClick={() => setDismissedNotice(true)}
            aria-label="Dismiss announcement"
            className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
