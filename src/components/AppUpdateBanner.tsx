import React, { useState } from 'react';
import { Download, Megaphone, X } from 'lucide-react';
import { GitHubSyncStatus } from '../types';
import { APP_VERSION, isNewerReleaseTag, RemoteAppConfig } from '../config/appConfig';

interface AppUpdateBannerProps {
  syncStatus: GitHubSyncStatus | null;
  remoteConfig: RemoteAppConfig | null;
}

export const AppUpdateBanner: React.FC<AppUpdateBannerProps> = ({
  syncStatus,
  remoteConfig,
}) => {
  const [dismissedTag, setDismissedTag] = useState<string | null>(null);
  const [dismissedNotice, setDismissedNotice] = useState(false);

  const hasApkUpdate =
    Boolean(syncStatus?.apkDownloadUrl) &&
    Boolean(syncStatus?.latestReleaseTag) &&
    isNewerReleaseTag(syncStatus!.latestReleaseTag, APP_VERSION) &&
    dismissedTag !== syncStatus!.latestReleaseTag;

  const announcement = (remoteConfig?.announcement || '').trim();
  const showAnnouncement = Boolean(announcement) && !dismissedNotice;

  if (!hasApkUpdate && !showAnnouncement) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 space-y-2">
      {hasApkUpdate && syncStatus && (
        <div className="rounded-xl bg-blue-700 text-white px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-semibold">
              Major App Update Available ({syncStatus.latestReleaseTag})
            </div>
            <div className="text-xs text-blue-100 mt-0.5 tabular-nums">
              Current v{APP_VERSION} · Download updated APK directly to your phone
              {syncStatus.apkSize > 0
                ? ` (${(syncStatus.apkSize / (1024 * 1024)).toFixed(1)} MB)`
                : ''}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={syncStatus.apkDownloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 rounded-lg bg-white text-blue-900 font-semibold text-xs hover:bg-blue-50 transition-colors whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Update APK</span>
            </a>
            <button
              type="button"
              onClick={() => setDismissedTag(syncStatus.latestReleaseTag)}
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
